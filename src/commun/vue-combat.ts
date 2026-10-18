// La vue tactique du combat (étape 6, prototype à tester ; d'après la maquette validée le 18/10/2026), en plein écran
// par-dessus la carte : le chasseur alien vu du dessus et ses modules (touche-en un pour le viser), ses missiles en vol
// avec leur décompte, la capsule et son bouclier ; en dessous, la coque, INTERCEPTER, TIRER (qui se recharge) et
// l'énergie à répartir. La vue ne décide rien : elle montre l'état du combat que tient le moteur (moteur/combat.ts).

import { COQUE_MAX, MODULES_ENNEMI, RECHARGE_CANON, VOL_MISSILE, type Energie, type NomModuleEnnemi, type SystemeEnergie } from '../donnees/combat'
import {
  avancerCombat, fuir, intercepter, nouveauCombat, pretATirer, repartir, tirer, type EtatCombat, type EvenementCombat,
} from '../moteur/combat'
import { htmlEnergie } from './volet-capsule'

/** Place des modules ennemis sur le dessin du chasseur. */
const PLACES: Record<NomModuleEnnemi, [number, number]> = { missiles: [185, 52], bouclier: [122, 100], reacteur: [248, 100], canon: [185, 122] }
const CAPSULE: [number, number] = [185, 268]

/** Un combat : son titre, et ce qui arrive à la fin (un vrai chasseur : vaincu, ou la coque abîmée ; le texte dit quoi). */
export interface OptionsCombat { titre: string; surFin?: (fin: 'victoire' | 'retraite' | 'fuite') => string }
export const SIMULATEUR: OptionsCombat = { titre: 'SIMULATEUR · CHASSEUR ALIEN' }

export class VueCombat {
  private etat: EtatCombat | null = null
  private options: OptionsCombat = SIMULATEUR
  private finRacontee = false
  private cible: NomModuleEnnemi = 'reacteur'
  private message = ''
  private finMessage = 0
  /** Dernier tir ennemi (pour le dessiner un instant) et dernier coup au but de la capsule. */
  private tirEnnemi: { t: number; issue: string } | null = null
  private notreTir: { t: number; cible: NomModuleEnnemi } | null = null
  private boucle = 0
  private derniereEnergie = ''
  private scene: SVGSVGElement
  private elCoque: HTMLElement
  private elMessage: HTMLElement
  private elMissile: HTMLElement
  private elIntercepter: HTMLButtonElement
  private elTirer: HTMLButtonElement
  private elCible: HTMLElement
  private elEnergie: HTMLElement
  private elFin: HTMLElement

