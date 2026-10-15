// La Voie lactée : la vraie photographie panoramique du ciel entier (ESO/S. Brunier, CC BY 4.0), en coordonnées
// galactiques (projection équirectangulaire, centre de la Galaxie au milieu, longitude croissante vers la gauche),
// posée sur une sphère infiniment lointaine, à sa vraie place dans le repère écliptique du jeu. Elle donne la lueur
// diffuse (bandes de poussière, bulbe du Sagittaire, nuages de Magellan) ; les étoiles nettes sont dessinées par-dessus.

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
        vec3 c = texture2D(carte, uv).rgb;
        // Le fond du ciel noir, la lueur ravivée (sans quoi elle se perd dans un petit écran).
        c = max(c - 0.02, 0.0) * 1.35 * eclat;
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
