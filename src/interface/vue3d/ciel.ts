// La Voie lactée : la vraie photographie panoramique du ciel entier (ESO/S. Brunier, CC BY 4.0), en coordonnées
// galactiques (projection équirectangulaire, centre de la Galaxie au milieu, longitude croissante vers la gauche),
// posée sur une sphère infiniment lointaine, à sa vraie place dans le repère écliptique du jeu. Floutée, presque sans
// couleur et atténuée (demande d'Adrien du 15/10/2026) : elle ne donne qu'une brume diffuse (bulbe du Sagittaire,
// bandes de poussière), sans cacher les astres ; les étoiles nettes sont dessinées par-dessus.

import * as THREE from 'three'
import voieLacteeUrl from '../../../assets/textures/voie_lactee_eso0932a.jpg?url'
import { ECL_VERS_GAL } from '../../astro/galaxie'

export interface Ciel {
  maillage: THREE.Mesh
  /** Éclat de la Voie lactée (0 : éteinte, derrière le filtre solaire ; 1 : normale). */
  regler(eclat: number): void
}

export function creerCiel(chargeur: THREE.TextureLoader): Ciel {
  const tx = chargeur.load(voieLacteeUrl)
  // Pas de mipmaps : la couture de la longitude 180° ne laisse pas de trait.
  tx.generateMipmaps = false
  tx.minFilter = THREE.LinearFilter
  tx.wrapS = THREE.RepeatWrapping
  // Direction de three.js (x, y, z) = écliptique (x, z, −y) : écliptique = T · three, puis galactique = M · écliptique.
  const m = ECL_VERS_GAL
  const g = (i: number) => [m[i][0], m[i][2], -m[i][1]] as const
  const [a, b, c] = [g(0), g(1), g(2)]
  const versGal = new THREE.Matrix3().set(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2])
  const materiau = new THREE.ShaderMaterial({
    uniforms: { carte: { value: tx }, versGal: { value: versGal }, eclat: { value: 1 } },
    vertexShader: `
      varying vec3 vDirection;
      void main() {
        vDirection = position;
        // Sphère attachée à la caméra (seule l'orientation de la vue compte) : à l'infini.
        gl_Position = projectionMatrix * vec4(mat3(viewMatrix) * position, 1.0);
      }`,
    fragmentShader: `
      uniform sampler2D carte;
      uniform mat3 versGal;
      uniform float eclat;
      varying vec3 vDirection;
      const float PI = 3.141592653589793;
      void main() {
        vec3 g = normalize(versGal * normalize(vDirection));
        vec2 uv = vec2(0.5 - atan(g.y, g.x) / (2.0 * PI), 0.5 + asin(clamp(g.z, -1.0, 1.0)) / PI);
        // Flou doux (13 échantillons sur environ 2°) : ni pixels, ni étoiles de la photo, seulement la lueur.
        vec2 r = vec2(0.008, 0.016);
        vec3 c = texture2D(carte, uv).rgb * 0.16;
        for (int i = 0; i < 6; i++) {
          float a = float(i) * 1.0471976;
          vec2 d = vec2(cos(a), sin(a));
          c += texture2D(carte, uv + d * r * 0.5).rgb * 0.08;
          c += texture2D(carte, uv + d * r).rgb * 0.06;
        }
        // Presque sans couleur, discrète : le fond noir reste noir, la bande n'est qu'une brume.
        float l = dot(c, vec3(0.299, 0.587, 0.114));
        c = mix(vec3(l), c, 0.3) * vec3(0.95, 0.97, 1.0);
        c = max(c - 0.04, 0.0) * 0.42 * eclat;
        gl_FragColor = vec4(c, 1.0);
        #include <tonemapping_fragment>
      }`,
    side: THREE.BackSide,
    depthTest: false,
    depthWrite: false,
  })
  const maillage = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 32), materiau)
  maillage.renderOrder = -2 // tout au fond, avant les étoiles
  maillage.frustumCulled = false
  return { maillage, regler: (eclat) => (materiau.uniforms.eclat.value = eclat) }
}
