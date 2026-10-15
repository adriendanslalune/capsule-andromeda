// La lueur de la Voie lactée, calculée par le jeu (sans image) : pour chaque point du ciel, ses coordonnées
// galactiques, puis la lumière de la bande — plus forte et plus épaisse vers le centre (bulbe du Sagittaire), un peu
// plus vive vers le Cygne, creusée par la grande faille de poussière, et marbrée d'un bruit doux. Peinte sur une
// sphère attachée à la caméra (à l'infini) ; les étoiles nettes sont dessinées par-dessus (scene.ts).

import * as THREE from 'three'
import { ECL_VERS_GAL } from '../../astro/galaxie'

export interface Ciel {
  maillage: THREE.Mesh
  /** Éclat de la lueur (0 : éteinte, derrière le filtre solaire ; 1 : normale). */
  regler(eclat: number): void
}

export function creerCiel(): Ciel {
  // Direction de three.js (x, y, z) = écliptique (x, z, −y) : écliptique = T · three, puis galactique = M · écliptique.
  const m = ECL_VERS_GAL
  const g = (i: number) => [m[i][0], m[i][2], -m[i][1]] as const
  const [a, b, c] = [g(0), g(1), g(2)]
  const versGal = new THREE.Matrix3().set(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2])
  const materiau = new THREE.ShaderMaterial({
    uniforms: { versGal: { value: versGal }, eclat: { value: 1 } },
    vertexShader: `
      varying vec3 vDirection;
      void main() {
        vDirection = position;
        // Sphère attachée à la caméra (seule l'orientation de la vue compte) : à l'infini.
        gl_Position = projectionMatrix * vec4(mat3(viewMatrix) * position, 1.0);
      }`,
    fragmentShader: `
      uniform mat3 versGal;
      uniform float eclat;
      varying vec3 vDirection;
      const float DEG = 57.29577951;
      // Bruit doux en 3D (sur la direction : pas de couture).
      float hache(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
      float bruit(vec3 p) {
        vec3 i = floor(p), f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(mix(hache(i), hache(i + vec3(1, 0, 0)), f.x), mix(hache(i + vec3(0, 1, 0)), hache(i + vec3(1, 1, 0)), f.x), f.y),
                   mix(mix(hache(i + vec3(0, 0, 1)), hache(i + vec3(1, 0, 1)), f.x), mix(hache(i + vec3(0, 1, 1)), hache(i + vec3(1, 1, 1)), f.x), f.y), f.z);
      }
      void main() {
        vec3 d = normalize(versGal * normalize(vDirection));
        float l = atan(d.y, d.x) * DEG;
        float b = asin(clamp(d.z, -1.0, 1.0)) * DEG;
        // La bande : plus forte vers le centre et le Cygne, plus épaisse dans le bulbe.
        float poids = 0.3 + 0.7 * exp(-pow(l / 38.0, 2.0)) + 0.25 * exp(-pow((l - 78.0) / 22.0, 2.0));
        float epaisseur = 3.2 + 5.5 * exp(-pow(l / 22.0, 2.0));
        float lum = poids * exp(-0.5 * pow(b / epaisseur, 2.0));
        // La grande faille de poussière, du Cygne au Sagittaire, juste au-dessus du plan.
        float dansFaille = smoothstep(-16.0, -8.0, l) * (1.0 - smoothstep(78.0, 86.0, l));
        lum *= 1.0 - 0.42 * dansFaille * exp(-0.5 * pow((b - 0.8 - 0.012 * l) / 1.8, 2.0));
        // Des nuages plus ou moins denses.
        float n = bruit(d * 9.0) * 0.6 + bruit(d * 23.0) * 0.4;
        lum *= 0.55 + 0.9 * n;
        // Couleur : chaude vers le bulbe, plus froide ailleurs.
        vec3 teinte = mix(vec3(0.82, 0.88, 1.0), vec3(1.0, 0.92, 0.8), exp(-pow(l / 30.0, 2.0)));
        gl_FragColor = vec4(teinte * lum * 0.11 * eclat, 1.0);
        #include <tonemapping_fragment>
      }`,
    side: THREE.BackSide,
    depthTest: false,
    depthWrite: false,
  })
  const maillage = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 32), materiau)
  maillage.renderOrder = -3 // tout au fond, avant les étoiles
  maillage.frustumCulled = false
  return { maillage, regler: (eclat) => (materiau.uniforms.eclat.value = eclat) }
}
