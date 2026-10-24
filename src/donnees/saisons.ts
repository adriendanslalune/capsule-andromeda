// Le fond de la carte change chaque mois (calendrier validé par Adrien le 24/10/2026) : le kraft (et le bleu nuit du
// thème sombre) prend légèrement la teinte pastel du mois, qui suit les fêtes et les dates de l'espace. Une brève de
// Radio Résistance l'annonce les premiers jours.

export interface Saison { mois: string; ambiance: string; teinte: string; breve: string }

/** Les douze mois, de janvier à décembre. */
export const SAISONS: readonly Saison[] = [
  { mois: 'Janvier', ambiance: 'Nouvel An, l\'hiver', teinte: '#bcd9ec', breve: 'Janvier : bonne année, capitaines ! Le givre gagne les hublots, pensez à dégivrer les antennes' },
  { mois: 'Février', ambiance: 'Saint-Valentin', teinte: '#f2c4cf', breve: 'Février : la Saint-Valentin approche. Les messages d\'amour voyagent à la vitesse de la lumière, comme les autres' },
  { mois: 'Mars', ambiance: 'Le printemps', teinte: '#c9e6b4', breve: 'Mars : le printemps revient sur Terre. Sur Mars, il faudra attendre encore un peu' },
  { mois: 'Avril', ambiance: 'Pâques, Gagarine (12 avril 1961)', teinte: '#f5e49a', breve: 'Avril : le 12, on lève son verre à Youri Gagarine, le premier homme dans l\'espace (1961). Et on cache des œufs dans les épaves' },
  { mois: 'Mai', ambiance: 'Les lilas', teinte: '#d9c6ec', breve: 'Mai : les lilas fleurissent sur Terre. La serre de la station Tycho embaume, paraît-il' },
  { mois: 'Juin', ambiance: 'Le solstice', teinte: '#f7da86', breve: 'Juin : le solstice ! Le jour le plus long, sauf pour ceux qui vivent en orbite, qui en voient seize par jour' },
  { mois: 'Juillet', ambiance: 'Apollo 11 (20 juillet 1969)', teinte: '#c9d3df', breve: 'Juillet : le 20, il y a des années, deux hommes marchaient sur la Lune. Saluez la base de la Tranquillité en passant' },
  { mois: 'Août', ambiance: 'Les Perséides', teinte: '#a9b8dc', breve: 'Août : la pluie d\'étoiles filantes des Perséides. Vu de là-haut, ce sont des cailloux : gare au pare-brise' },
  { mois: 'Septembre', ambiance: 'Les vendanges, la rentrée', teinte: '#e6c58f', breve: 'Septembre : c\'est la rentrée. Les cadets de la Résistance reprennent les cours de pilotage, gare aux débutants' },
  { mois: 'Octobre', ambiance: 'Halloween', teinte: '#f4b27d', breve: 'Octobre : Halloween approche. Les épaves sont hantées, affirment les Nettoyeurs. Personne ne les croit' },
  { mois: 'Novembre', ambiance: 'La brume', teinte: '#cdc3d6', breve: 'Novembre : la brume tombe sur Terre. Là-haut, rien ne change : c\'est bien le seul avantage de l\'espace' },
  { mois: 'Décembre', ambiance: 'Noël', teinte: '#a9d4b0', breve: 'Décembre : les capitaines accrochent des guirlandes aux antennes. Joyeux Noël à tout le système solaire !' },
]
