export function formatNumber(
  val: number | null | undefined,
  decimals: number = 3,
  fallback: string = "—",
): string {
  if (val === null || val === undefined || isNaN(val)) {
    return fallback;
  }
  return Number(val).toFixed(decimals);
}

export function formatEnergy(gev: number | null | undefined): string {
  if (gev === null || gev === undefined || isNaN(gev)) return "—";
  if (gev >= 1000) {
    return `${(gev / 1000).toFixed(3)} TeV`;
  }
  if (gev < 0.001 && gev > 0) {
    return `${(gev * 1000).toFixed(2)} MeV`;
  }
  return `${gev.toFixed(3)} GeV`;
}

export function formatMomentum(gev_c: number | null | undefined): string {
  if (gev_c === null || gev_c === undefined || isNaN(gev_c)) return "—";
  if (gev_c >= 1000) {
    return `${(gev_c / 1000).toFixed(3)} TeV/c`;
  }
  if (gev_c < 0.001 && gev_c > 0) {
    return `${(gev_c * 1000).toFixed(2)} MeV/c`;
  }
  return `${gev_c.toFixed(3)} GeV/c`;
}

export function formatDistance(mm: number | null | undefined): string {
  if (mm === null || mm === undefined || isNaN(mm)) return "—";
  if (Math.abs(mm) >= 1000) {
    return `${(mm / 1000).toFixed(3)} m`;
  }
  if (Math.abs(mm) < 0.1 && mm !== 0) {
    return `${(mm * 1000).toFixed(1)} µm`;
  }
  return `${mm.toFixed(3)} mm`;
}

export function formatTime(ns: number | null | undefined): string {
  if (ns === null || ns === undefined || isNaN(ns)) return "—";
  if (ns < 0.001 && ns > 0) {
    return `${(ns * 1000).toFixed(2)} ps`;
  }
  return `${ns.toFixed(3)} ns`;
}

export function formatAngle(rad: number | null | undefined): string {
  if (rad === null || rad === undefined || isNaN(rad)) return "—";
  const deg = (rad * 180) / Math.PI;
  return `${rad.toFixed(3)} rad (${deg.toFixed(1)}°)`;
}
