// La Terre réaliste : surface du jour (NASA, Blue Marble), lumières des villes sur la face de nuit (Black Marble),
// reflet du Soleil sur les océans, couche de nuages qui dérive, halo de l'atmosphère. Images fournies avec three.js
// (examples/textures/planets), tirées des données publiques de la NASA.
// Orientation réelle : l'axe des pôles incliné de 23,44° sur l'écliptique, et la rotation donnée par le temps
// sidéral de Greenwich : la face éclairée est bien celle où il fait jour.

import * as THREE from 'three'
import jourUrl from '../../../assets/textures/earth_atmos_2048.jpg?url'
import nuitUrl from '../../../assets/textures/earth_lights_2048.png?url'
import nuagesUrl from '../../../assets/textures/earth_clouds_1024.png?url'
import oceansUrl from '../../../assets/textures/earth_specular_2048.jpg?url'
import { angleRotationTerre } from '../../astro/rotation'
import { OBLIQUITE_J2000 } from '../../astro/vecteur'

export interface Terre {
  globe: THREE.Mesh
  nuages: THREE.Mesh
  /** Oriente la Terre à l'instant t et place le Soleil (position dans la scène). */
  mettreAJour(t: number, soleil: THREE.Vector3): void
}

/**
 * Le globe (rayon 1, à mettre à l'échelle). Le repère local du globe est le repère équatorial (axe +Y vers le pôle
 * nord, méridien de Greenwich vers +X à l'angle 0) ; on le tourne du temps sidéral autour du pôle, puis on incline
 * l'équateur sur l'écliptique.
 */
export function creerTerre(chargeur: THREE.TextureLoader): Terre {
  const charger = (url: string) => {
    const tx = chargeur.load(url)
    tx.anisotropy = 4
    return tx
  }
  const materiau = new THREE.ShaderMaterial({
    uniforms: {
      jour: { value: charger(jourUrl) },
      nuit: { value: charger(nuitUrl) },
      oceans: { value: charger(oceansUrl) },
      soleil: { value: new THREE.Vector3(1, 0, 0) },
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormale;
      varying vec3 vPosition;
      void main() {
        vUv = uv;
        vNormale = normalize(mat3(modelMatrix) * normal);
        vec4 p = modelMatrix * vec4(position, 1.0);
        vPosition = p.xyz;
        gl_Position = projectionMatrix * viewMatrix * p;
      }`,
    fragmentShader: `
      uniform sampler2D jour;
      uniform sampler2D nuit;
      uniform sampler2D oceans;
      uniform vec3 soleil;
      varying vec2 vUv;
      varying vec3 vNormale;
      varying vec3 vPosition;
      void main() {
        vec3 n = normalize(vNormale);
        vec3 l = normalize(soleil - vPosition);
        vec3 v = normalize(cameraPosition - vPosition);
        float d = dot(n, l);
        vec3 couleurJour = texture2D(jour, vUv).rgb;
        // Jour : éclairage du Soleil, avec un terminateur adouci.
        vec3 c = couleurJour * smoothstep(-0.05, 0.25, d) * 1.15;
        // Nuit : les lumières des villes, seulement du côté obscur.
        vec3 villes = texture2D(nuit, vUv).rgb;
        c += villes * vec3(1.0, 0.82, 0.55) * smoothstep(0.05, -0.2, d) * 1.4;
        // Reflet du Soleil sur les océans.
        float eau = texture2D(oceans, vUv).r;
        float reflet = pow(max(dot(reflect(-l, n), v), 0.0), 28.0) * eau * step(0.0, d);
        c += vec3(1.0, 0.95, 0.85) * reflet * 0.6;
        gl_FragColor = vec4(c, 1.0);
        #include <tonemapping_fragment>
      }`,
  })
  const globe = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 48), materiau)
  globe.rotation.order = 'XYZ'

  // Nuages : une seconde sphère un peu plus grande, transparente, éclairée par le Soleil ; elle dérive lentement.
  const tNuages = charger(nuagesUrl)
  const nuages = new THREE.Mesh(
    new THREE.SphereGeometry(1.008, 96, 48),
    new THREE.MeshLambertMaterial({ map: tNuages, alphaMap: tNuages, transparent: true, depthWrite: false, opacity: 0.9 }),
  )
  globe.add(nuages)
  // Halo de l'atmosphère, visible sur le bord du globe.
  const halo = new THREE.Mesh(new THREE.SphereGeometry(1.025, 64, 32),
    new THREE.MeshBasicMaterial({ color: 0x6fb6ff, transparent: true, opacity: 0.3, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false }))
  globe.add(halo)

  const inclinaison = (-OBLIQUITE_J2000 * Math.PI) / 180
  return {
    globe,
    nuages,
    mettreAJour(t, soleil) {
      globe.rotation.set(inclinaison, angleRotationTerre(t), 0)
      // Les nuages font le tour en un peu plus d'un jour (ils dérivent vers l'ouest par rapport au sol).
      nuages.rotation.y = -((t / (86_400_000 * 9)) % 1) * Math.PI * 2
      materiau.uniforms.soleil.value.copy(soleil)
    },
  }
}
