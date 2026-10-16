// Matériaux de la vue 3D, dans le style du prototype : à plat, sans dégradé.
//  - Astres ronds : côté jour (clair) et côté nuit (encre), séparés net par le terminateur. Dessinés pixel par pixel
//    (« imposteur » : un carré face à la caméra, la sphère est calculée dans le fragment) : rondeur parfaite à toute
//    distance, même au ras de la Terre.
//  - Contours : un trait d'encre à l'extérieur, un trait blanc juste à l'intérieur. Sur fond clair, on voit le noir ;
//    devant un objet noir (la face de nuit de la Terre derrière la Lune), on voit le blanc.
//  - Objets modelés (capsule, engins, cailloux) : même partage jour / nuit ; contours par « coques » retournées,
//    élargies d'un nombre fixe de pixels à l'écran.
// Profondeur : tampon logarithmique (de 1 cm à mille milliards de km dans la même image).

import * as THREE from 'three'

export interface Couleurs { jour: THREE.Color; nuit: THREE.Color; encre: THREE.Color; blanc: THREE.Color }

export const COULEURS: Couleurs = {
  jour: new THREE.Color('#fbfaf5'),
  nuit: new THREE.Color('#1f1b18'),
  encre: new THREE.Color('#1f1b18'),
  blanc: new THREE.Color('#ffffff'),
}

/** Uniformes partagés par tous les matériaux (mis à jour une fois par image). */
export const COMMUNS = {
  facteurProfondeur: { value: 1 }, // 2 / log2(lointain + 1), comme three.js
  hauteurPx: { value: 844 },
  tanDemiChamp: { value: Math.tan((55 * Math.PI) / 360) },
  resolution: { value: new THREE.Vector2(390, 844) },
  pixelRatio: { value: 2 },
}

const PROFONDEUR = /* glsl */ `
  uniform float facteurProfondeur;
  float profondeurLog(float w) { return log2(1.0 + w) * facteurProfondeur * 0.5; }
`

/** Matériau d'un astre rond (imposteur). */
export function materiauSphere(rayon: number, soleil = false): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    side: THREE.DoubleSide, // le carré est construit face à la caméra, dans un sens quelconque
    uniforms: {
      ...COMMUNS,
      rayon: { value: rayon },
      estSoleil: { value: soleil ? 1 : 0 },
      versSoleil: { value: new THREE.Vector3(1, 0, 0) }, // direction du Soleil, repère de la caméra
      jour: { value: COULEURS.jour }, nuit: { value: COULEURS.nuit },
      encre: { value: COULEURS.encre }, blanc: { value: COULEURS.blanc },
    },
    vertexShader: /* glsl */ `
      uniform float rayon, hauteurPx, tanDemiChamp;
      varying vec3 vCentre;
      varying vec3 vQ;
      void main() {
        vec3 C = (modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
        float d = length(C);
        vec3 axe = C / d;
        vec3 h = abs(axe.y) < 0.99 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
        vec3 e1 = normalize(cross(h, axe));
        vec3 e2 = cross(axe, e1);
        // Rayon apparent de la silhouette, dans le plan qui passe par le centre, et marge pour les contours.
        float rs = rayon * d / sqrt(max(d * d - rayon * rayon, 1e-6 * d * d));
        float pxMonde = 2.0 * d * tanDemiChamp / hauteurPx;
        vec3 q = (position.x * e1 + position.y * e2) * (rs + 5.0 * pxMonde);
        vCentre = C;
        vQ = q;
        gl_Position = projectionMatrix * vec4(C + q, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      ${PROFONDEUR}
      uniform float rayon, estSoleil, pixelRatio;
      uniform vec3 versSoleil, jour, nuit, encre, blanc;
      varying vec3 vCentre;
      varying vec3 vQ;
      void main() {
        float d = length(vCentre);
        vec3 c = vCentre / d;
        float lq = length(vQ);
        vec3 qh = lq > 0.0 ? vQ / lq : normalize(cross(c, vec3(0.0, 1.0, 0.0)));
        float rs = rayon * d / sqrt(max(d * d - rayon * rayon, 1e-6 * d * d));
        float px = max(fwidth(lq), 1e-12);
        float e = (lq - rs) / px; // distance au bord, en pixels (négative à l'intérieur)
        float trait = 1.1 * pixelRatio;
        if (e > trait) discard;
        vec3 couleur;
        vec3 P = vCentre + vQ; // point du plan, pour la profondeur des contours extérieurs
        if (e > 0.0) {
          couleur = encre;
        } else {
          // Intersection du rayon de vue avec la sphère, calculée autour du centre (pas de grands nombres).
          float m = lq / d;
          float s = (-m * lq - sqrt(max(rayon * rayon * (1.0 + m * m) - lq * lq, 0.0))) / (1.0 + m * m);
          float v = lq + m * s;
          vec3 n = (s * c + v * qh) / rayon;
          P = vCentre + s * c + v * qh;
          if (e > -trait) couleur = blanc;
          else if (estSoleil > 0.5) couleur = jour;
          else couleur = dot(n, versSoleil) > 0.0 ? jour : nuit;
        }
        gl_FragColor = vec4(couleur, 1.0);
        gl_FragDepth = profondeurLog(-P.z);
      }`,
  })
}

