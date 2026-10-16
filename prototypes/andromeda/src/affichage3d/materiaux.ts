// Matériaux de la vue 3D, dans le style du prototype : à plat, sans dégradé.
//  - Astres ronds : côté jour (clair) et côté nuit (encre), séparés net par le terminateur. Dessinés pixel par pixel
//    (« imposteur » : un carré face à la caméra, la sphère est calculée dans le fragment) : rondeur parfaite à toute
//    distance, même au ras de la Terre.
//  - Contours : un trait à l'extérieur de la couleur opposée au fond, un trait de la couleur du fond juste à
//    l'intérieur. Sur fond clair, on voit le noir ; devant un objet noir (la face de nuit de la Terre derrière la
//    Lune), on voit le blanc. En thème nuit, c'est l'inverse.
//  - Objets modelés (capsule, engins, cailloux) : même partage jour / nuit ; contours par « coques » retournées,
//    élargies d'un nombre fixe de pixels à l'écran.
// Profondeur : tampon logarithmique (de 1 cm à mille milliards de km dans la même image).

import * as THREE from 'three'

/**
 * Couleurs de la vue, partagées par tous les matériaux (les uniformes pointent sur ces objets : changer de thème ne
 * fait que modifier leurs valeurs).
 */
export const COULEURS = {
  jour: new THREE.Color(), // face éclairée
  nuit: new THREE.Color(), // face de nuit
  contourExt: new THREE.Color(), // trait extérieur : tranche sur le fond
  contourInt: new THREE.Color(), // trait intérieur : tranche sur un objet de la couleur du fond
  point: new THREE.Color(), // astres réduits à un point
  bordPoint: new THREE.Color(),
  trait: new THREE.Color(), // orbites
  etoile: new THREE.Color(), // étoiles du fond
}

export interface Theme {
  fond: string
  encre: string // texte et flèches de la surcouche
  halo: string // liseré autour du texte
  jour: string; nuit: string; contourExt: string; contourInt: string
  point: string; bordPoint: string; trait: string; etoile: string
}

/** Fond blanc cassé, astres et étoiles à l'encre. */
export const THEME_JOUR: Theme = {
  fond: '#f4f1ea', encre: '#1f1b18', halo: '#f4f1ea',
  jour: '#fbfaf5', nuit: '#1f1b18', contourExt: '#1f1b18', contourInt: '#ffffff',
  point: '#1f1b18', bordPoint: '#ffffff', trait: '#1f1b18', etoile: '#8c8780',
}

/**
 * L'inverse : fond noir, étoiles blanches. Les astres restent éclairés par le Soleil (face de jour claire, face de
 * nuit sombre) ; les contours s'inversent : blanc à l'extérieur (sur le noir), noir à l'intérieur.
 */
export const THEME_NUIT: Theme = {
  fond: '#0e0c0b', encre: '#f4f1ea', halo: '#0e0c0b',
  jour: '#f4f1ea', nuit: '#1f1b18', contourExt: '#ffffff', contourInt: '#0e0c0b',
  point: '#f4f1ea', bordPoint: '#0e0c0b', trait: '#f4f1ea', etoile: '#b8b3aa',
}

export function appliquerTheme(t: Theme): void {
  for (const cle of Object.keys(COULEURS) as (keyof typeof COULEURS)[]) COULEURS[cle].set(t[cle])
}
appliquerTheme(THEME_JOUR)

/** Uniformes partagés par tous les matériaux (mis à jour une fois par image). */
export const COMMUNS = {
  facteurProfondeur: { value: 1 }, // 2 / log2(lointain + 1), comme three.js
  hauteurPx: { value: 844 },
  tanDemiChamp: { value: Math.tan((55 * Math.PI) / 360) },
  resolution: { value: new THREE.Vector2(390, 844) },
  pixelRatio: { value: 2 },
  /** Style des astres : 0 à plat (jour / nuit), 1 BD (texture en aplats, ombre tramée), 2 réaliste. */
  style: { value: 0 },
}

const PROFONDEUR = /* glsl */ `
  uniform float facteurProfondeur;
  float profondeurLog(float w) { return log2(1.0 + w) * facteurProfondeur * 0.5; }
`

/**
 * Ombre en trame d'imprimerie (style BD) : une grille de points inclinée à 45°, fixe à l'écran ; les points
 * grossissent de la face éclairée (aucun point) vers la nuit (points jointifs), où l'astre prend sa teinte d'ombre.
 */
