// Les portraits des PNJ et les décors de leurs lieux (Adrien, 24/10/2026 : « ce jeu manque cruellement d'identité
// visuelle dans les dialogues » ; mise en page validée d'après maquette-dialogue.html). Dessinés en SVG par Claude, en
// attendant les images qu'Adrien fait faire à ChatGPT (docs/portraits-prompts.md) : une image prête remplace son dessin
// (voir IMAGES). Un buste de face dans une boîte de 200 × 220, trois humeurs ; un décor de 390 × 400 par lieu.

export type Humeur = 'neutre' | 'joie' | 'souci'

/** Ce qui fait un personnage : sa peau, son visage, ses cheveux, ce qu'il porte, ce qui le distingue. */
export interface Perso {
  id: string; nom: string; role: string; lieu: string; decor: string; teinte: string; age: number
  peau: string[]; largeur?: number; machoire?: number; cheveux: string[]; coupe: string; iris?: string; regard?: number
  habit: string[]; col: string; acc?: string[]; barbe?: string; sourcilsCouleur?: string; sourcils?: number; nez?: number
  bouche?: number; sourire?: number; cou?: number; cils?: boolean; cernes?: boolean; yeuxClos?: boolean
  echarpe?: string; dessous?: string; fourrure?: string; galon?: string; coiffe?: string; coiffe2?: string; verre?: string
  capuche?: string; cicatriceY?: number
}

// ———————————————————————————————————————————— Les couleurs (aplats Moebius)
const ENCRE = '#2b2230'
const PEAUX = { claire: ['#f6d2b8', '#e3a98a'], rose: ['#f3c4ad', '#d9967d'], doree: ['#e9b98f', '#c98c62'], mate: ['#c98e66', '#a5694a'], brune: ['#9a6446', '#7a4a32'], ebene: ['#6e4632', '#553424'] }
const trait = (w = 1.6) => `stroke="${ENCRE}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`

// ———————————————————————————————————————————— Les portraits
// Un buste de face, tête au centre (100, 95) dans une boîte de 200 × 220. Chaque personnage : sa peau, sa forme de
// visage, ses cheveux, ce qu'il porte, ce qui le distingue (barbe, lunettes, cicatrice, pipe…).
const CX = 100
function visage(p: Perso) {
  const w = p.largeur ?? 37, mid = 92, j = p.machoire ?? 0.4
  return `M${CX - w},${mid} C${CX - w},40 ${CX + w},40 ${CX + w},${mid} C${CX + w},${mid + 26 + j * 8} ${CX + w * (0.5 + j * 0.25)},${mid + 47} ${CX},${mid + 50} C${CX - w * (0.5 + j * 0.25)},${mid + 47} ${CX - w},${mid + 26 + j * 8} ${CX - w},${mid} Z`
}
function yeux(p: Perso, h: Humeur) {
  const ecart = 15, y = 97
  let s = ''
  for (const c of [-1, 1]) {
    const x = CX + c * ecart
    const mi = h === 'joie' ? 2.2 : 3.4
    if (p.yeuxClos) { s += `<path d="M${x - 6},${y} q6,${h === 'souci' ? -2 : 3} 12,0" fill="none" ${trait(1.8)}/>`; continue }
    s += `<path d="M${x - 7},${y} q7,${-mi * 2} 14,0 q-7,${mi * 1.5} -14,0 Z" fill="#fffbf2" ${trait(1.4)}/>`
    s += `<circle cx="${x + (p.regard ?? 0)}" cy="${y - 0.4}" r="${h === 'joie' ? 2.2 : 2.6}" fill="${p.iris ?? '#3a2a24'}"/>`
    s += `<circle cx="${x + (p.regard ?? 0) + 0.8}" cy="${y - 1.4}" r="0.8" fill="#fffbf2"/>`
    // Paupière supérieure, plus marquée.
    s += `<path d="M${x - 7.5},${y + 0.3} q7.5,${-mi * 2.3} 15,0" fill="none" ${trait(2)}/>`
    if (h === 'joie') s += `<path d="M${x - 5},${y + 4} q5,2.5 10,0" fill="none" ${trait(1)}/>`
    if (p.cils) s += `<path d="M${x + c * 7},${y - 1.5} l${c * 3.5},-2.5 M${x + c * 5},${y - 3.5} l${c * 2.5},-3" fill="none" ${trait(1.4)}/>`
    if (p.age >= 50) s += `<path d="M${x + c * 9},${y - 1} l${c * 4},-2 M${x + c * 9},${y + 1.5} l${c * 4},1.5" fill="none" ${trait(0.9)}/>`
    if (p.cernes) s += `<path d="M${x - 5},${y + 5.5} q5,2.5 10,0" fill="none" ${trait(0.9)} opacity="0.7"/>`
  }
  return s
}
function sourcils(p: Perso, h: Humeur) {
  const y = 86, e = p.sourcils ?? 2.6, couleur = p.sourcilsCouleur ?? p.cheveux?.[0] ?? ENCRE
  let s = ''
  for (const c of [-1, 1]) {
    const x = CX + c * 15
    // Souci : l'intérieur monte ; joie : arrondis et hauts ; colère serait l'inverse.
    const dedans = h === 'souci' ? -5 : h === 'joie' ? -1.5 : 0, dehors = h === 'souci' ? 2 : h === 'joie' ? -2 : 0
    const xi = x - c * 7, xe = x + c * 8
    s += `<path d="M${xi},${y + dedans} Q${x},${y - 3 + (h === 'joie' ? -2 : 0)} ${xe},${y + 1 + dehors}" fill="none" stroke="${couleur}" stroke-width="${e}" stroke-linecap="round"/>`
    s += `<path d="M${xi},${y + dedans} Q${x},${y - 3 + (h === 'joie' ? -2 : 0)} ${xe},${y + 1 + dehors}" fill="none" ${trait(0.6)} opacity="0.6"/>`
  }
  if (h === 'souci') s += `<path d="M${CX - 2},${y - 2} l1,4 M${CX + 2},${y - 2} l-1,4" fill="none" ${trait(0.8)}/>`
  return s
}
function nez(p: Perso) {
  const l = p.nez ?? 0
  return `<path d="M${CX + 2},${100} q${2 + l},${9 + l} ${-1},${15 + l} q-4,2 -8,-1" fill="none" ${trait(1.4)}/>`
    + `<path d="M${CX + 5},${114 + l} q3,1 1,3" fill="none" ${trait(1)}/>`
}
function bouche(p: Perso, h: Humeur) {
  const y = 127 + (p.nez ?? 0) * 0.5, l = p.bouche ?? 9
  if (h === 'joie') return `<path d="M${CX - l - 2},${y - 2} Q${CX},${y + 10} ${CX + l + 2},${y - 2} Q${CX},${y + 3} ${CX - l - 2},${y - 2} Z" fill="#fffbf2" ${trait(1.5)}/>`
    + `<path d="M${CX - l - 2},${y - 2} Q${CX},${y + 10} ${CX + l + 2},${y - 2}" fill="none" ${trait(1.8)}/>`
    + `<path d="M${CX - l - 5},${y - 4} q2,2 1,4 M${CX + l + 5},${y - 4} q-2,2 -1,4" fill="none" ${trait(1)}/>`
  if (h === 'souci') return `<path d="M${CX - l + 1},${y + 2} Q${CX},${y - 3} ${CX + l - 1},${y + 2}" fill="none" ${trait(1.8)}/>`
    + `<path d="M${CX - 3},${y + 5} q3,1 6,0" fill="none" ${trait(0.9)} opacity="0.7"/>`
  return `<path d="M${CX - l},${y} Q${CX},${y + (p.sourire ?? 1.5)} ${CX + l},${y - 0.5}" fill="none" ${trait(1.8)}/>`
    + `<path d="M${CX - 3},${y + 5} q3,1.2 6,0" fill="none" ${trait(0.9)} opacity="0.7"/>`
}
function rides(p: Perso) {
  if ((p.age ?? 30) < 45) return ''
  let s = `<path d="M${CX - 13},${108} q-4,10 -3,18 M${CX + 13},${108} q4,10 3,18" fill="none" ${trait(1)} opacity="0.65"/>`
  if (p.age >= 60) s += `<path d="M${CX - 16},${70} q16,-4 32,0 M${CX - 12},${76} q12,-3 24,0" fill="none" ${trait(0.9)} opacity="0.6"/>`
  return s
}

