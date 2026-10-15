<script lang="ts">
  // Bouton à tourner au doigt (bakélite crantée, repère rouge) : l'angle parcouru autour de son centre fait varier
  // une valeur (`parTour` par tour complet). `changer` reçoit chaque écart ; `lacher` est appelé quand on relâche.
  let { parTour, taille = 84, label, changer, lacher }: {
    parTour: number
    taille?: number
    label: string
    changer: (ecart: number) => void
    lacher: () => void
  } = $props()

  let angle = $state(0)
  function tourner(e: PointerEvent) {
    e.stopPropagation()
    const el = e.currentTarget as HTMLElement
    el.setPointerCapture(e.pointerId)
    const r = el.getBoundingClientRect()
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2
    let precedent = Math.atan2(e.clientY - cy, e.clientX - cx)
    const bouger = (m: PointerEvent) => {
      const a = Math.atan2(m.clientY - cy, m.clientX - cx)
      let d = a - precedent
      if (d > Math.PI) d -= 2 * Math.PI
      if (d < -Math.PI) d += 2 * Math.PI
      precedent = a
      angle += (d * 180) / Math.PI
      changer((d / (2 * Math.PI)) * parTour)
    }
    const fin = () => {
      el.removeEventListener('pointermove', bouger)
      el.removeEventListener('pointerup', fin)
      el.removeEventListener('pointercancel', fin)
      lacher()
    }
    el.addEventListener('pointermove', bouger)
    el.addEventListener('pointerup', fin)
    el.addEventListener('pointercancel', fin)
  }
</script>

<div class="bouton-rotatif" role="slider" tabindex="0" aria-label={label} aria-valuenow={Math.round(angle)}
  onpointerdown={tourner} onclick={(e) => e.stopPropagation()} onkeydown={() => {}}
  style={`--angle: ${angle}deg; --taille: ${taille}px`}><span class="repere"></span></div>

<style>
  .bouton-rotatif {
    position: relative;
    flex: none;
    width: var(--taille);
    height: var(--taille);
    border: 3px solid var(--couleur-encre);
    border-radius: 50%;
    background: repeating-conic-gradient(var(--couleur-encre) 0 6deg, #2b3440 6deg 12deg);
    box-shadow: 3px 3px 0 var(--couleur-encre);
    transform: rotate(var(--angle));
    touch-action: none;
    cursor: grab;
  }
  .bouton-rotatif::before {
    content: '';
    position: absolute;
    inset: 14%;
    border-radius: 50%;
    background: var(--couleur-papier);
    border: 2px solid var(--couleur-encre);
  }
  .repere {
    position: absolute;
    left: 50%;
    top: 16%;
    width: 4px;
    height: 20%;
    margin-left: -2px;
    border-radius: 2px;
    background: var(--cerise);
  }
</style>