  /** energie : la répartition de départ (celle de l'Armement) ; garder : appelé quand le joueur la change. */
  constructor(private element: HTMLElement, private energie: () => Energie, private garder: (e: Energie) => void) {
    element.innerHTML = `
      <div class="entete-plein"><span class="titre-combat"></span><button type="button" data-fuir>FUIR</button></div>
      <div class="corps">
        <svg class="scene sans-glisser" viewBox="0 0 370 300"></svg>
        <div class="etat-combat"><span>COQUE</span><span class="jauge-coque"><i></i></span><b class="coque"></b></div>
        <p class="message-combat"></p>
        <div class="ligne-combat missile"><span class="texte-missile"></span><button type="button" class="principal" data-intercepter>INTERCEPTER</button></div>
        <div class="ligne-combat"><span>Cible : <b class="cible"></b><small>touche un module pour le viser</small></span><button type="button" class="principal" data-tirer>TIRER</button></div>
        <h3>Énergie</h3>
        <div class="energie"></div>
      </div>
      <div class="fin-combat" hidden></div>`
    this.scene = element.querySelector('.scene')!
    this.elCoque = element.querySelector('.etat-combat')!
    this.elMessage = element.querySelector('.message-combat')!
    this.elMissile = element.querySelector('.missile')!
    this.elIntercepter = element.querySelector('[data-intercepter]')!
    this.elTirer = element.querySelector('[data-tirer]')!
    this.elCible = element.querySelector('.cible')!
    this.elEnergie = element.querySelector('.energie')!
    this.elFin = element.querySelector('.fin-combat')!
    // Viser : au toucher (pointerdown), la scène étant redessinée à chaque image.
    this.scene.addEventListener('pointerdown', (e) => {
      const m = (e.target as Element).closest<SVGElement>('[data-module]')
      if (m) this.cible = m.dataset.module as NomModuleEnnemi
    })
    element.addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest<HTMLButtonElement>('button')
      if (!b || b.disabled) return
      const t = Date.now(), etat = this.etat
      if (b.dataset.fermer !== undefined) { this.fermer(); return }
      if (b.dataset.rejouer !== undefined) { this.ouvrir(this.options); return }
      if (!etat) return
      if (b.dataset.fuir !== undefined) {
        if (etat.fin) this.fermer()
        else this.dire(fuir(etat, t) ? 'Fuite en cours : les moteurs chauffent…' : 'Impossible de fuir sans énergie aux moteurs')
      } else if (b.dataset.intercepter !== undefined) {
        this.dire(intercepter(etat, t) ? 'Missile intercepté !' : 'Rien à intercepter')
      } else if (b.dataset.tirer !== undefined) {
        const r = tirer(etat, this.cible, t)
        const nom = MODULES_ENNEMI.find((m) => m.nom === this.cible)!.titre
        if (r === 'touche' || r === 'detruit' || r === 'arrete') this.notreTir = { t, cible: this.cible }
        this.dire(r === 'touche' ? `Touché : ${nom}` : r === 'detruit' ? `${nom} hors service !` : r === 'arrete' ? 'Arrêté par le bouclier ennemi'
          : r === 'deja-detruit' ? `${nom} est déjà hors service` : 'Canon en recharge')
      } else if (b.dataset.energie !== undefined) {
        repartir(etat.energie, b.dataset.energie as SystemeEnergie, Number(b.dataset.d) as 1 | -1)
        this.garder({ ...etat.energie })
      }
      this.dessiner()
    })
  }

  get ouvert(): boolean {
    return !this.element.hidden
  }

  /** Commence un combat d'entraînement. */
  ouvrir(options: OptionsCombat = SIMULATEUR): void {
    this.options = options
    this.finRacontee = false
    this.element.querySelector('.titre-combat')!.textContent = options.titre
    const t = Date.now()
    this.etat = nouveauCombat((t % 2147483647) >>> 0, this.energie(), t)
    this.cible = 'reacteur'
    this.tirEnnemi = this.notreTir = null
    this.derniereEnergie = ''
    this.dire('Le chasseur approche. Répartis ton énergie, vise, tire !')
    this.element.hidden = false
    cancelAnimationFrame(this.boucle)
    const image = () => {
      if (this.element.hidden) return
      this.dessiner()
      this.boucle = requestAnimationFrame(image)
    }
    image()
  }

  fermer(): void {
    this.element.hidden = true
    cancelAnimationFrame(this.boucle)
    this.etat = null
  }

  private dire(texte: string): void {
    this.message = texte
    this.finMessage = Date.now() + 2500
  }

  /** Ce que disent les événements du combat. */
  private raconter(ev: EvenementCombat[], t: number): void {
    for (const e of ev) {
      if (e.genre === 'missile-lance') this.dire('⚠ Missile lancé ! Intercepte-le')
      else if (e.genre === 'impact-missile') { this.dire('Impact de missile ! Coque endommagée'); navigator.vibrate?.(200) }
      else if (e.genre === 'tir-ennemi') {
        this.tirEnnemi = { t, issue: e.issue }
        if (e.issue === 'touche') navigator.vibrate?.(40)
      }
    }
  }

  private dessiner(): void {
    const e = this.etat
    if (!e) return
    const t = Date.now()
    this.raconter(avancerCombat(e, t), t)

    // La scène.
    let s = '<rect width="370" height="300" class="fond"/>'
    for (let x = 30; x < 370; x += 40) s += `<line x1="${x}" y1="0" x2="${x}" y2="300" class="grille"/>`
    for (let y = 20; y < 300; y += 40) s += `<line x1="0" y1="${y}" x2="370" y2="${y}" class="grille"/>`
    s += '<path d="M185 8 L290 108 L240 102 L226 142 L144 142 L130 102 L80 108 Z" class="chasseur"/>'
    s += '<path d="M185 8 L185 142 M130 102 L240 102" class="nervure"/>'
    for (const m of e.modules) {
      const [x, y] = PLACES[m.nom], vise = m.nom === this.cible, titre = MODULES_ENNEMI.find((f) => f.nom === m.nom)!.titre
      s += `<g data-module="${m.nom}" class="module-ennemi${m.pv ? '' : ' hs'}${vise ? ' vise' : ''}">`
        + `<rect x="${x - 34}" y="${y - 15}" width="68" height="30" rx="5"/>`
        + `<text x="${x}" y="${y - 2}" text-anchor="middle">${titre}</text>`
        + `<text x="${x}" y="${y + 10}" text-anchor="middle" class="pv">${m.pv ? '▮'.repeat(m.pv) + '▯'.repeat(m.pvMax - m.pv) : '✕ HS'}</text></g>`
    }
    // Notre tir (un trait jaune), le tir ennemi (un trait rouge, arrêté ou esquivé), les missiles en vol.
    if (this.notreTir && t - this.notreTir.t < 250) {
      const [x, y] = PLACES[this.notreTir.cible]
      s += `<line x1="${CAPSULE[0]}" y1="${CAPSULE[1] - 18}" x2="${x}" y2="${y + 14}" class="tir-capsule"/>`
    }
    if (this.tirEnnemi && t - this.tirEnnemi.t < 300) {
      const fin = this.tirEnnemi.issue === 'touche' ? CAPSULE[1] - 6 : this.tirEnnemi.issue === 'arrete' ? CAPSULE[1] - 30 : CAPSULE[1] - 10
      const dx = this.tirEnnemi.issue === 'esquive' ? 40 : 0
      s += `<line x1="185" y1="136" x2="${CAPSULE[0] + dx}" y2="${fin}" class="tir-ennemi"/>`
      if (this.tirEnnemi.issue === 'arrete') s += `<circle cx="${CAPSULE[0]}" cy="${CAPSULE[1] - 30}" r="7" class="eclat"/>`
    }
    for (const m of e.missiles) {
      const f = Math.min(1, (t - m.lance) / VOL_MISSILE)
      const y = 150 + f * (CAPSULE[1] - 172), x = 206 - f * 16
      s += `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(100)"><path d="M-10 -2.5 h15 l6 2.5 l-6 2.5 h-15z" class="missile-vol"/></g>`
        + `<text x="${(x + 12).toFixed(1)}" y="${(y + 4).toFixed(1)}" class="decompte">${Math.ceil((m.impact - t) / 1000)} s</text>`
    }
    // La capsule et son bouclier (plus épais avec plus de crans).
    s += `<ellipse cx="${CAPSULE[0]}" cy="${CAPSULE[1]}" rx="${32 + e.energie.boucliers * 4}" ry="${18 + e.energie.boucliers * 3}" class="bouclier" style="opacity:${0.15 + e.energie.boucliers * 0.2}"/>`
    s += `<g transform="translate(${CAPSULE[0]} ${CAPSULE[1]})"><path d="M0 -20 L13 11 L0 6 L-13 11 Z" class="capsule"/>`
      + (e.fuiteJusqua !== null && !e.fin ? '<path d="M-6 12 L0 26 L6 12" class="flamme"/>' : '') + '</g>'
    this.scene.innerHTML = s

    // La coque, le message, le missile le plus proche, les boutons.
    this.elCoque.querySelector<HTMLElement>('i')!.style.width = `${(100 * e.coque) / COQUE_MAX}%`
    this.elCoque.querySelector('.coque')!.textContent = `${e.coque}/${COQUE_MAX}`
    const texte = t < this.finMessage ? this.message : e.fuiteJusqua !== null && !e.fin ? `Fuite dans ${Math.ceil((e.fuiteJusqua - t) / 1000)} s…` : ''
    if (this.elMessage.textContent !== texte) this.elMessage.textContent = texte
    const proche = e.missiles.reduce<typeof e.missiles[number] | null>((a, b) => (!a || b.impact < a.impact ? b : a), null)
    this.elMissile.classList.toggle('alerte', !!proche)
    this.elMissile.querySelector('.texte-missile')!.innerHTML = proche
      ? `<b>⚠ MISSILE · impact dans ${Math.ceil((proche.impact - t) / 1000)} s</b><small>intercepteurs : ${e.intercepteurs}</small>`
      : `Aucun missile en approche<small>intercepteurs : ${e.intercepteurs}</small>`
    this.elIntercepter.disabled = !proche || e.intercepteurs === 0 || !!e.fin
    this.elCible.textContent = MODULES_ENNEMI.find((f) => f.nom === this.cible)!.titre
    const pret = pretATirer(e, t)
    this.elTirer.disabled = !pret
    const charge = e.energie.armes === 0 ? 0 : Math.min(1, 1 - (e.rechargeJusqua - t) / (RECHARGE_CANON / e.energie.armes))
    this.elTirer.style.setProperty('--charge', `${Math.round((pret ? 1 : charge) * 100)}%`)
    this.elTirer.textContent = e.energie.armes === 0 ? 'SANS ARMES' : pret ? 'TIRER' : 'RECHARGE'
    const en = htmlEnergie(e.energie)
    if (en !== this.derniereEnergie) this.elEnergie.innerHTML = this.derniereEnergie = en

    // La fin du combat.
    this.elFin.hidden = !e.fin
    if (e.fin && !this.finRacontee) {
      this.finRacontee = true
      const [titre, texteFin] = e.fin === 'victoire' ? ['VICTOIRE !', 'Le chasseur est hors de combat.']
        : e.fin === 'fuite' ? ['FUITE RÉUSSIE', 'La capsule a semé le chasseur.']
          : ['RETRAITE', 'Coque à zéro : la capsule se replie (pas de game over).']
      const suite = this.options.surFin ? this.options.surFin(e.fin) : 'Simulateur : rien n\'arrive à ta capsule.'
      this.elFin.innerHTML = `<div class="carte-fin" data-fin="${e.fin}"><b>${titre}</b><p>${texteFin}</p><p class="petit">${suite}</p>`
        + `<div class="boutons-fin">${this.options.surFin ? '' : '<button type="button" data-rejouer>REJOUER</button>'}<button type="button" class="principal" data-fermer>FERMER</button></div></div>`
    }
    if (!e.fin) this.elFin.innerHTML = ''
    this.element.querySelector('[data-fuir]')!.textContent = e.fin ? 'FERMER' : 'FUIR'
  }
}