// Les cheveux : derrière la tête (dos), puis devant (dessus).
const CHEVEUX: Record<string, (c: string[]) => { dos?: string; devant: string }> = {
  court: (c: string[]) => ({ devant: `<path d="M${CX - 39},88 C${CX - 44},48 ${CX - 20},34 ${CX + 4},36 C${CX + 30},36 ${CX + 44},52 ${CX + 39},84 C${CX + 34},68 ${CX + 22},58 ${CX + 4},60 C${CX - 14},54 ${CX - 30},66 ${CX - 33},90 Z" fill="${c[0]}" ${trait()}/>`
    + `<path d="M${CX - 10},40 q16,4 30,18 M${CX + 6},39 q14,6 22,14" fill="none" stroke="${c[1]}" stroke-width="2.5" stroke-linecap="round"/>` }),
  meche: (c: string[]) => ({ devant: `<path d="M${CX - 39},92 C${CX - 46},44 ${CX - 10},28 ${CX + 14},34 C${CX + 38},40 ${CX + 46},62 ${CX + 39},88 C${CX + 36},70 ${CX + 30},62 ${CX + 22},58 C${CX + 6},70 ${CX - 20},66 ${CX - 30},62 C${CX - 34},70 ${CX - 35},80 ${CX - 39},92 Z" fill="${c[0]}" ${trait()}/>`
    + `<path d="M${CX + 16},40 C${CX + 4},50 ${CX - 14},52 ${CX - 28},60" fill="none" stroke="${c[1]}" stroke-width="3" stroke-linecap="round"/>`
    + `<path d="M${CX + 24},44 C${CX + 14},58 ${CX - 4},62 ${CX - 16},64" fill="none" ${trait(0.9)}/>` }),
  carre: (c: string[]) => ({ dos: `<path d="M${CX - 46},90 C${CX - 52},40 ${CX + 52},40 ${CX + 46},90 L${CX + 48},138 C${CX + 40},142 ${CX + 30},140 ${CX + 26},132 L${CX - 26},132 C${CX - 30},140 ${CX - 40},142 ${CX - 48},138 Z" fill="${c[0]}" ${trait()}/>`,
    devant: `<path d="M${CX - 42},100 C${CX - 48},44 ${CX + 48},44 ${CX + 42},100 C${CX + 36},76 ${CX + 30},70 ${CX + 18},66 C${CX + 6},74 ${CX - 22},70 ${CX - 34},74 C${CX - 38},82 ${CX - 39},92 ${CX - 42},100 Z" fill="${c[0]}" ${trait()}/>`
    + `<path d="M${CX - 30},52 q14,-10 36,-8" fill="none" stroke="${c[1]}" stroke-width="3" stroke-linecap="round"/>` }),
  frange: (c: string[]) => ({ dos: `<path d="M${CX - 46},90 C${CX - 52},38 ${CX + 52},38 ${CX + 46},90 L${CX + 46},132 L${CX - 46},132 Z" fill="${c[0]}" ${trait()}/>`,
    devant: `<path d="M${CX - 42},104 C${CX - 48},42 ${CX + 48},42 ${CX + 42},104 L${CX + 38},84 C${CX + 36},80 ${CX + 34},79 ${CX + 30},80 L${CX + 30},80 L${CX - 30},80 C${CX - 34},79 ${CX - 36},80 ${CX - 38},84 Z" fill="${c[0]}" ${trait()}/>`
    + `<path d="M${CX - 20},80 l2,-14 M${CX - 6},80 l1,-16 M${CX + 8},80 l-1,-16 M${CX + 22},80 l-2,-14" fill="none" stroke="${c[1]}" stroke-width="1.6"/>` }),
  chignon: (c: string[]) => ({ dos: `<circle cx="${CX + 6}" cy="34" r="17" fill="${c[0]}" ${trait()}/><path d="M${CX - 6},28 q12,-6 24,4" fill="none" stroke="${c[1]}" stroke-width="2"/>`,
    devant: `<path d="M${CX - 39},96 C${CX - 46},46 ${CX + 46},46 ${CX + 39},96 C${CX + 36},72 ${CX + 22},58 ${CX},58 C${CX - 22},58 ${CX - 36},72 ${CX - 39},96 Z" fill="${c[0]}" ${trait()}/>`
    + `<path d="M${CX - 30},64 q20,-16 46,-6 M${CX - 34},76 q12,-16 30,-18" fill="none" stroke="${c[1]}" stroke-width="2" stroke-linecap="round"/>` }),
  boucles: (c: string[]) => {
    let bou = ''
    const pts = [[-44, 92], [-48, 74], [-44, 56], [-32, 42], [-16, 34], [2, 32], [20, 34], [34, 42], [44, 56], [48, 74], [44, 92], [-46, 110], [46, 110], [-40, 124], [40, 124]]
    for (const [dx, dy] of pts) bou += `<circle cx="${CX + dx}" cy="${dy}" r="12" fill="${c[0]}" ${trait()}/>`
    let av = ''
    for (const [dx, dy] of [[-28, 58], [-12, 50], [6, 48], [22, 54], [34, 66]]) av += `<circle cx="${CX + dx}" cy="${dy}" r="11" fill="${c[0]}" ${trait()}/><path d="M${CX + dx - 5},${dy - 2} q5,-5 10,0" fill="none" stroke="${c[1]}" stroke-width="1.6"/>`
    return { dos: bou, devant: av }
  },
  chauve: (c: string[]) => ({ devant: `<path d="M${CX - 38},96 C${CX - 42},80 ${CX - 40},70 ${CX - 34},66 L${CX - 30},92 Z M${CX + 38},96 C${CX + 42},80 ${CX + 40},70 ${CX + 34},66 L${CX + 30},92 Z" fill="${c[0]}" ${trait()}/>`
    + `<path d="M${CX - 18},52 q10,-6 22,-4" fill="none" stroke="#fffbf2" stroke-width="3" stroke-linecap="round" opacity="0.6"/>` }),
  ras: (c: string[]) => ({ devant: `<path d="M${CX - 38},84 C${CX - 40},48 ${CX + 40},48 ${CX + 38},84 C${CX + 32},66 ${CX + 16},60 ${CX},60 C${CX - 16},60 ${CX - 32},66 ${CX - 38},84 Z" fill="${c[0]}" ${trait(1.2)}/>` }),
  tresse: (c: string[]) => ({ dos: `<path d="M${CX + 30},110 q20,20 14,60" fill="none" stroke="${ENCRE}" stroke-width="15" stroke-linecap="round"/><path d="M${CX + 30},110 q20,20 14,60" fill="none" stroke="${c[0]}" stroke-width="12" stroke-linecap="round"/>`
    + [0, 1, 2, 3].map((k) => `<path d="M${CX + 36 + k * 1.5},${122 + k * 11} q6,2 8,-3" fill="none" ${trait(1)}/>`).join(''),
    devant: `<path d="M${CX - 39},94 C${CX - 46},44 ${CX + 46},44 ${CX + 39},94 C${CX + 36},72 ${CX + 18},60 ${CX + 2},64 C${CX - 14},58 ${CX - 34},70 ${CX - 39},94 Z" fill="${c[0]}" ${trait()}/>`
    + `<path d="M${CX + 2},64 C${CX + 2},54 ${CX + 4},46 ${CX + 8},42 M${CX - 24},64 q14,-14 30,-18" fill="none" stroke="${c[1]}" stroke-width="2" stroke-linecap="round"/>` }),
  undercut: (c: string[]) => ({ devant: `<path d="M${CX - 37},76 C${CX - 40},56 ${CX - 30},50 ${CX - 22},50 L${CX - 22},62 Z M${CX + 37},76 C${CX + 40},56 ${CX + 30},50 ${CX + 22},50 L${CX + 22},62 Z" fill="${c[1]}" ${trait(1)}/>`
    + `<path d="M${CX - 26},66 C${CX - 32},36 ${CX + 10},26 ${CX + 30},38 C${CX + 42},46 ${CX + 34},60 ${CX + 26},62 C${CX + 10},54 ${CX - 6},60 ${CX - 26},66 Z" fill="${c[0]}" ${trait()}/>`
    + `<path d="M${CX - 18},54 q20,-16 44,-10" fill="none" stroke="${c[1]}" stroke-width="2" stroke-linecap="round"/>` }),
  long: (c: string[]) => ({ dos: `<path d="M${CX - 44},90 C${CX - 52},34 ${CX + 52},34 ${CX + 44},90 C${CX + 50},130 ${CX + 56},160 ${CX + 50},182 L${CX - 50},182 C${CX - 56},160 ${CX - 50},130 ${CX - 44},90 Z" fill="${c[0]}" ${trait()}/>`,
    devant: `<path d="M${CX - 40},100 C${CX - 46},42 ${CX + 46},42 ${CX + 40},100 C${CX + 36},74 ${CX + 22},62 ${CX + 6},62 C${CX - 12},62 ${CX - 34},74 ${CX - 40},100 Z" fill="${c[0]}" ${trait()}/>` }),
}