const TRAME = /* glsl */ `
  uniform float pixelRatio;
  vec3 trame(vec3 base, float l) {
    float d = 1.0 - smoothstep(-0.05, 0.55, l);
    vec2 p = gl_FragCoord.xy / (5.0 * pixelRatio);
    p = vec2(p.x + p.y, p.x - p.y) * 0.70710678;
    vec2 f = fract(p) - 0.5;
    return length(f) < 0.75 * sqrt(d) ? base * 0.22 : base;
  }
`

/** Matériau d'un astre rond (imposteur). */
export function materiauSphere(rayon: number, soleil = false): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    side: THREE.DoubleSide, // le carré est construit face à la caméra, dans un sens quelconque
    uniforms: {
      ...COMMUNS,
      rayon: { value: rayon },
      estSoleil: { value: soleil ? 1 : 0 },
      carte: { value: null as THREE.Texture | null },
      aCarte: { value: 0 },
      corpsDepuisVue: { value: new THREE.Matrix3() }, // repère de la caméra → repère propre de l'astre
      couleurBase: { value: new THREE.Color('#c9c2b6') }, // sans carte
      versSoleil: { value: new THREE.Vector3(1, 0, 0) }, // direction du Soleil, repère de la caméra
      jour: { value: COULEURS.jour }, nuit: { value: COULEURS.nuit },
      encre: { value: COULEURS.contourExt }, blanc: { value: COULEURS.contourInt },
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
      ${TRAME}
      uniform float rayon, estSoleil, style, aCarte;
      uniform vec3 versSoleil, jour, nuit, encre, blanc, couleurBase;
      uniform sampler2D carte;
      uniform mat3 corpsDepuisVue;
      varying vec3 vCentre;
      varying vec3 vQ;

      // Couleur de la surface au point de normale n (repère de la caméra) : carte en longitude / latitude.
      vec3 surface(vec3 n) {
        if (aCarte < 0.5) return couleurBase;
        vec3 b = corpsDepuisVue * n;
        float u = 0.5 + atan(b.y, b.x) / 6.2831853;
        float v = 0.5 + asin(clamp(b.z, -1.0, 1.0)) / 3.1415927;
        // Pas de couture à la longitude 180° : on prend la variation de u la plus petite des deux façons de compter.
        float u2 = fract(u + 0.5);
        float ax = dFdx(u), ax2 = dFdx(u2), ay = dFdy(u), ay2 = dFdy(u2);
        vec2 gx = vec2(abs(ax) < abs(ax2) ? ax : ax2, dFdx(v));
        vec2 gy = vec2(abs(ay) < abs(ay2) ? ay : ay2, dFdy(v));
        return textureGrad(carte, vec2(u, v), gx, gy).rgb;
      }

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
        // Style réaliste : pas de contours.
        if (style > 1.5 && e > 0.0) discard;
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
          float l = dot(n, versSoleil);
          if (style < 0.5) {
            if (e > -trait) couleur = blanc;
            else if (estSoleil > 0.5) couleur = jour;
            else couleur = l > 0.0 ? jour : nuit;
          } else {
            vec3 base = surface(n);
            if (estSoleil > 0.5) couleur = base;
            else if (style < 1.5) couleur = trame(base, l);
            else couleur = min(base * (1.15 * pow(max(l, 0.0), 0.7) + 0.03), vec3(1.0));
            if (style < 1.5 && e > -trait) couleur = blanc;
          }
        }
        gl_FragColor = vec4(couleur, 1.0);
        gl_FragDepth = profondeurLog(-P.z);
      }`,
  })
}

const SOMMET_PROFONDEUR = /* glsl */ `
  varying float vW;
