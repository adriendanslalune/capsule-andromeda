// Le volet Messages (dans « Plus », et le bouton des Messages sur la carte ; décision d'Adrien du 18/10/2026 : « tout le fun est
// là », accessible et fun). Trois canaux : GÉNÉRAL (tout le système), MAISON (ses membres), PRIVÉS (une conversation
// par interlocuteur, en gras celles qui ont du nouveau). Le fil se lit comme une console de communication spatiale (une
// ligne par message, demande d'Adrien du 20/10/2026) ; toucher un pseudo propose ÉCRIRE (en privé) et VOIR (sa capsule
// sur la carte). Chaque message dit d'où il vient et combien de temps la lumière a mis à l'apporter ; les siens disent s'ils sont encore en route ; une réponse partie mais pas encore
// arrivée s'annonce. Des phrases rapides s'envoient d'un toucher. Le volet ne décide rien : il montre ce que dit le
// moteur (moteur/messages.ts).

import { BOTS, BOTS_BAVARDS, PHRASES_RAPIDES } from '../donnees/messages'
import { titreMaison } from '../donnees/maisons'
import type { Jeu } from '../moteur/jeu'
import {
  conversations, enRoute, envoyer, etatEnvoi, fil, lieuDuBot, marquerLu, nonLus, texteDelaiCourt, type Canal, type MessageAffiche,
} from '../moteur/messages'
import { delaiLumiere } from '../moteur/marche'
import { statut } from '../moteur/monolithes'
import { picto } from './symboles'

/** Le statut d'un capitaine (paliers des monolithes), en petit à côté de son pseudo. */
const badge = (s: string | null) => (s ? ` <em class="statut">${s}</em>` : '')

const TEINTES: Record<string, string> = { nettoyeurs: '#bfe0c8', ingenieurs: '#f5d38a', mercenaires: '#f3c2b0' }
/** Les mêmes couleurs, assez foncées pour un pseudo écrit sur le papier clair de la console. */
const ENCRES: Record<string, string> = { nettoyeurs: '#3f7a4c', ingenieurs: '#9a6a12', mercenaires: '#b4442f' }
const echapper = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

/** « il y a 3 min », « à l'instant ». */
function ilYa(ms: number): string {
  const m = Math.floor(ms / 60_000)
  if (m < 1) return 'à l\'instant'
  if (m < 60) return `il y a ${m} min`
  return `il y a ${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')}`
}

export class VoletMessages {
  /** Le canal affiché ; 'prives' : la liste des conversations privées. */
  canal: Canal | 'prives' = 'general'
  private dernier = ''
  private elOnglets: HTMLElement
  private elFil: HTMLElement
  private elSaisie: HTMLElement
  private champ: HTMLInputElement
  /** Le message dont on a touché le pseudo (son menu ÉCRIRE / VOIR est ouvert), ou null. */
  private menu: string | null = null