// Ce qu'on porte sur le buste.
function buste(p: Perso) {
  const v = p.habit ?? ['#c9d6ee', '#a8b8d6'], n = p.cou ?? 13
  let s = `<path d="M${CX - n},120 L${CX - n},170 L${CX + n},170 L${CX + n},120 Z" fill="${p.peau[1]}" ${trait()}/>`
  s += `<path d="M${CX - n},150 q${n},8 ${n * 2},0" fill="none" ${trait(1)} opacity="0.5"/>`
  s += `<path d="M6,222 C10,190 34,176 ${CX - 30},170 Q${CX},178 ${CX + 30},170 C${200 - 34},176 ${200 - 10},190 ${200 - 6},222 Z" fill="${v[0]}" ${trait()}/>`
  // L'ombre portée du côté droit (la lumière vient de la gauche).
  s += `<path d="M${CX + 40},171 C${200 - 30},178 ${200 - 12},194 ${200 - 8},222 L${CX + 52},222 C${CX + 50},200 ${CX + 46},186 ${CX + 40},171 Z" fill="${v[1]}" opacity="0.9"/>`
  return s
}
const COLS: Record<string, (p: Perso) => string> = {
  combinaison: (p: Perso) => `<path d="M${CX - 22},168 L${CX - 30},200 L${CX - 8},186 Z M${CX + 22},168 L${CX + 30},200 L${CX + 8},186 Z" fill="${p.habit[1]}" ${trait()}/>`
    + `<path d="M${CX},180 L${CX},222" fill="none" ${trait(1.2)}/><rect x="${CX - 52}" y="196" width="22" height="13" rx="2" fill="#fffbf2" ${trait(1.2)}/>`,
  roule: (p: Perso) => `<path d="M${CX - 20},160 Q${CX},176 ${CX + 20},160 L${CX + 24},172 Q${CX},190 ${CX - 24},172 Z" fill="${p.habit[1]}" ${trait()}/>`,
  uniforme: (p: Perso) => `<path d="M${CX - 20},166 L${CX},196 L${CX + 20},166 L${CX + 26},172 L${CX},210 L${CX - 26},172 Z" fill="${p.habit[1]}" ${trait()}/>`
    + `<rect x="${CX - 76}" y="182" width="26" height="8" fill="${p.galon ?? '#f2b53a'}" ${trait(1)}/><rect x="${CX + 50}" y="182" width="26" height="8" fill="${p.galon ?? '#f2b53a'}" ${trait(1)}/>`
    + `<circle cx="${CX}" cy="${206}" r="3" fill="${p.galon ?? '#f2b53a'}" ${trait(1)}/><circle cx="${CX}" cy="${218}" r="3" fill="${p.galon ?? '#f2b53a'}" ${trait(1)}/>`,
  blouson: (p: Perso) => `<path d="M${CX - 20},166 L${CX - 6},222 L${CX - 40},222 L${CX - 44},178 Z M${CX + 20},166 L${CX + 6},222 L${CX + 40},222 L${CX + 44},178 Z" fill="${p.habit[1]}" ${trait()}/>`
    + `<path d="M${CX - 18},170 L${CX},190 L${CX + 18},170" fill="${p.dessous ?? '#fffbf2'}" ${trait(1.2)}/>`,
  parka: (p: Perso) => `<path d="M${CX - 54},176 C${CX - 40},150 ${CX + 40},150 ${CX + 54},176 C${CX + 30},168 ${CX - 30},168 ${CX - 54},176 Z" fill="${p.fourrure ?? '#f6e3b8'}" ${trait()}/>`
    + `<path d="M${CX - 44},170 l4,-6 M${CX - 30},164 l3,-6 M${CX - 14},160 l2,-6 M${CX + 14},160 l-2,-6 M${CX + 30},164 l-3,-6 M${CX + 44},170 l-4,-6" fill="none" ${trait(1)}/>`
    + `<path d="M${CX},176 L${CX},222" fill="none" ${trait(1.4)}/>`,
  echarpe: (p: Perso) => `<path d="M${CX - 24},164 Q${CX},180 ${CX + 24},164 L${CX + 28},176 Q${CX},196 ${CX - 28},176 Z" fill="${p.echarpe}" ${trait()}/>`
    + `<path d="M${CX + 12},182 L${CX + 22},222 L${CX + 6},222 L${CX + 2},186 Z" fill="${p.echarpe}" ${trait()}/>`,
  maire: (_p: Perso) => `<path d="M${CX - 20},166 L${CX},186 L${CX + 20},166" fill="#fffbf2" ${trait(1.2)}/>`
    + `<path d="M${CX - 62},176 L${CX + 52},222 L${CX + 30},222 L${CX - 70},186 Z" fill="#8fb4e6" ${trait(1.2)}/><path d="M${CX - 66},181 L${CX + 41},222" fill="none" stroke="#fffbf2" stroke-width="5"/><path d="M${CX - 64},178 L${CX + 47},222" fill="none" stroke="#e98b7a" stroke-width="3" opacity="0.9"/>`
    + `<circle cx="${CX}" cy="192" r="5" fill="#f2b53a" ${trait(1)}/>`,
  robe: (_p: Perso) => `<path d="M${CX - 26},166 C${CX - 14},184 ${CX + 14},184 ${CX + 26},166" fill="none" ${trait(1.4)}/>`
    + `<path d="M${CX - 34},182 q8,4 14,0 M${CX + 20},182 q8,4 14,0" fill="none" ${trait(0.9)} opacity="0.6"/>`,
  scaphandre: (_p: Perso) => `<path d="M${CX - 40},170 C${CX - 40},158 ${CX + 40},158 ${CX + 40},170 L${CX + 44},186 C${CX + 20},194 ${CX - 20},194 ${CX - 44},186 Z" fill="#d9dde4" ${trait()}/>`
    + `<path d="M${CX - 42},180 C${CX - 20},188 ${CX + 20},188 ${CX + 42},180" fill="none" ${trait(1)}/>`
    + `<rect x="${CX - 54}" y="198" width="18" height="12" rx="2" fill="#e0571f" ${trait(1)}/><circle cx="${CX + 44}" cy="204" r="6" fill="#bcd6ee" ${trait(1)}/>`,
  capuche: (_p: Perso) => '',
  bretelles: (_p: Perso) => `<path d="M${CX - 18},166 L${CX},184 L${CX + 18},166" fill="#fffbf2" ${trait(1.2)}/><path d="M${CX - 40},172 L${CX - 34},222 M${CX + 40},172 L${CX + 34},222" fill="none" stroke="#7a5a48" stroke-width="6"/><path d="M${CX - 40},172 L${CX - 34},222 M${CX + 40},172 L${CX + 34},222" fill="none" ${trait(0.8)}/>`
    + `<path d="M${CX - 60},196 q10,-4 20,0 M${CX + 40},196 q10,-4 20,0" fill="none" ${trait(1)}/>`,
}