const SOMMET_PROFONDEUR = /* glsl */ `
  varying float vW;
`

/** Matériau jour / nuit d'un objet modelé. */
export function materiauObjet(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: { ...COMMUNS, versSoleil: { value: new THREE.Vector3(1, 0, 0) }, jour: { value: COULEURS.jour }, nuit: { value: COULEURS.nuit } },
    vertexShader: /* glsl */ `
      ${SOMMET_PROFONDEUR}
      varying vec3 vNormale;
      void main() {
        vNormale = normalize(normalMatrix * normal);
        vec4 p = modelViewMatrix * vec4(position, 1.0);
        vW = -p.z;
        gl_Position = projectionMatrix * p;
      }`,
    fragmentShader: /* glsl */ `
      ${PROFONDEUR}
      ${SOMMET_PROFONDEUR}
      uniform vec3 versSoleil, jour, nuit;
      varying vec3 vNormale;
      void main() {
        vec3 n = normalize(vNormale);
        if (!gl_FrontFacing) n = -n;
        gl_FragColor = vec4(dot(n, versSoleil) > 0.0 ? jour : nuit, 1.0);
        gl_FragDepth = profondeurLog(vW);
      }`,
  })
}

/** Coque de contour : faces arrière, poussées de `largeur` pixels vers l'extérieur à l'écran. */
export function materiauCoque(couleur: THREE.Color, largeur: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: { ...COMMUNS, couleur: { value: couleur }, largeur: { value: largeur } },
    side: THREE.BackSide,
    depthWrite: false,
    vertexShader: /* glsl */ `
      ${SOMMET_PROFONDEUR}
      uniform vec2 resolution;
      uniform float largeur, pixelRatio;
      void main() {
        vec4 p = modelViewMatrix * vec4(position, 1.0);
        vW = -p.z;
        vec4 clip = projectionMatrix * p;
        vec3 n = normalize(normalMatrix * normal);
        vec2 dir = (projectionMatrix * vec4(n, 0.0)).xy;
        float l = length(dir);
        if (l > 1e-9) clip.xy += dir / l * largeur * pixelRatio * 2.0 / resolution * clip.w;
        gl_Position = clip;
      }`,
    fragmentShader: /* glsl */ `
      ${PROFONDEUR}
      ${SOMMET_PROFONDEUR}
      uniform vec3 couleur;
      void main() {
        gl_FragColor = vec4(couleur, 1.0);
        gl_FragDepth = profondeurLog(vW);
      }`,
  })
}

/** Points : un rond d'encre cerné de blanc, de taille fixe à l'écran. */
export function materiauPoints(rayonPx: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: { ...COMMUNS, rayonPx: { value: rayonPx }, encre: { value: COULEURS.encre }, blanc: { value: COULEURS.blanc } },
    vertexShader: /* glsl */ `
      ${SOMMET_PROFONDEUR}
      uniform float rayonPx, pixelRatio;
      void main() {
        vec4 p = modelViewMatrix * vec4(position, 1.0);
        vW = -p.z;
        gl_Position = projectionMatrix * p;
        gl_PointSize = (rayonPx + 1.0) * 2.0 * pixelRatio;
      }`,
    fragmentShader: /* glsl */ `
      ${PROFONDEUR}
      ${SOMMET_PROFONDEUR}
      uniform float rayonPx;
      uniform vec3 encre, blanc;
      void main() {
        float r = length(gl_PointCoord * 2.0 - 1.0) * (rayonPx + 1.0);
        if (r > rayonPx + 1.0) discard;
        gl_FragColor = vec4(r < rayonPx ? encre : blanc, 1.0);
        gl_FragDepth = profondeurLog(vW);
      }`,
  })
}

/** Traits (orbites) : encre légère. */
export function materiauTrait(opacite: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: { ...COMMUNS, encre: { value: COULEURS.encre }, opacite: { value: opacite } },
    transparent: true,
    depthWrite: false,
    vertexShader: /* glsl */ `
      ${SOMMET_PROFONDEUR}
      void main() {
        vec4 p = modelViewMatrix * vec4(position, 1.0);
        vW = -p.z;
        gl_Position = projectionMatrix * p;
      }`,
    fragmentShader: /* glsl */ `
      ${PROFONDEUR}
      ${SOMMET_PROFONDEUR}
      uniform vec3 encre;
      uniform float opacite;
      void main() {
        gl_FragColor = vec4(encre, opacite);
        gl_FragDepth = profondeurLog(vW);
      }`,
  })
}

/** Étoiles du fond : petits points gris, sans profondeur (toujours derrière tout). */
export function materiauEtoiles(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: { ...COMMUNS },
    depthWrite: false,
    depthTest: false,
    vertexShader: /* glsl */ `
      uniform float pixelRatio;
      void main() {
        gl_Position = projectionMatrix * vec4((modelViewMatrix * vec4(position, 0.0)).xyz, 1.0);
        gl_Position.z = gl_Position.w * 0.999999;
        gl_PointSize = 1.0 * pixelRatio;
      }`,
    fragmentShader: /* glsl */ `
      void main() { gl_FragColor = vec4(0.55, 0.53, 0.5, 1.0); }`,
  })
}