  constructor(private element: HTMLElement, private jeu: () => Jeu, private apresEnvoi: () => void, private voir: (pseudo: string) => void) {
    element.innerHTML = `
      <button type="button" class="retour" data-page="plus">‹ Plus</button>
      <div class="canaux"></div>
      <div class="fil"></div>
      <div class="saisie">
        <div class="rapides">${PHRASES_RAPIDES.map((p) => `<button type="button" data-rapide="${echapper(p)}">${echapper(p)}</button>`).join('')}</div>
        <form class="ecrire"><input type="text" maxlength="200" placeholder="Écrire…" autocomplete="off" enterkeyhint="send"/><button type="submit">ENVOYER</button></form>
      </div>`
    this.elOnglets = element.querySelector('.canaux')!
    this.elFil = element.querySelector('.fil')!
    this.elSaisie = element.querySelector('.saisie')!
    this.champ = element.querySelector('.ecrire input')!
    element.querySelector('form')!.addEventListener('submit', (e) => {
      e.preventDefault()
      this.envoyer(this.champ.value)
    })
    element.addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>('[data-canal], [data-rapide], [data-ecrire-a], [data-menu], [data-voir]')
      if (!b) return
      if (b.dataset.menu) { this.menu = this.menu === b.dataset.menu ? null : b.dataset.menu; this.dernier = ''; this.afficher(Date.now()); return }
      this.menu = null
      if (b.dataset.voir) this.voir(b.dataset.voir)
      else if (b.dataset.rapide) this.envoyer(b.dataset.rapide)
      else if (b.dataset.ecrireA) this.ouvrirCanal(`prive:${b.dataset.ecrireA}`)
      else if (b.dataset.canal) this.ouvrirCanal(b.dataset.canal)
    })
  }

  /** Affiche un canal (et le marque comme lu). */
  ouvrirCanal(c: Canal | 'prives'): void {
    this.canal = c
    this.dernier = ''
    this.afficher(Date.now(), true)
  }

  private envoyer(texte: string): void {
    const c = this.canal
    if (c === 'prives') return
    if (envoyer(this.jeu(), c, texte, Date.now())) {
      this.champ.value = ''
      this.apresEnvoi()
      this.afficher(Date.now(), true)
    }
  }

  /** Redessine le volet ; enBas : faire défiler jusqu'au dernier message. */
  afficher(t: number, enBas = false): void {
    const jeu = this.jeu()
    const n = nonLus(jeu, t)
    const onglet = (c: string, titre: string, k: number) => {
      const actif = this.canal === c || (c === 'prives' && this.canal.startsWith('prive:'))
      return `<button type="button" data-canal="${c}"${actif ? ' class="actif"' : ''}>${titre}${k ? `<span class="pastille">${k}</span>` : ''}</button>`
    }
    const onglets = onglet('general', 'GÉNÉRAL', n.general) + onglet('maison', 'MAISON', n.maison) + onglet('prives', 'PRIVÉS', n.prives)

    let html = ''
    const c = this.canal
    if (c === 'prives') {
      // La liste des conversations privées, et à qui écrire.
      const conv = conversations(jeu, t)
      html += conv.length ? conv.map(({ canal, bot, dernier, nonLus: k }) => `<button type="button" class="conversation${k ? ' non-lue' : ''}" data-canal="${canal}">`
        + `<span class="avatar" style="background:${TEINTES[bot.maison]}">${bot.pseudo[0]}</span>`
        + `<span class="texte"><b>${bot.pseudo}${badge(statut(bot.monolithes))}</b><small>${dernier.deMoi ? 'toi : ' : ''}${echapper(dernier.texte)}</small></span>`
        + `<span class="quand">${ilYa(t - dernier.recu)}${k ? `<span class="pastille">${k}</span>` : ''}</span></button>`).join('')
        : '<p class="vide">Pas encore de conversation privée. Touche le nom d\'un capitaine dans le canal général, ou choisis ci-dessous.</p>'
      html += '<h3>Écrire à…</h3><p class="vide">Les capitaines du jeu (PNJ) en attendant les vrais joueurs.</p><div class="annuaire">' + BOTS_BAVARDS.map((b) => `<button type="button" data-ecrire-a="${b.pseudo}">`
        + `<span class="avatar" style="background:${TEINTES[b.maison]}">${b.pseudo[0]}</span><span class="texte"><b>${b.pseudo}</b><em class="pnj">PNJ</em>${badge(statut(b.monolithes))}`
        + `<small>${lieuDuBot(b.pseudo, t)} · ${texteDelaiCourt(delaiLumiere(b.pseudo, t))}</small></span></button>`).join('') + '</div>'
    } else if (c === 'maison' && !jeu.maison) {
      html += '<p class="vide">Le canal de Maison est réservé à ses membres. Rejoins une Maison (depuis ton Profil, quand ton affinité le permet) pour parler avec les tiens.</p>'
    } else {
      if (c.startsWith('prive:')) {
        const bot = BOTS.find((b) => `prive:${b.pseudo}` === c)!
        html += `<div class="tete-prive"><button type="button" data-canal="prives">‹</button><span class="avatar" style="background:${TEINTES[bot.maison]}">${bot.pseudo[0]}</span>`
          + `<span><b>${bot.pseudo}${badge(statut(bot.monolithes))}</b><small>${titreMaison(bot.maison)} · ${lieuDuBot(bot.pseudo, t)} · la lumière met ${texteDelaiCourt(delaiLumiere(bot.pseudo, t))}</small></span></div>`
      } else if (c === 'maison') html += `<p class="info-canal">Canal des ${titreMaison(jeu.maison!).toLowerCase()}</p>`
      const messages = fil(jeu, c, t)
      if (!messages.length) html += '<p class="vide">Aucun message pour l\'instant. Lance la conversation !</p>'
      html += '<div class="console">' + messages.map((m) => this.ligne(m, t)).join('')
        + enRoute(jeu, c, t).map((m) => `<div class="ligne en-route"><span class="heure">··:··</span><span class="corps-ligne"><b>${m.auteur}</b> a répondu depuis ${m.lieu} · arrive dans ${texteDelaiCourt(m.recu - t)}</span></div>`).join('')
        + '</div>'
      marquerLu(jeu, c, t)
    }
    this.elSaisie.hidden = c === 'prives' || (c === 'maison' && !jeu.maison)
    if (onglets !== this.elOnglets.dataset.html) { this.elOnglets.innerHTML = onglets; this.elOnglets.dataset.html = onglets }
    if (html === this.dernier) return
    // Rester en bas si on y était (les nouveaux messages arrivent en bas).
    const page = this.element
    const etaitEnBas = page.scrollHeight - page.scrollTop - page.clientHeight < 60
    this.elFil.innerHTML = this.dernier = html
    if (enBas || etaitEnBas) page.scrollTop = page.scrollHeight
  }

  /** Une ligne de la console : l'heure d'arrivée, le pseudo (aux couleurs de sa Maison), le texte, d'où il vient. */
  private ligne(m: MessageAffiche, t: number): string {
    const heure = new Date(m.recu).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    if (m.deMoi) {
      return `<div class="ligne moi"><span class="heure">${heure}</span><span class="corps-ligne"><b class="pseudo">${echapper(m.auteur)}</b>${echapper(m.texte)}`
        + `<small>${etatEnvoi(m, t)}</small></span></div>`
    }
    const prive = this.canal.startsWith('prive:')
    const ouvert = this.menu === m.id
    const pseudo = `<button type="button" class="pseudo" data-menu="${m.id}" style="color:${m.maison ? ENCRES[m.maison] : '#6a4f9a'}">${m.auteur}</button><em class="pnj" title="Personnage du jeu (bot)">PNJ</em>`
    const menu = ouvert ? `<span class="menu-pseudo">${prive ? '' : `<button type="button" data-ecrire-a="${m.auteur}">ÉCRIRE</button>`}<button type="button" data-voir="${m.auteur}" aria-label="Voir sur la carte">${picto('voir')}VOIR</button></span>` : ''
    return `<div class="ligne"><span class="heure">${heure}</span><span class="corps-ligne">${pseudo}${badge(m.statut)} ${echapper(m.texte)}`
      + `<small>${m.lieu.startsWith('en route') ? m.lieu : `de ${m.lieu}`} · la lumière a mis ${texteDelaiCourt(m.recu - m.envoye)}</small>${menu}</span></div>`
  }
}
