// Le fil des transmissions : télégrammes reçus et envoyés, bulletins de la flotte, une ligne chacun, du plus ancien
// au plus récent. Partagé par l'écran COMMUNICATION et son aperçu sur le cockpit.
import { TELEGRAMMES } from '../../donnees/reglages'
import type { EtatPartie } from '../../moteur/etat'
import { estLu, telegrammesDe, type Portee } from '../../moteur/telegrammes'
import { duree, nomAstre } from '../format'
import { annonces, telegrammesRecus } from '../reseau'

export type LigneFil = {
  id: string
  quand: number
  sorte: 'recu' | 'envoye' | 'bulletin'
  de: string
  couleur?: string
  meta: string
  texte: string
  nouveau?: boolean
  majeur?: boolean
}

const lieu = (s: string | null) => (s ? (s === 'Terre' ? 'TERRE' : nomAstre(s).replace(/^la /, '').toUpperCase()) : 'ESPACE')
export const aQui = (p: Portee) => (p.type === 'tout' ? 'TOUS' : p.type === 'systeme' ? `SYSTÈME ${lieu(p.systeme)}` : p.nom.toUpperCase())

/**
 * Le fil, le plus récent en bas. `nouveaux` : identifiants des télégrammes à marquer « nouveau » (par défaut, ceux
 * qui ne sont pas encore lus).
 */
export function filDesTransmissions(etat: EtatPartie, t: number, nouveaux?: Set<string>): LigneFil[] {
  const recus = telegrammesRecus(etat, t)
  const envoyes = telegrammesDe(etat).envoyes.filter((m) => m.envoye > t - TELEGRAMMES.gardesJours * 86_400_000)
  const estNouveau = (m: (typeof recus)[number]) => (nouveaux ? nouveaux.has(m.id) : !estLu(etat, m))
  return [
    ...recus.map((m) => ({
      id: `r-${m.id}`, quand: m.arrivee, sorte: 'recu' as const, de: m.de.toUpperCase(), couleur: m.couleur,
      meta: `${m.serie === 'ONVI' ? 'TERRE' : lieu(m.systeme)}${m.arrivee - m.envoye >= 60_000 ? ` · ${duree((m.arrivee - m.envoye) / 1000).toUpperCase()}` : ''}`,
      texte: m.texte, nouveau: estNouveau(m),
    })),
    ...envoyes.map((m) => ({ id: `e-${m.id}`, quand: m.envoye, sorte: 'envoye' as const, de: `→ ${aQui(m.portee)}`, meta: '', texte: m.texte })),
    ...annonces(t).map((a, i) => ({ id: `b-${i}-${a.t}`, quand: a.t, sorte: 'bulletin' as const, de: 'BULLETIN', couleur: a.couleur, meta: '', texte: a.texte.toUpperCase(), majeur: a.majeure })),
  ].sort((a, b) => a.quand - b.quand)
}
