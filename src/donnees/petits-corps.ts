// Les petits corps célèbres de la carte (demandes d'Adrien du 22/10/2026 : la comète de Halley, puis « les plus
// célèbres et ʻOumuamua ») : comètes, astéroïdes, planètes naines au-delà de Neptune, et le premier visiteur venu d'une
// autre étoile. Éléments d'orbite osculateurs de JPL (Small-Body Database, écliptique J2000), relevés le 22/10/2026 ;
// Halley : ceux de son passage de 1986. Pas de poussée des planètes : à l'échelle de la carte, c'est juste.

export type GenrePetitCorps = 'comete' | 'asteroide' | 'naine' | 'interstellaire'
/** Sa silhouette sur la carte (voir carte.ts). */
export type FormePetitCorps = 'patate' | 'boule' | 'ballon' | 'bonhomme' | 'cigare' | 'toupie'

export interface PetitCorps {
  nom: string
  genre: GenrePetitCorps
  forme: FormePetitCorps
  /** Rayon moyen (km). */
  rayon: number
  /** Teinte en aplat, façon Moebius. */
  teinte: string
  /** Éléments : excentricité, distance au périhélie (UA), inclinaison, nœud, argument du périhélie (degrés). */
  e: number
  q: number
  i: number
  noeud: number
  perihelie: number
  /** Passage au périhélie (jour julien). */
  passage: number
  /** Une ligne pour sa fiche. */
  fiche: string
}

export const HALLEY = 'Comète de Halley'

export const PETITS_CORPS: readonly PetitCorps[] = [
  { nom: HALLEY, genre: 'comete', forme: 'patate', rayon: 5.5, teinte: '#b79f7e', e: 0.96714, q: 0.58598, i: 162.262, noeud: 58.42, perihelie: 111.332, passage: 2446470.958,
    fiche: 'Revient tous les 76 ans ; dernier passage en 1986, prochain en 2061.' },
  { nom: 'Comète Hale-Bopp', genre: 'comete', forme: 'patate', rayon: 30, teinte: '#a99278', e: 0.99498100276, q: 0.89053766355, i: 89.287594247, noeud: 282.73342140, perihelie: 130.41466707, passage: 2450537.1349071,
    fiche: 'La grande comète de 1997, visible à l\'œil nu dix-huit mois ; de retour vers l\'an 4380.' },
  { nom: 'Comète d\'Encke', genre: 'comete', forme: 'patate', rayon: 2.4, teinte: '#9f8b74', e: 0.84694043089, q: 0.33958175036, i: 11.33675915, noeud: 334.01714001, perihelie: 187.28819987, passage: 2460240.0285327,
    fiche: 'La comète qui revient le plus souvent : tous les 3 ans et 4 mois.' },
  { nom: 'Comète 67P', genre: 'comete', forme: 'bonhomme', rayon: 1.7, teinte: '#8f8478', e: 0.64090813090, q: 1.2432656407, i: 7.0402949375, noeud: 50.135573772, perihelie: 12.798249702, passage: 2457247.5886578,
    fiche: 'Tchourioumov-Guérassimenko, le « canard » où se sont posés Philae (2014) et Rosetta (2016).' },
  { nom: 'Cérès', genre: 'naine', forme: 'boule', rayon: 469.7, teinte: '#b8b0a2', e: 0.07969229515, q: 2.5451593614, i: 10.588027802, noeud: 80.248626820, perihelie: 73.294214530, passage: 2461599.8414666,
    fiche: 'La planète naine de la ceinture d\'astéroïdes ; ses taches blanches sont du sel.' },
  { nom: 'Vesta', genre: 'asteroide', forme: 'toupie', rayon: 261.4, teinte: '#c7b9a0', e: 0.09020374383, q: 2.1483619145, i: 7.1439255451, noeud: 103.70129327, perihelie: 151.46864782, passage: 2460901.5873798,
    fiche: 'Le plus brillant des astéroïdes, survolé par la sonde Dawn (2011).' },
  { nom: 'Apophis', genre: 'asteroide', forme: 'patate', rayon: 0.17, teinte: '#b49a82', e: 0.19114922797, q: 0.74605096775, i: 3.3409968799, noeud: 203.89365142, perihelie: 126.67957069, passage: 2461042.9192015,
    fiche: 'Frôlera la Terre le 13 avril 2029, à 32 000 km : plus près que les satellites géostationnaires.' },
  { nom: 'Bennu', genre: 'asteroide', forme: 'toupie', rayon: 0.24, teinte: '#7f7569', e: 0.20374507624, q: 0.89689440045, i: 6.0349437702, noeud: 2.0608661957, perihelie: 66.223060841, passage: 2455439.1419409,
    fiche: 'La toupie de gravats d\'où OSIRIS-REx a rapporté de la poussière en 2023.' },
  { nom: 'Ryugu', genre: 'asteroide', forme: 'toupie', rayon: 0.45, teinte: '#7a7166', e: 0.19107300465, q: 0.96336647394, i: 5.8664424864, noeud: 251.28971240, perihelie: 211.60899381, passage: 2461118.2964223,
    fiche: 'Le diamant de gravier visité par Hayabusa 2, qui en a rapporté des grains en 2020.' },
  { nom: 'Éris', genre: 'naine', forme: 'boule', rayon: 1163, teinte: '#e9e4da', e: 0.43823853480, q: 38.162673535, i: 43.925827947, noeud: 36.004770444, perihelie: 150.79492358, passage: 2545407.7168470,
    fiche: 'Presque aussi grosse que Pluton : c\'est elle qui a fait déclasser Pluton en 2006.' },
  { nom: 'Haumea', genre: 'naine', forme: 'ballon', rayon: 816, teinte: '#e3ddd2', e: 0.19444301489, q: 34.687517581, i: 28.208473930, noeud: 121.78605613, perihelie: 240.69054725, passage: 2500416.5996153,
    fiche: 'Un ballon de rugby qui tourne sur lui-même en 4 heures, cerclé d\'un anneau.' },
  { nom: 'Makémaké', genre: 'naine', forme: 'boule', rayon: 715, teinte: '#d9b39a', e: 0.15888899540, q: 38.330213382, i: 29.027856037, noeud: 79.294833821, perihelie: 297.09227334, passage: 2408158.6940986,
    fiche: 'La planète naine rousse de la ceinture de Kuiper, nommée d\'après un dieu de l\'île de Pâques.' },
  { nom: 'Sedna', genre: 'naine', forme: 'boule', rayon: 500, teinte: '#c9765f', e: 0.85988245852, q: 76.184643646, i: 11.925275828, noeud: 144.50616627, perihelie: 311.09877259, passage: 2479264.7506871,
    fiche: 'La plus rouge et la plus lointaine : un tour du Soleil en plus de 11 000 ans, jusqu\'à 900 UA.' },
  { nom: 'Arrokoth', genre: 'asteroide', forme: 'bonhomme', rayon: 9, teinte: '#b9765c', e: 0.03555717645, q: 42.486193058, i: 2.4506139247, noeud: 159.03772679, perihelie: 188.85074634, passage: 2475741.4038731,
    fiche: 'Le « bonhomme de neige » rouge survolé par New Horizons le 1er janvier 2019.' },
  { nom: 'ʻOumuamua', genre: 'interstellaire', forme: 'cigare', rayon: 0.1, teinte: '#b8735c', e: 1.2011337961, q: 0.25591158130, i: 122.74170628, noeud: 24.596909555, perihelie: 241.81053603, passage: 2458006.0073214,
    fiche: 'Le premier visiteur venu d\'une autre étoile (2017), un éclat allongé qui repart pour toujours.' },
]
