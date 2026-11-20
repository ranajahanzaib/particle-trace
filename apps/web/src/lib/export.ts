import { CaloCellRecord, ParticleRecord, TrackerHitRecord } from "@/types";

export function downloadJson(data: any, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  triggerDownload(blob, filename);
}

export function downloadCsv(
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][],
  filename: string,
): void {
  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row
        .map((cell) => {
          if (cell === null || cell === undefined) return "";
          const str = String(cell);
          if (str.includes(",") || str.includes('"') || str.includes("\n")) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(","),
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
  triggerDownload(blob, filename);
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportParticleDetails(
  particle: ParticleRecord,
  eventId: number,
): void {
  downloadJson(
    {
      exportType: "ParticleTrace_ParticleDetails",
      eventId,
      particle,
      exportedAt: new Date().toISOString(),
    },
    `particle_${eventId}_${particle.particle_id}.json`,
  );
}

export function exportTrackerHitsCsv(
  hits: TrackerHitRecord[],
  particleId: string,
  eventId: number,
): void {
  const headers = [
    "hit_index",
    "x_mm",
    "y_mm",
    "z_mm",
    "true_x_mm",
    "true_y_mm",
    "true_z_mm",
    "time_ns",
    "particle_id",
    "detector",
    "volume_id",
    "layer_id",
    "surface_id",
    "residual_dx_mm",
    "residual_dy_mm",
    "residual_dz_mm",
    "residual_dr_mm",
  ];

  const rows = hits.map((h) => [
    h.hit_index,
    h.x,
    h.y,
    h.z,
    h.true_x,
    h.true_y,
    h.true_z,
    h.time,
    h.particle_id,
    h.detector,
    h.volume_id,
    h.layer_id,
    h.surface_id,
    h.dx,
    h.dy,
    h.dz,
    h.dr,
  ]);

  downloadCsv(headers, rows, `tracker_hits_${eventId}_p${particleId}.csv`);
}

export function exportCaloContributionsCsv(
  cells: { cell: CaloCellRecord; contribEnergy: number; contribTime: number }[],
  particleId: string,
  eventId: number,
): void {
  const headers = [
    "cell_index",
    "detector",
    "x_mm",
    "y_mm",
    "z_mm",
    "cell_total_energy_gev",
    "particle_contrib_energy_gev",
    "particle_contrib_time_ns",
  ];

  const rows = cells.map(({ cell, contribEnergy, contribTime }) => [
    cell.cell_index,
    cell.detector,
    cell.x,
    cell.y,
    cell.z,
    cell.total_energy,
    contribEnergy,
    contribTime,
  ]);

  downloadCsv(
    headers,
    rows,
    `calo_contributions_${eventId}_p${particleId}.csv`,
  );
}
