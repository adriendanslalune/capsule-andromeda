// Rotation de la Terre : angle de rotation terrestre (IAU 2000), très proche du temps sidéral de Greenwich.

/** Angle (rad, 0 à 2π) entre l'équinoxe de printemps et le méridien de Greenwich, à l'instant t (ms UTC). */
export function angleRotationTerre(t: number): number {
  const jours = t / 86_400_000 + 2440587.5 - 2451545.0
  const tours = 0.779057273264 + 1.00273781191135448 * jours
  return (tours - Math.floor(tours)) * 2 * Math.PI
}