// Les accessoires, devant tout.
const ACC: Record<string, (p: Perso) => string> = {
  micro: (_p: Perso) => `<path d="M${CX - 44},70 C${CX - 44},20 ${CX + 44},20 ${CX + 44},70" fill="none" stroke="${ENCRE}" stroke-width="6"/><path d="M${CX - 44},70 C${CX - 44},20 ${CX + 44},20 ${CX + 44},70" fill="none" stroke="#6f7a8c" stroke-width="3.5"/>`
    + `<rect x="${CX - 50}" y="84" width="12" height="22" rx="5" fill="#6f7a8c" ${trait()}/><rect x="${CX + 38}" y="84" width="12" height="22" rx="5" fill="#6f7a8c" ${trait()}/>`
    + `<path d="M${CX - 44},104 C${CX - 40},126 ${CX - 30},132 ${CX - 14},130" fill="none" ${trait(2)}/><rect x="${CX - 16}" y="126" width="8" height="7" rx="3" fill="#2b2230"/>`,
  casque: (_p: Perso) => `<path d="M${CX - 48},92 C${CX - 48},20 ${CX + 48},20 ${CX + 48},92" fill="none" stroke="${ENCRE}" stroke-width="7"/><path d="M${CX - 48},92 C${CX - 48},20 ${CX + 48},20 ${CX + 48},92" fill="none" stroke="#c9a26a" stroke-width="4"/>`
    + `<ellipse cx="${CX - 47}" cy="98" rx="10" ry="16" fill="#c9a26a" ${trait()}/><ellipse cx="${CX + 47}" cy="98" rx="10" ry="16" fill="#c9a26a" ${trait()}/>`
    + `<ellipse cx="${CX - 47}" cy="98" rx="4" ry="8" fill="#8a6a44" ${trait(1)}/><ellipse cx="${CX + 47}" cy="98" rx="4" ry="8" fill="#8a6a44" ${trait(1)}/>`,
  lunettes: (_p: Perso) => `<circle cx="${CX - 15}" cy="97" r="10.5" fill="#fffbf2" fill-opacity="0.18" ${trait(2)}/><circle cx="${CX + 15}" cy="97" r="10.5" fill="#fffbf2" fill-opacity="0.18" ${trait(2)}/>`
    + `<path d="M${CX - 4.5},96 q4.5,-3 9,0 M${CX - 25.5},95 L${CX - 37},91 M${CX + 25.5},95 L${CX + 37},91" fill="none" ${trait(1.8)}/>`
    + `<path d="M${CX - 21},91 l4,-3 M${CX + 9},91 l4,-3" fill="none" stroke="#fffbf2" stroke-width="1.6" stroke-linecap="round"/>`,
  grosseslunettes: (_p: Perso) => `<circle cx="${CX - 16}" cy="97" r="13" fill="#bcd6ee" fill-opacity="0.25" ${trait(2.4)}/><circle cx="${CX + 16}" cy="97" r="13" fill="#bcd6ee" fill-opacity="0.25" ${trait(2.4)}/>`
    + `<path d="M${CX - 3},95 q3,-2 6,0" fill="none" ${trait(2)}/><path d="M${CX - 24},90 l5,-4 M${CX + 8},90 l5,-4" fill="none" stroke="#fffbf2" stroke-width="2" stroke-linecap="round"/>`,
  goggles: (p: Perso) => `<path d="M${CX - 40},64 C${CX - 20},56 ${CX + 20},56 ${CX + 40},64" fill="none" stroke="${ENCRE}" stroke-width="7"/><path d="M${CX - 40},64 C${CX - 20},56 ${CX + 20},56 ${CX + 40},64" fill="none" stroke="#7a5a48" stroke-width="4.5"/>`
    + `<ellipse cx="${CX - 15}" cy="60" rx="12" ry="9" fill="${p.verre ?? '#f2b53a'}" ${trait(2)}/><ellipse cx="${CX + 15}" cy="60" rx="12" ry="9" fill="${p.verre ?? '#f2b53a'}" ${trait(2)}/>`
    + `<path d="M${CX - 21},56 l5,-2 M${CX + 9},56 l5,-2" fill="none" stroke="#fffbf2" stroke-width="2" stroke-linecap="round"/>`,
  casquette: (p: Perso) => `<path d="M${CX - 42},74 C${CX - 44},38 ${CX + 44},38 ${CX + 42},74 Z" fill="${p.coiffe ?? '#8fb4e6'}" ${trait()}/>`
    + `<path d="M${CX - 44},74 C${CX - 20},68 ${CX + 30},68 ${CX + 64},80 C${CX + 40},86 ${CX - 10},84 ${CX - 44},80 Z" fill="${p.coiffe2 ?? '#6f8fc0'}" ${trait()}/>`
    + `<circle cx="${CX}" cy="56" r="6" fill="#fffbf2" ${trait(1.2)}/>`,
  kepi: (p: Perso) => `<path d="M${CX - 40},70 L${CX - 44},44 C${CX - 20},34 ${CX + 20},34 ${CX + 44},44 L${CX + 40},70 Z" fill="${p.coiffe ?? '#4a5a7a'}" ${trait()}/>`
    + `<path d="M${CX - 42},70 C${CX - 14},80 ${CX + 14},80 ${CX + 42},70 L${CX + 40},78 C${CX + 14},90 ${CX - 14},90 ${CX - 40},78 Z" fill="#2b2230"/>`
    + `<path d="M${CX - 41},66 L${CX + 41},66" fill="none" stroke="#f2b53a" stroke-width="3"/><path d="M${CX - 6},48 l6,-6 l6,6 l-6,6 Z" fill="#f2b53a" ${trait(1)}/>`,
  bonnet: (p: Perso) => `<path d="M${CX - 42},80 C${CX - 46},30 ${CX + 46},30 ${CX + 42},80 Z" fill="${p.coiffe ?? '#e98b7a'}" ${trait()}/>`
    + `<rect x="${CX - 45}" y="70" width="90" height="14" rx="4" fill="${p.coiffe2 ?? '#d9705e'}" ${trait()}/>`
    + [-30, -15, 0, 15, 30].map((dx) => `<path d="M${CX + dx},72 l0,10" fill="none" ${trait(0.9)} opacity="0.7"/>`).join(''),
  marin: (_p: Perso) => `<path d="M${CX - 44},74 C${CX - 46},44 ${CX + 46},44 ${CX + 44},74 Z" fill="#2f3e5c" ${trait()}/>`
    + `<path d="M${CX - 46},74 C${CX - 16},66 ${CX + 30},66 ${CX + 50},74 C${CX + 30},82 ${CX - 16},82 ${CX - 46},78 Z" fill="#1d1a24" ${trait()}/>`
    + `<path d="M${CX - 44},70 C${CX - 14},62 ${CX + 14},62 ${CX + 44},70" fill="none" stroke="#f2b53a" stroke-width="2"/><path d="M${CX - 6},56 q6,-8 12,0 q-6,6 -12,0" fill="#f2b53a" ${trait(0.8)}/>`,
  bandana: (_p: Perso) => `<path d="M${CX - 40},70 C${CX - 40},46 ${CX + 40},46 ${CX + 40},70 C${CX + 20},64 ${CX - 20},64 ${CX - 40},70 Z" fill="#e0571f" ${trait()}/>`
    + `<path d="M${CX + 38},66 l14,8 l-4,12 l-6,-6 Z" fill="#e0571f" ${trait()}/>` + [-24, -8, 8, 24].map((dx) => `<circle cx="${CX + dx}" cy="60" r="1.8" fill="#fffbf2"/>`).join(''),
  capuche: (_p: Perso) => '',
  pipe: (_p: Perso) => `<path d="M${CX + 8},132 L${CX + 34},140" fill="none" stroke="${ENCRE}" stroke-width="5" stroke-linecap="round"/><path d="M${CX + 8},132 L${CX + 34},140" fill="none" stroke="#7a4a32" stroke-width="2.6" stroke-linecap="round"/>`
    + `<path d="M${CX + 30},138 L${CX + 30},152 C${CX + 30},158 ${CX + 44},158 ${CX + 44},152 L${CX + 44},134 Z" fill="#7a4a32" ${trait()}/>`
    + `<path d="M${CX + 38},128 q-6,-8 0,-14 q6,-6 0,-14" fill="none" stroke="#fffbf2" stroke-width="2.5" stroke-linecap="round" opacity="0.8"/>`,
  boucle: (_p: Perso) => `<circle cx="${CX - 38}" cy="114" r="4.5" fill="none" stroke="#f2b53a" stroke-width="2.2"/><circle cx="${CX - 38}" cy="114" r="5.6" fill="none" ${trait(0.7)}/>`,
  perles: (_p: Perso) => `<circle cx="${CX - 37}" cy="112" r="3.6" fill="#fffbf2" ${trait(1)}/><circle cx="${CX + 37}" cy="112" r="3.6" fill="#fffbf2" ${trait(1)}/>`,
  cicatrice: (p: Perso) => `<path d="M${CX + 22},${p.cicatriceY ?? 104} l8,10 M${CX + 23},${(p.cicatriceY ?? 104) + 5} l4,-2 M${CX + 26},${(p.cicatriceY ?? 104) + 9} l4,-2" fill="none" stroke="#b0604a" stroke-width="1.4" stroke-linecap="round"/>`,
  sourcilcoupe: (p: Perso) => `<path d="M${CX + 17},80 l-3,9" fill="none" stroke="${p.peau[0]}" stroke-width="2.6"/>`,
  rousseur: (_p: Perso) => [[-22, 108], [-17, 111], [-26, 112], [-12, 109], [22, 108], [17, 111], [26, 112], [12, 109], [-4, 106], [4, 106]].map(([dx, dy]) => `<circle cx="${CX + dx}" cy="${dy}" r="0.9" fill="#a5694a" opacity="0.8"/>`).join(''),
  insigne: (_p: Perso) => `<path d="M${CX - 58},192 l8,-4 l8,4 l-2,10 l-6,4 l-6,-4 Z" fill="#e0571f" ${trait(1.2)}/><path d="M${CX - 50},192 l0,10" fill="none" stroke="#fffbf2" stroke-width="1.5"/>`,
  etoile: (_p: Perso) => `<path d="M${CX - 44},198 l2.4,5 5.4,.6 -4,3.6 1.2,5.4 -5,-2.8 -5,2.8 1.2,-5.4 -4,-3.6 5.4,-.6 Z" fill="#f2d58e" ${trait(1)}/>`,
  poussiere: (_p: Perso) => `<path d="M${CX - 30},116 q4,3 10,1 M${CX + 22},120 q5,1 8,-2" fill="none" stroke="#c96a4a" stroke-width="2" opacity="0.5" stroke-linecap="round"/>`,
  tempes: (p: Perso) => `<path d="M${CX - 38},72 C${CX - 42},84 ${CX - 40},94 ${CX - 34},100 C${CX - 34},88 ${CX - 30},80 ${CX - 26},74 Z M${CX + 38},72 C${CX + 42},84 ${CX + 40},94 ${CX + 34},100 C${CX + 34},88 ${CX + 30},80 ${CX + 26},74 Z" fill="${p.cheveux[0]}" ${trait(1.2)}/>`,
  sueur: (_p: Perso) => `<path d="M${CX + 36},76 q3,5 0,8 q-3,-3 0,-8 Z" fill="#bcd6ee" ${trait(1)}/>`,
}

