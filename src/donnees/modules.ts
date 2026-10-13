// Réglages des modules. Valeurs du prototype v0.1 (voir docs/regles.md, section 5). Ne pas modifier sans
// l'accord d'Adrien : le manuel décrit ces valeurs.

/** CH-1 Chambre de combustion et TU-1 Tuyère (bloc propulsion). */
export const PROPULSION = {
  /** Pression P (0 à 100) : cible en surpression, en sous-pression, sinon 50 + (R − 5) × 12 (+15 si L-B abaissé). */
  pressionSurpression: 96,
  pressionSousPression: 6,
  pressionNominale: 50,
  pressionParCran: 12,
  pressionLevierB: 15,
  /** Vitesse d'évolution de P (par seconde) : L-B relevé / abaissé. */
  vitessePression: 5,
  vitessePressionLevierB: 4,
  /** Surpression si P > 90 pendant 2 s ; sous-pression si P < 15 pendant 2 s. */
  seuilSurpression: 90,
  seuilSousPression: 15,
  dureeAvantFaute: 2,
  /** Réparation CH-1 : molette R sur 2 (surpression) ou 7 (sous-pression), puis presser P. */
  reglageSurpression: 2,
  reglageSousPression: 7,
  /** Presser P sans avarie : purge à vide, P − 20. */
  purgeAVide: 20,
  /** Température T : cible L-A abaissé, en surchauffe, sinon ; et vitesses d'évolution (par seconde). */
  temperatureLevierA: 18,
  temperatureSurchauffe: 96,
  temperatureNominale: 45,
  vitesseTemperatureLevierA: 3.5,
  vitesseTemperatureSurchauffe: 3,
  vitesseTemperature: 2,
  /** Réparation TU-1 : L-A relevé à T ≤ 40 → réparé ; entre 40 et 60 → faux réparé, rechute 6 s plus tard. */
  temperatureReparation: 40,
  temperatureFauxRepare: 60,
  delaiRechute: 6,
  /** Emballement : presser P pendant une surchauffe. */
  temperatureEmballement: 100,
  /** Position de départ de la molette R. */
  moletteDepart: 5,
} as const

/** AL-1 Fusibles. */
export const COULEURS_FUSIBLES = ['bleu', 'rouge', 'vert', 'jaune'] as const
export type CouleurFusible = (typeof COULEURS_FUSIBLES)[number]
export const NOMBRE_FUSIBLES = 8
