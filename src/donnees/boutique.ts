// La boutique (décision d'Adrien du 20/10/2026) : dans Plus › Boutique, en euros, bien séparée des crédits du jeu.
// Rien qui fasse gagner : des cosmétiques, le Manuel, et un pack de soutien. Ouverte avec le serveur (étape 10) : un
// achat doit être vérifié par le serveur, sinon il suffirait de trafiquer sa sauvegarde. En attendant, une vitrine.
// Articles et textes PROVISOIRES ; les prix restent à fixer avec Adrien.

export interface ArticleBoutique {
  id: string
  nom: string
  /** Rayon de la vitrine. */
  rayon: 'capsule' | 'pseudo' | 'manuel' | 'soutien'
  description: string
}

export const RAYONS_BOUTIQUE: readonly { rayon: ArticleBoutique['rayon']; titre: string }[] = [
  { rayon: 'capsule', titre: 'La capsule' },
  { rayon: 'pseudo', titre: 'Ton nom' },
  { rayon: 'manuel', titre: 'Le Manuel' },
  { rayon: 'soutien', titre: 'Soutenir le jeu' },
]

export const ARTICLES_BOUTIQUE: readonly ArticleBoutique[] = [
  { id: 'livrees', nom: 'Livrées des Chantiers Navals de Vénus', rayon: 'capsule', description: 'Couleurs et motifs Moebius pour ta capsule, sur la carte et dans les combats.' },
  { id: 'trainees', nom: 'Traînées du moteur', rayon: 'capsule', description: 'La traînée de ta capsule en vol, dans d\'autres couleurs.' },
  { id: 'faisceaux', nom: 'Faisceaux du radar', rayon: 'capsule', description: 'Le balayage de ton radar, dans d\'autres teintes.' },
  { id: 'blasons', nom: 'Blasons', rayon: 'pseudo', description: 'Un blason à côté de ton pseudo, dans les Messages et sur la carte.' },
  { id: 'cadres', nom: 'Cadres de portrait', rayon: 'pseudo', description: 'Un cadre pour ton portrait dans le Profil.' },
  { id: 'manuel-pdf', nom: 'Le Manuel en PDF', rayon: 'manuel', description: 'Le manuel complet de la capsule, à imprimer ou à garder sur une tablette à côté du téléphone.' },
  { id: 'manuel-papier', nom: 'Le Manuel imprimé', rayon: 'manuel', description: 'Le même, relié, sur vieux papier crème. Livré chez toi.' },
  { id: 'mecene', nom: 'Mécène de la résistance', rayon: 'soutien', description: 'Pour soutenir le jeu : un statut affiché à côté de ton pseudo, et ton nom au générique.' },
]