// Les barbes et moustaches (devant le visage, derrière les accessoires).
const BARBES: Record<string, (c: string[]) => string> = {
  courte: (c: string[]) => `<path d="M${CX - 36},104 C${CX - 36},132 ${CX - 20},146 ${CX},146 C${CX + 20},146 ${CX + 36},132 ${CX + 36},104 C${CX + 30},120 ${CX + 18},120 ${CX + 12},122 C${CX + 4},118 ${CX - 4},118 ${CX - 12},122 C${CX - 18},120 ${CX - 30},120 ${CX - 36},104 Z" fill="${c[0]}" ${trait()}/>`
    + `<path d="M${CX - 12},124 q12,10 24,0 q-12,4 -24,0 Z" fill="${c[1]}"/>`,
  pleine: (c: string[]) => `<path d="M${CX - 38},96 C${CX - 42},144 ${CX - 22},172 ${CX},178 C${CX + 22},172 ${CX + 42},144 ${CX + 38},96 C${CX + 32},116 ${CX + 18},118 ${CX + 12},120 C${CX + 4},116 ${CX - 4},116 ${CX - 12},120 C${CX - 18},118 ${CX - 32},116 ${CX - 38},96 Z" fill="${c[0]}" ${trait()}/>`
    + `<path d="M${CX - 20},140 q4,14 0,26 M${CX},146 q2,14 0,26 M${CX + 20},140 q-4,14 0,26" fill="none" stroke="${c[1]}" stroke-width="1.6"/>`
    + `<path d="M${CX - 9},128 q9,5 18,0" fill="none" ${trait(1.4)}/>`,
  fleuve: (c: string[]) => `<path d="M${CX - 38},96 C${CX - 46},150 ${CX - 30},200 ${CX},214 C${CX + 30},200 ${CX + 46},150 ${CX + 38},96 C${CX + 32},116 ${CX + 18},118 ${CX + 12},120 C${CX + 4},116 ${CX - 4},116 ${CX - 12},120 C${CX - 18},118 ${CX - 32},116 ${CX - 38},96 Z" fill="${c[0]}" ${trait()}/>`
    + `<path d="M${CX - 22},146 q6,26 -2,50 M${CX},150 q4,26 0,58 M${CX + 22},146 q-6,26 2,50" fill="none" stroke="${c[1]}" stroke-width="1.8"/>`
    + `<path d="M${CX - 9},128 q9,5 18,0" fill="none" ${trait(1.4)}/>`,
  moustache: (c: string[]) => `<path d="M${CX},119 C${CX - 8},114 ${CX - 22},116 ${CX - 26},128 C${CX - 20},124 ${CX - 10},126 ${CX},123 C${CX + 10},126 ${CX + 20},124 ${CX + 26},128 C${CX + 22},116 ${CX + 8},114 ${CX},119 Z" fill="${c[0]}" ${trait()}/>`,
  barbe3j: (c: string[]) => `<path d="M${CX - 34},112 C${CX - 32},134 ${CX - 18},146 ${CX},146 C${CX + 18},146 ${CX + 32},134 ${CX + 34},112" fill="${c[0]}" opacity="0.35"/>`
    + Array.from({ length: 26 }, (_, k) => { const a = Math.PI * (0.08 + 0.84 * (k / 25)), r = 30 + (k % 3) * 4; return `<circle cx="${CX + Math.cos(a) * 30}" cy="${112 + Math.sin(a) * r}" r="0.8" fill="${ENCRE}" opacity="0.5"/>` }).join(''),
}

// Les treize : d'après leur rôle et leurs répliques (descriptions à valider, voir docs/portraits-prompts.md).
export const PERSOS: Perso[] = [
  { id: 'elsa', nom: 'Elsa Varga', role: 'Commandante de la Résistance', lieu: 'ISS', decor: 'iss', teinte: '#f3c2b0', age: 47,
    peau: PEAUX.rose, largeur: 36, machoire: 0.6, cheveux: ['#b9b2a8', '#857d72'], coupe: 'meche', cils: true, iris: '#4a6a8a', habit: ['#8fb4e6', '#6f8fc0'], col: 'combinaison', acc: ['micro', 'cicatrice', 'insigne'], sourcilsCouleur: '#8a8278' },
  { id: 'keita', nom: 'Dr Amadou Keïta', role: 'Sélénologue en exil', lieu: 'Lune', decor: 'lune', teinte: '#d7cdee', age: 64,
    peau: PEAUX.ebene, largeur: 38, machoire: 0.3, cheveux: ['#e8e4dc', '#bdb7ad'], coupe: 'chauve', barbe: 'courte', habit: ['#d7cdee', '#b6a8d6'], col: 'echarpe', echarpe: '#f2b53a', acc: ['lunettes'], sourcilsCouleur: '#d8d2c8' },
  { id: 'okafor', nom: 'Dr Samuel Okafor', role: 'Chef de la base Tycho', lieu: 'Station Tycho', decor: 'tycho', teinte: '#c9d6ee', age: 52,
    peau: PEAUX.brune, largeur: 40, machoire: 0.8, cheveux: ['#2b2230', '#4a3a40'], coupe: 'ras', barbe: 'barbe3j', habit: ['#f2b53a', '#d39a2a'], col: 'combinaison', cernes: true, acc: ['casquette'], coiffe: '#c9d6ee', coiffe2: '#9fb0d0' },
  { id: 'veilleur', nom: 'Le Veilleur', role: 'Ermite qui écoute le ciel', lieu: 'Hubble', decor: 'hubble', teinte: '#bfe0e8', age: 75,
    peau: PEAUX.claire, largeur: 34, machoire: 0.2, cheveux: ['#f4f1ea', '#c9c3b8'], coupe: 'long', barbe: 'fleuve', yeuxClos: true, habit: ['#7d8aa0', '#5f6a80'], col: 'capuche', capuche: '#7d8aa0', acc: ['casque'], sourcilsCouleur: '#e8e4dc' },
  { id: 'rosa', nom: 'Rosa Mendès', role: 'Contrebandière', lieu: 'Tiangong', decor: 'tiangong', teinte: '#f5c6a0', age: 34,
    peau: PEAUX.mate, largeur: 35, machoire: 0.35, cheveux: ['#2b2230', '#54404a'], coupe: 'boucles', iris: '#5a3a24', cils: true, habit: ['#7a4a32', '#5a3424'], col: 'blouson', dessous: '#e98b7a', acc: ['bandana', 'boucle', 'sourcilcoupe'], sourire: -2, regard: 1.5, cou: 11 },
  { id: 'helene', nom: 'Hélène Castagne', role: 'Directrice de la colonie Bradbury', lieu: 'Mars', decor: 'mars', teinte: '#f3a08b', age: 56,
    peau: PEAUX.claire, largeur: 36, machoire: 0.5, cheveux: ['#bdb4a8', '#948a7e'], coupe: 'carre', iris: '#5a6a3a', cils: true, habit: ['#e98b7a', '#c96a5a'], col: 'combinaison', acc: ['goggles', 'rousseur', 'poussiere'], verre: '#9fd0c8', cou: 11 },
  { id: 'odile', nom: 'Odile Varenne', role: 'Maire de Cythère, la ville flottante', lieu: 'Cythère', decor: 'cythere', teinte: '#f5d38a', age: 66,
    peau: PEAUX.rose, largeur: 36, machoire: 0.25, cheveux: ['#eae2d6', '#c4b9a8'], coupe: 'chignon', iris: '#6a5a8a', cils: true, habit: ['#cdbfe8', '#a898cc'], col: 'maire', acc: ['perles'], cou: 11, sourire: 3 },
  { id: 'aurelio', nom: 'Aurelio Benedetti', role: 'Chef de quart au Phare de Mercure', lieu: 'Phare de Mercure', decor: 'mercure', teinte: '#f7c59f', age: 41,
    peau: PEAUX.doree, largeur: 39, machoire: 0.7, cheveux: ['#3a2a24', '#5a4034'], coupe: 'court', barbe: 'moustache', habit: ['#fffbf2', '#e3dccd'], col: 'bretelles', acc: ['goggles', 'sueur'], verre: '#2b2230', nez: 2 },
  { id: 'nadia', nom: 'Nadia Orlov', role: 'Capitaine de la flotte jovienne', lieu: 'Ganymède', decor: 'ganymede', teinte: '#e8c9a0', age: 42,
    peau: PEAUX.claire, largeur: 35, machoire: 0.6, cheveux: ['#f2e6b8', '#cfbf88'], coupe: 'undercut', iris: '#6a8aa8', cils: true, habit: ['#4a5a7a', '#36425c'], col: 'uniforme', acc: ['kepi', 'tempes', 'perles'], coiffe: '#4a5a7a', sourire: -0.5, cou: 11 },
  { id: 'tomas', nom: 'Tomás Reyes', role: 'Pêcheur de méthane', lieu: 'Titan', decor: 'titan', teinte: '#f6e3b8', age: 53,
    peau: PEAUX.mate, largeur: 39, machoire: 0.75, cheveux: ['#3a2a24', '#5a4034'], coupe: 'ras', barbe: 'barbe3j', habit: ['#e0571f', '#b8441a'], col: 'parka', fourrure: '#f6e3b8', acc: ['bonnet', 'pipe'], coiffe: '#5f8f8a', coiffe2: '#4a736e' },
  { id: 'hana', nom: 'Hana Sato', role: 'Astronome en exil', lieu: 'Titania', decor: 'titania', teinte: '#bfe5e6', age: 31,
    peau: PEAUX.claire, largeur: 34, machoire: 0.2, cheveux: ['#2b2230', '#4a3a50'], coupe: 'frange', cils: true, habit: ['#2f3e5c', '#222d44'], col: 'roule', acc: ['grosseslunettes', 'etoile'], cou: 11 },
  { id: 'aksel', nom: 'Le vieil Aksel', role: 'Gardien de phare', lieu: 'Station Le Verrier', decor: 'leverrier', teinte: '#a9c0ee', age: 81,
    peau: PEAUX.rose, largeur: 37, machoire: 0.4, cheveux: ['#f4f1ea', '#c9c3b8'], coupe: 'chauve', barbe: 'pleine', iris: '#6a8aa8', habit: ['#2f3e5c', '#222d44'], col: 'roule', acc: ['marin', 'pipe'], sourcilsCouleur: '#f4f1ea', sourcils: 4, nez: 3 },
  { id: 'mira', nom: 'Mira Kovač', role: 'Exploratrice des Confins', lieu: 'Station Tombaugh', decor: 'tombaugh', teinte: '#c9b8e8', age: 36,
    peau: PEAUX.claire, largeur: 35, machoire: 0.45, cheveux: ['#b0603a', '#8a4428'], coupe: 'tresse', iris: '#4a7a5a', cils: true, habit: ['#d9dde4', '#b4bac6'], col: 'scaphandre', acc: ['rousseur', 'goggles'], verre: '#cdbfe8', cou: 11 },
]

