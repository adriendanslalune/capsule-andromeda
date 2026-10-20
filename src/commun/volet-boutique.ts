// La vitrine de la boutique (Plus › Boutique ; décision d'Adrien du 20/10/2026) : les articles par rayon, grisés tant
// que le serveur n'est pas là (un achat doit être vérifié par le serveur). Prix en euros, jamais en crédits du jeu.

import { ARTICLES_BOUTIQUE, RAYONS_BOUTIQUE } from '../donnees/boutique'

export function htmlBoutique(): string {
  let html = '<button type="button" class="retour" data-page="plus">‹ Plus</button>'
  html += '<p class="intro-boutique">Ici, on paie en <b>euros</b>, pas en crédits. Rien ne fait gagner : des couleurs pour ta capsule et ton nom, le Manuel, et de quoi soutenir le jeu.</p>'
  for (const r of RAYONS_BOUTIQUE) {
    html += `<h3>${r.titre}</h3><div class="rayon-boutique">` + ARTICLES_BOUTIQUE.filter((a) => a.rayon === r.rayon).map((a) =>
      `<div class="article"><div><b>${a.nom}</b><small>${a.description}</small></div><button type="button" disabled>BIENTÔT</button></div>`).join('') + '</div>'
  }
  return html + '<p class="note">La boutique ouvrira avec les comptes des joueurs : un achat doit être enregistré par le serveur du jeu.</p>'
}
