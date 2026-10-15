<script lang="ts">
  // XX. Poste radio R-12 : commandes, réception, table des stations (données de la radio).
  import { STATIONS_MORSE } from '../../../donnees/modules'
  import { RADIO, STATIONS_RADIO } from '../../../donnees/radio'
  import Page from '../Page.svelte'

  let { numero }: { numero: number } = $props()
  const virgule = (n: number) => n.toFixed(2).replace('.', ',')
  const morse = Object.values(STATIONS_MORSE).sort((a, b) => a - b)
</script>

<Page {numero} chapitre="XX." titre="POSTE RADIO R-12">
  <p>
    Le poste s’ouvre depuis le cockpit (réglette POSTE RADIO) ou l’onglet CHASSE. Le bouton <b>GROS</b> fait
    2,00 par tour, le bouton <b>FIN</b> 0,10 par tour ; − et + : un centième. L’aiguille court sur le cadran de
    {RADIO.min} à {RADIO.max}.
  </p>
  <h3>Réception</h3>
  <p>
    Loin de toute station : du souffle. À moins de {virgule(RADIO.approche)} d’une station, son signal perce, brouillé ; à
    {virgule(RADIO.tolerance)} près, il est net (5 barres de SIGNAL) et le message se lit sur la bande. Le cadran ne porte
    aucun nom : se fier à la table.
  </p>
  <table>
    <thead><tr><th>Fréquence</th><th>Station</th><th>À l’écran</th></tr></thead>
    <tbody>
      <tr><td>{virgule(STATIONS_RADIO.radioTerre)}</td><td>Radio-Terre (Office)</td><td>onde chantante</td></tr>
      <tr><td>{virgule(STATIONS_RADIO.observatoire)}</td><td>Observatoire (Terre)</td><td>bips réguliers</td></tr>
      <tr><td>{virgule(STATIONS_RADIO.transmissions)}</td><td>Transmissions interceptées</td><td>paroles hachées</td></tr>
      <tr><td>{virgule(STATIONS_RADIO.detresse)}</td><td>Canal de détresse (Office)</td><td>porteuse faible</td></tr>
      <tr><td>{virgule(STATIONS_RADIO.monolithe)}</td><td>Origine inconnue</td><td>impulsions groupées</td></tr>
      <tr><td>{morse.map(virgule).join(' · ')}</td><td>Stations morse (XII)</td><td>points et traits</td></tr>
      <tr><td>selon le mois (page suivante)</td><td>Visiteur</td><td>rien : il se tait</td></tr>
    </tbody>
  </table>
</Page>