/** Le portrait d'un personnage dans une humeur : 'neutre', 'joie' ou 'souci'. Cadre : 200 × 220. */
export function portraitSvg(p: Perso, h: Humeur = 'neutre', cadre = '0 0 200 220') {
  const ch = CHEVEUX[p.coupe](p.cheveux)
  const peau = p.peau
  const id = `${p.id}-${h}-${Math.random().toString(36).slice(2, 7)}`
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${cadre}" preserveAspectRatio="xMidYMax meet" class="perso">`
  s += `<defs><clipPath id="v-${id}"><path d="${visage(p)}"/></clipPath></defs>`
  // La capuche, derrière tout.
  if (p.col === 'capuche') s += `<path d="M${CX - 60},222 C${CX - 74},150 ${CX - 70},40 ${CX},30 C${CX + 70},40 ${CX + 74},150 ${CX + 60},222 Z" fill="${p.capuche}" ${trait()}/>`
    + `<path d="M${CX - 46},150 C${CX - 56},80 ${CX - 40},44 ${CX},42 C${CX + 40},44 ${CX + 56},80 ${CX + 46},150 Z" fill="#3a3448" ${trait()}/>`
  s += buste(p)
  if (COLS[p.col]) s += COLS[p.col](p)
  if (ch.dos) s += ch.dos
  // Les oreilles, le visage, son ombre (lumière à gauche), le rose des joues.
  s += `<ellipse cx="${CX - (p.largeur ?? 37) + 1}" cy="100" rx="6" ry="9" fill="${peau[0]}" ${trait()}/><ellipse cx="${CX + (p.largeur ?? 37) - 1}" cy="100" rx="6" ry="9" fill="${peau[1]}" ${trait()}/>`
  s += `<path d="${visage(p)}" fill="${peau[0]}"/>`
  s += `<g clip-path="url(#v-${id})"><path d="M${CX + 14},30 C${CX + 40},70 ${CX + 34},130 ${CX + 2},150 L${CX + 60},150 L${CX + 60},30 Z" fill="${peau[1]}" opacity="0.75"/></g>`
  s += `<path d="${visage(p)}" fill="none" ${trait()}/>`
  s += `<ellipse cx="${CX - 22}" cy="113" rx="7" ry="4" fill="#e98b7a" opacity="${h === 'joie' ? 0.45 : 0.22}"/><ellipse cx="${CX + 22}" cy="113" rx="7" ry="4" fill="#e98b7a" opacity="${h === 'joie' ? 0.35 : 0.15}"/>`
  s += rides(p) + yeux(p, h) + sourcils(p, h) + nez(p)
  if (p.barbe) s += BARBES[p.barbe](p.cheveux)
  if (!p.barbe || p.barbe === 'barbe3j' || p.barbe === 'moustache') s += bouche(p, h)
  else if (h === 'joie') s += `<path d="M${CX - 9},128 q9,7 18,0" fill="#fffbf2" ${trait(1.4)}/>`
  if (p.barbe === 'moustache') s += BARBES.moustache(p.cheveux)
  s += ch.devant
  for (const a of p.acc ?? []) s += ACC[a](p)
  return s + '</svg>'
}

// ———————————————————————————————————————————— Les décors (390 × 400)
const etoiles = (n: number, graine: number, h = 400) => { let g = graine, s = ''; const x = () => { g = (g * 16807) % 2147483647; return g / 2147483647 }
  for (let k = 0; k < n; k++) { const r = x() < 0.85 ? 0.8 : 1.6; s += `<circle cx="${(x() * 390).toFixed(1)}" cy="${(x() * h).toFixed(1)}" r="${r}" fill="#fffbf2" opacity="${(0.4 + x() * 0.6).toFixed(2)}"/>` } return s }