`

/** Matériau d'un objet modelé : jour / nuit, ombre tramée ou ombre progressive selon le style. */
export function materiauObjet(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      ...COMMUNS, versSoleil: { value: new THREE.Vector3(1, 0, 0) }, jour: { value: COULEURS.jour }, nuit: { value: COULEURS.nuit },
      teinte: { value: new THREE.Color('#d8d4cc') }, // couleur propre (styles BD et réaliste)
      aTeintes: { value: 0 }, // 1 si le modèle porte une couleur par sommet (capsule, engins)
    },
    vertexShader: /* glsl */ `
      ${SOMMET_PROFONDEUR}
      attribute vec3 teinteSommet;
      varying vec3 vNormale;
      varying vec3 vTeinte;
      void main() {
        vNormale = normalize(normalMatrix * normal);
        vTeinte = teinteSommet;
        vec4 p = modelViewMatrix * vec4(position, 1.0);
        vW = -p.z;
        gl_Position = projectionMatrix * p;
      }`,
    fragmentShader: /* glsl */ `
      ${PROFONDEUR}
      ${SOMMET_PROFONDEUR}
      ${TRAME}
      uniform vec3 versSoleil, jour, nuit, teinte;
      uniform float style, aTeintes;
      varying vec3 vNormale;
      varying vec3 vTeinte;
      void main() {
        vec3 n = normalize(vNormale);
        if (!gl_FrontFacing) n = -n;
        float l = dot(n, versSoleil);
        vec3 base = aTeintes > 0.5 ? vTeinte : teinte;
        vec3 couleur;
        if (style < 0.5) couleur = l > 0.0 ? jour : nuit;
        else if (style < 1.5) couleur = trame(base, l);
        else couleur = min(base * (1.15 * pow(max(l, 0.0), 0.7) + 0.03), vec3(1.0));
        gl_FragColor = vec4(couleur, 1.0);
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
      uniform float style;
      void main() {
        if (style > 1.5) discard; // style réaliste : pas de contours
        gl_FragColor = vec4(couleur, 1.0);
        gl_FragDepth = profondeurLog(vW);
      }`,
  })
}

/** Points : un rond de taille fixe à l'écran (encre cernée de blanc ; en BD, couleur de l'astre cernée d'encre). */
export function materiauPoints(rayonPx: number): THREE.ShaderMaterial {
  // (style BD : rond de la couleur de l'astre, voir plus bas)
  return new THREE.ShaderMaterial({
    uniforms: {
      ...COMMUNS, rayonPx: { value: rayonPx }, encre: { value: COULEURS.point }, blanc: { value: COULEURS.bordPoint },
      cerne: { value: COULEURS.contourExt },
    },
    vertexShader: /* glsl */ `
      ${SOMMET_PROFONDEUR}
      uniform float rayonPx, pixelRatio;
      attribute vec3 teinteSommet;
      varying vec3 vTeinte;
      void main() {
        vTeinte = teinteSommet;
        vec4 p = modelViewMatrix * vec4(position, 1.0);
        vW = -p.z;
        gl_Position = projectionMatrix * p;
        gl_PointSize = (rayonPx + 1.0) * 2.0 * pixelRatio;
      }`,
    fragmentShader: /* glsl */ `
      ${PROFONDEUR}
      ${SOMMET_PROFONDEUR}
      uniform float rayonPx, style;
      uniform vec3 encre, blanc, cerne;
      varying vec3 vTeinte;
      void main() {
        float r = length(gl_PointCoord * 2.0 - 1.0) * (rayonPx + 1.0);
        if (r > rayonPx + 1.0) discard;
        // Style BD : un rond de la couleur de l'astre, cerné d'encre. Sinon : encre cernée de la couleur du fond.
        vec3 c = style > 0.5 && style < 1.5 ? (r < rayonPx ? vTeinte : cerne) : (r < rayonPx ? encre : blanc);
        gl_FragColor = vec4(c, 1.0);
        gl_FragDepth = profondeurLog(vW);
      }`,
  })
}

/** Traits (orbites) : encre légère, ou la couleur de l'astre en style BD. */
export function materiauTrait(opacite: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: { ...COMMUNS, encre: { value: COULEURS.trait }, opacite: { value: opacite }, propre: { value: new THREE.Color() } },
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
      uniform vec3 encre, propre;
      uniform float opacite, style;
      void main() {
        // Style BD : l'orbite prend la couleur de son astre, un peu plus appuyée.
        bool bd = style > 0.5 && style < 1.5;
        gl_FragColor = vec4(bd ? propre : encre, bd ? min(1.0, opacite * 2.2) : opacite);
        gl_FragDepth = profondeurLog(vW);
      }`,
  })
}

/** Étoiles du fond : petits points gris, sans profondeur (toujours derrière tout). */
export function materiauEtoiles(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: { ...COMMUNS, etoile: { value: COULEURS.etoile } },
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
      uniform vec3 etoile;
      void main() { gl_FragColor = vec4(etoile, 1.0); }`,
  })
}
