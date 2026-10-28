/** A flat mirror in the x-y plane (normal points toward +z).
 * Light travels in the x-z plane; both angles are measured FROM the normal.
 * Coordinates are unitless because the picture is illustrative, not to scale.
 */
export function mirrorLightPath(degrees, length = 1) {
  if (!Number.isFinite(degrees) || degrees < 0 || degrees > 80) {
    throw new Error('Invalid incidence angle');
  }
  if (!Number.isFinite(length) || length <= 0) throw new Error('Invalid ray length');
  const angle = degrees * Math.PI / 180;
  const sine = Math.sin(angle), cosine = Math.cos(angle);
  const source = { x: -length * sine, z: length * cosine };
  const hit = { x: 0, z: 0 };
  const target = { x: length * sine, z: length * cosine };
  return {
    source, hit, target, incidenceDegrees: degrees, reflectionDegrees: degrees,
    incoming: { x: sine, z: -cosine },
    outgoing: { x: sine, z: cosine }
  };
}