const planete = (cx: number, cy: number, r: number, base: string, bandes: [number, number, string][] = [], ombre = '#3a3448') => {
  const id = Math.random().toString(36).slice(2, 7)
  return `<defs><clipPath id="p${id}"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath></defs><circle cx="${cx}" cy="${cy}" r="${r}" fill="${base}"/>`
    + `<g clip-path="url(#p${id})">${bandes.map(([y, h, c]) => `<rect x="${cx - r}" y="${cy - r + y * 2 * r}" width="${2 * r}" height="${h * 2 * r}" fill="${c}"/>`).join('')}`
    + `<circle cx="${cx + r * 0.55}" cy="${cy + r * 0.1}" r="${r}" fill="${ombre}" opacity="0.55"/></g><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" ${trait(1.4)}/>`
}
const DECORS: Record<string, () => string> = {
  iss: () => `<rect width="390" height="400" fill="#d6d9de"/>`
    + `<rect x="0" y="0" width="390" height="70" fill="#c3c8cf"/><path d="M0,70 L390,70" ${trait(1.4)}/>`
    + [40, 130, 260, 350].map((x) => `<rect x="${x - 22}" y="14" width="44" height="40" rx="3" fill="#e8eaee" ${trait(1.2)}/><circle cx="${x - 14}" cy="22" r="2" fill="${ENCRE}"/><circle cx="${x + 14}" cy="46" r="2" fill="${ENCRE}"/>`).join('')
    + `<circle cx="285" cy="190" r="104" fill="#a9b0ba" ${trait(2)}/><circle cx="285" cy="190" r="88" fill="#0e1420" ${trait(2)}/>`
    + `<g clip-path="url(#hublot)"><defs><clipPath id="hublot"><circle cx="285" cy="190" r="88"/></clipPath></defs>${etoiles(30, 7)}`
    + `<circle cx="300" cy="320" r="150" fill="#8fb4e6"/><path d="M190,250 C220,226 260,240 268,214 C290,206 300,230 330,222 C350,240 340,262 310,270 C280,276 240,262 210,280 Z" fill="#b8d49a" ${trait(1)}/>`
    + `<path d="M160,280 q40,-14 80,-6 M250,248 q30,-10 70,0 M300,286 q30,-8 60,0" fill="none" stroke="#fffbf2" stroke-width="5" stroke-linecap="round" opacity="0.85"/>`
    + `<circle cx="300" cy="320" r="152" fill="none" stroke="#bcd6ee" stroke-width="5" opacity="0.7"/></g>`
    + Array.from({ length: 12 }, (_, k) => { const a = (k / 12) * 2 * Math.PI; return `<circle cx="${285 + Math.cos(a) * 96}" cy="${190 + Math.sin(a) * 96}" r="3" fill="#7d8592" ${trait(1)}/>` }).join('')
    + `<path d="M0,330 C80,322 120,350 200,344" fill="none" stroke="#e0571f" stroke-width="6"/><path d="M0,346 C70,340 110,364 180,360" fill="none" stroke="#f2b53a" stroke-width="5"/><path d="M0,330 C80,322 120,350 200,344 M0,346 C70,340 110,364 180,360" fill="none" ${trait(0.8)}/>`
    + `<rect x="18" y="96" width="70" height="120" fill="#e8eaee" ${trait(1.2)}/>` + [0, 1, 2, 3].map((k) => `<rect x="28" y="${108 + k * 26}" width="50" height="14" fill="${['#f2b53a', '#bcd6ee', '#e98b7a', '#b8d49a'][k]}" ${trait(1)}/>`).join('')
    + `<path d="M110,90 L110,300" fill="none" stroke="#f2b53a" stroke-width="7"/><path d="M110,90 L110,300" fill="none" ${trait(0.8)}/>`,
  lune: () => `<rect width="390" height="400" fill="#0e1420"/>${etoiles(80, 3)}` + planete(300, 90, 46, '#8fb4e6', [[0.2, 0.18, '#b8d49a'], [0.55, 0.12, '#b8d49a']], '#0e1420')
    + `<path d="M0,250 C60,236 120,246 180,238 C260,228 320,246 390,236 L390,400 L0,400 Z" fill="#c9c6c0" ${trait(1.6)}/>`
    + `<path d="M0,300 C90,288 200,302 390,286 L390,400 L0,400 Z" fill="#b3afa8"/>`
    + [[60, 270, 30], [250, 262, 20], [330, 320, 40], [130, 340, 26]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.32}" fill="#9a958d" ${trait(1.2)}/><path d="M${x - r},${y} q${r},${r * 0.5} ${2 * r},0" fill="none" stroke="#e3e0d9" stroke-width="2"/>`).join('')
    + `<path d="M200,236 l14,-30 l8,30 Z M214,206 l0,-14" fill="#e3e0d9" ${trait(1.2)}/><path d="M214,192 l14,5 l-14,5" fill="#e0571f" ${trait(1)}/>`,
  tycho: () => `<rect width="390" height="400" fill="#0e1420"/>${etoiles(70, 11)}` + planete(70, 70, 24, '#8fb4e6', [[0.3, 0.2, '#b8d49a']], '#0e1420')
    + `<path d="M0,280 C100,270 280,286 390,272 L390,400 L0,400 Z" fill="#b3afa8" ${trait(1.6)}/>`
    + `<path d="M60,282 C60,150 330,150 330,282 Z" fill="#bcd6ee" fill-opacity="0.55" ${trait(2)}/>`
    + [100, 140, 195, 250, 290].map((x) => `<path d="M${x},${282 - (x === 195 ? 128 : x < 195 ? (x - 60) * 1.1 : (330 - x) * 1.1)} L${x},282" fill="none" ${trait(1)} opacity="0.6"/>`).join('')
    + `<path d="M74,230 C140,206 250,206 316,230" fill="none" ${trait(1)} opacity="0.6"/>`
    + `<rect x="120" y="230" width="60" height="52" fill="#e8eaee" ${trait(1.4)}/><rect x="200" y="214" width="70" height="68" fill="#f2d58e" ${trait(1.4)}/>`
    + [130, 150, 210, 230, 250].map((x, k) => `<rect x="${x}" y="${k < 2 ? 244 : 230}" width="10" height="10" fill="#f2b53a" ${trait(1)}/>`).join('')
    + `<path d="M296,182 q24,-6 30,10 M296,190 q20,-2 24,8" fill="none" stroke="#fffbf2" stroke-width="2" stroke-dasharray="3 3" opacity="0.7"/>`,
  hubble: () => `<rect width="390" height="400" fill="#141826"/>${etoiles(120, 21)}`
    + `<circle cx="80" cy="90" r="40" fill="#cdbfe8" opacity="0.25"/><circle cx="80" cy="90" r="18" fill="#cdbfe8" opacity="0.4"/>`
    + `<g transform="rotate(-18 250 160)"><rect x="150" y="130" width="200" height="66" rx="6" fill="#d9dde4" ${trait(1.8)}/><rect x="320" y="126" width="26" height="74" fill="#a9b0ba" ${trait(1.6)}/>`
    + `<rect x="190" y="60" width="60" height="68" fill="#4a5a7a" ${trait(1.4)}/><rect x="190" y="198" width="60" height="68" fill="#4a5a7a" ${trait(1.4)}/>`
    + [0, 1, 2].map((k) => `<path d="M${190 + k * 20},60 L${190 + k * 20},128 M${190 + k * 20},198 L${190 + k * 20},266" ${trait(0.8)}/>`).join('')
    + `<path d="M170,130 L170,196 M230,130 L230,196 M290,130 L290,196" ${trait(1)}/></g>`
    + `<path d="M40,330 q20,-10 40,0 q20,10 40,0" fill="none" stroke="#cdbfe8" stroke-width="2" opacity="0.6"/><path d="M30,350 q30,-14 60,0 q30,14 60,0" fill="none" stroke="#cdbfe8" stroke-width="2" opacity="0.4"/>`,
  tiangong: () => `<rect width="390" height="400" fill="#141826"/>${etoiles(60, 31)}`
    + `<path d="M-40,400 C40,300 350,300 430,400 Z" fill="#8fb4e6" ${trait(1.6)}/><path d="M0,360 q60,-20 130,-10 M200,350 q60,-14 150,0" fill="none" stroke="#fffbf2" stroke-width="6" stroke-linecap="round" opacity="0.8"/>`
    + `<path d="M-40,400 C40,300 350,300 430,400" fill="none" stroke="#bcd6ee" stroke-width="8" opacity="0.6"/>`
    + `<rect x="120" y="120" width="170" height="48" rx="20" fill="#e8eaee" ${trait(1.8)}/><rect x="70" y="128" width="54" height="32" rx="10" fill="#d9dde4" ${trait(1.6)}/>`
    + `<rect x="190" y="44" width="40" height="76" fill="#e0a85a" ${trait(1.4)}/><rect x="190" y="168" width="40" height="76" fill="#e0a85a" ${trait(1.4)}/>`
    + [0, 1, 2, 3].map((k) => `<path d="M190,${62 + k * 16} L230,${62 + k * 16} M190,${186 + k * 16} L230,${186 + k * 16}" ${trait(0.8)}/>`).join('')
    + `<path d="M150,124 L150,164 M260,124 L260,164" ${trait(1)}/><rect x="300" y="138" width="10" height="12" fill="#e0571f" ${trait(1)}/>`,
  mars: () => `<rect width="390" height="400" fill="#f3b49a"/><rect width="390" height="140" fill="#f6c8a8"/>`
    + `<circle cx="80" cy="70" r="14" fill="#fffbf2" opacity="0.8"/><circle cx="300" cy="50" r="6" fill="#d9705e" ${trait(1)}/>`
    + `<path d="M0,210 L60,170 L110,196 L170,150 L250,200 L320,176 L390,196 L390,400 L0,400 Z" fill="#d9705e" ${trait(1.6)}/>`
    + `<path d="M0,260 C80,244 160,266 240,250 C300,240 350,256 390,250 L390,400 L0,400 Z" fill="#e98b7a" ${trait(1.4)}/>`
    + `<path d="M60,262 C60,226 130,226 130,262 Z M150,256 C150,206 250,206 250,256 Z M266,256 C266,232 316,232 316,256 Z" fill="#bcd6ee" fill-opacity="0.75" ${trait(1.6)}/>`
    + `<rect x="128" y="246" width="24" height="10" fill="#f2d58e" ${trait(1)}/><path d="M200,206 L200,186 M200,186 l12,4 l-12,4" fill="#e0571f" ${trait(1.2)}/>`
    + `<path d="M0,300 C60,296 120,316 200,300 C260,290 320,310 390,300" fill="none" stroke="#f6c8a8" stroke-width="3" opacity="0.7"/>`
    + `<path d="M20,120 q60,-20 120,0 q60,20 120,0" fill="none" stroke="#e98b7a" stroke-width="10" opacity="0.35" stroke-linecap="round"/>`,
  cythere: () => `<rect width="390" height="400" fill="#f6c27a"/><rect width="390" height="160" fill="#f8d79a"/>`
    + `<circle cx="70" cy="70" r="40" fill="#fffbf2" opacity="0.55"/>`
    + `<path d="M0,270 C40,250 80,262 110,250 C150,236 190,256 230,246 C280,232 330,252 390,244 L390,400 L0,400 Z" fill="#f2d58e" ${trait(1.4)}/>`
    + `<path d="M0,320 C60,300 120,316 180,304 C240,292 300,312 390,300 L390,400 L0,400 Z" fill="#f2b53a" opacity="0.7"/>`
    + `<ellipse cx="230" cy="110" rx="66" ry="44" fill="#fffbf2" ${trait(1.8)}/><path d="M168,104 C200,96 260,96 294,104 M174,124 C210,132 250,132 288,124" fill="none" ${trait(1)}/>`
    + `<path d="M190,150 L200,180 M270,150 L260,180" ${trait(1.2)}/><rect x="170" y="180" width="120" height="30" fill="#cdbfe8" ${trait(1.6)}/>`
    + [180, 200, 220, 240, 260].map((x) => `<rect x="${x}" y="164" width="12" height="16" fill="#e98b7a" ${trait(1)}/><path d="M${x},164 l6,-8 l6,8" fill="#e0571f" ${trait(1)}/>`).join('')
    + `<ellipse cx="80" cy="180" rx="24" ry="16" fill="#fffbf2" ${trait(1.4)}/><rect x="70" y="200" width="20" height="10" fill="#cdbfe8" ${trait(1)}/><path d="M74,194 L76,200 M86,194 L84,200" ${trait(1)}/>`,
  mercure: () => `<rect width="390" height="400" fill="#141826"/>${etoiles(40, 41, 200)}`
    + `<circle cx="300" cy="250" r="190" fill="#f2b53a" opacity="0.2"/><circle cx="300" cy="250" r="140" fill="#f6c27a" ${trait(2)}/>`
    + Array.from({ length: 16 }, (_, k) => { const a = (k / 16) * 2 * Math.PI; return `<path d="M${300 + Math.cos(a) * 146},${250 + Math.sin(a) * 146} L${300 + Math.cos(a) * 170},${250 + Math.sin(a) * 170}" stroke="#f2b53a" stroke-width="4" stroke-linecap="round"/>` }).join('')
    + `<path d="M0,280 L50,260 L90,276 L140,250 L200,272 L260,262 L320,284 L390,270 L390,400 L0,400 Z" fill="#8a8580" ${trait(1.6)}/>`
    + `<path d="M0,330 C100,320 250,340 390,326 L390,400 L0,400 Z" fill="#6f6a66"/>`
    + `<rect x="78" y="150" width="34" height="120" fill="#e8eaee" ${trait(1.6)}/><path d="M70,150 L120,150 L112,128 L78,128 Z" fill="#2b2230" ${trait(1.4)}/><rect x="84" y="134" width="22" height="12" fill="#fffbf2"/>`
    + `<path d="M95,128 L95,112" ${trait(1.4)}/><path d="M78,190 L112,190 M78,230 L112,230" ${trait(1)}/>`
    + `<path d="M60,262 L130,262 L120,300 L70,300 Z" fill="#a9b0ba" ${trait(1.2)}/>`,
  ganymede: () => `<rect width="390" height="400" fill="#0e1420"/>${etoiles(50, 51)}`
    + planete(230, 150, 170, '#f2d58e', [[0.12, 0.08, '#e0a85a'], [0.3, 0.1, '#f6c8a8'], [0.46, 0.07, '#d9705e'], [0.6, 0.12, '#e0a85a'], [0.8, 0.07, '#f6c8a8']], '#1d1a24')
    + `<ellipse cx="180" cy="210" rx="26" ry="14" fill="#d9705e" ${trait(1.2)}/>`
    + `<path d="M0,290 C80,276 160,292 240,280 C300,272 350,286 390,280 L390,400 L0,400 Z" fill="#c9d6ee" ${trait(1.6)}/>`
    + `<path d="M0,330 L120,312 L200,330 L390,310 L390,400 L0,400 Z" fill="#a9b8d6"/><path d="M40,330 l60,-10 M220,326 l80,-12" fill="none" stroke="#fffbf2" stroke-width="2" opacity="0.7"/>`,
  titan: () => `<rect width="390" height="400" fill="#e0a85a"/><rect width="390" height="200" fill="#f2c27a"/>`
    + `<circle cx="300" cy="80" r="40" fill="#f6d8a8" opacity="0.5"/><ellipse cx="300" cy="80" rx="80" ry="10" fill="none" stroke="#f6d8a8" stroke-width="4" opacity="0.45"/>`
    + `<path d="M0,230 C80,220 120,236 200,228 C280,220 330,232 390,226 L390,260 L0,260 Z" fill="#b8763a" ${trait(1.4)}/>`
    + `<rect x="0" y="258" width="390" height="142" fill="#5f6a7a"/><path d="M0,258 L390,258" ${trait(1.6)}/>`
    + [280, 300, 322, 346, 372].map((y, k) => `<path d="M${20 + k * 30},${y} q40,-6 80,0 M${200 + k * 20},${y + 6} q30,-4 60,0" fill="none" stroke="#a9b0ba" stroke-width="2" opacity="0.6"/>`).join('')
    + `<path d="M120,292 L230,292 L216,312 L134,312 Z" fill="#e0571f" ${trait(1.6)}/><path d="M170,292 L170,236 M170,240 L206,280 L170,280" fill="#fffbf2" ${trait(1.4)}/>`
    + `<path d="M228,294 Q268,250 300,310" fill="none" ${trait(1.2)}/>`,
  titania: () => `<rect width="390" height="400" fill="#0e1420"/>${etoiles(70, 61)}`
    + planete(120, 120, 80, '#bfe5e6', [[0.4, 0.2, '#a9dcd9']], '#0e1420')
    + `<ellipse cx="120" cy="120" rx="14" ry="110" fill="none" stroke="#bfe5e6" stroke-width="1.5" opacity="0.6"/>`
    + `<path d="M0,280 L70,262 L140,290 L230,256 L300,276 L390,262 L390,400 L0,400 Z" fill="#c9c6d6" ${trait(1.6)}/>`
    + `<path d="M210,256 L240,210 L262,262 Z" fill="#e3e0ec" ${trait(1.4)}/><path d="M290,276 L330,180 L360,268 Z" fill="#d6d2e2" ${trait(1.4)}/>`
    + `<rect x="40" y="250" width="56" height="34" fill="#e8eaee" ${trait(1.4)}/><path d="M60,250 C60,226 90,226 90,250" fill="#cdbfe8" ${trait(1.4)}/><path d="M76,232 L96,214" ${trait(2)}/>`,
  leverrier: () => `<rect width="390" height="400" fill="#0e1420"/>${etoiles(90, 71)}`
    + planete(300, 110, 70, '#6f8fc0', [[0.3, 0.06, '#8fb4e6'], [0.6, 0.05, '#4a5a7a']], '#0e1420')
    + `<path d="M0,300 C100,296 250,306 390,298 L390,400 L0,400 Z" fill="#4a5a7a" ${trait(1.6)}/>`
    + `<rect x="110" y="130" width="50" height="180" fill="#e8eaee" ${trait(1.8)}/>` + [0, 1, 2].map((k) => `<rect x="110" y="${170 + k * 44}" width="50" height="16" fill="#e0571f" ${trait(1.2)}/>`).join('')
    + `<rect x="104" y="100" width="62" height="30" fill="#2b2230" ${trait(1.4)}/><rect x="114" y="106" width="42" height="18" fill="#f2d58e"/>`
    + `<path d="M135,100 L135,84" ${trait(1.6)}/><path d="M166,110 L390,40 L390,180 Z" fill="#f2d58e" opacity="0.28"/>`,
  tombaugh: () => `<rect width="390" height="400" fill="#141826"/>${etoiles(140, 81)}`
    + `<circle cx="300" cy="60" r="3.5" fill="#fffbf2"/><circle cx="300" cy="60" r="10" fill="#fffbf2" opacity="0.2"/>`
    + `<path d="M0,250 C70,240 150,256 230,246 C300,238 350,250 390,244 L390,400 L0,400 Z" fill="#e8d6c0" ${trait(1.6)}/>`
    + `<path d="M140,290 C120,260 170,250 190,276 C210,250 260,260 240,290 L190,340 Z" fill="#f6efe6" ${trait(1.4)}/>`
    + `<path d="M0,300 C40,296 80,320 100,340 L0,360 Z" fill="#c98e66" opacity="0.6"/>`
    + `<rect x="270" y="236" width="70" height="40" fill="#e8eaee" ${trait(1.4)}/><path d="M270,236 C270,210 340,210 340,236" fill="#cdbfe8" ${trait(1.4)}/><circle cx="305" cy="256" r="6" fill="#f2b53a" ${trait(1)}/>`,
}
export const decorSvg = (nom: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 390 400" preserveAspectRatio="xMidYMid slice" class="decor">${DECORS[nom]()}</svg>`


// ———————————————————————————————————————————— Les images de ChatGPT
// Une image arrivée (Adrien la fait faire à ChatGPT, Claude la recadre et la range dans public/) remplace le dessin :
// ajouter ici l'identifiant du PNJ (trois images : portraits/<id>-neutre.webp, -joie.webp, -souci.webp) ou du décor
// (decors/<decor>.webp).
const PORTRAITS_PRETS: readonly string[] = ['elsa', 'keita', 'okafor', 'veilleur']
const DECORS_PRETS: readonly string[] = []

const PAR_ID = new Map(PERSOS.map((p) => [p.id, p]))

/** Le portrait d'un PNJ dans une humeur (une image, sinon son dessin), cadré pour la case du dialogue ; '' s'il n'en a pas. */
export function portraitDe(id: string, h: Humeur): string {
  if (PORTRAITS_PRETS.includes(id)) return `<img class="perso" src="portraits/${id}-${h}.webp" alt="">`
  const p = PAR_ID.get(id)
  return p ? portraitSvg(p, h, '-6 -30 212 262') : ''
}

/** Le décor du lieu d'un PNJ (une image, sinon son dessin) ; '' s'il n'en a pas. */
export function decorDe(id: string): string {
  const p = PAR_ID.get(id)
  if (!p) return ''
  return DECORS_PRETS.includes(p.decor) ? `<img class="decor" src="decors/${p.decor}.webp" alt="">` : decorSvg(p.decor)
}
