"""Data integrity and scientific validation routines.

Performs checks across parallel arrays, nested lists, identifier uniqueness,
physical ranges, and referential integrity to produce a machine-readable
data quality report.
"""

import math
from typing import Any, Dict, List, Set, Tuple
from particle_trace.schema import (
    CaloCellRecord,
    DiagnosticItem,
    ParticleRecord,
    TrackerHitRecord,
    TrackRecord,
)


class DataQualityReport:
    """Aggregates validation results and diagnostics for an event."""

    def __init__(self, event_id: int):
        self.event_id = event_id
        self.diagnostics: List[DiagnosticItem] = []
        self.is_valid: bool = True

    def add_diagnostic(self, severity: str, code: str, message: str) -> None:
        """Record a diagnostic item."""
        if severity == "error":
            self.is_valid = False
        self.diagnostics.append(
            DiagnosticItem(severity=severity, code=code, message=message)
        )

    def to_dict(self) -> Dict[str, Any]:
        """Convert report to dictionary."""
        return {
            "eventId": self.event_id,
            "isValid": self.is_valid,
            "errorCount": sum(1 for d in self.diagnostics if d.severity == "error"),
            "warningCount": sum(1 for d in self.diagnostics if d.severity == "warning"),
            "infoCount": sum(1 for d in self.diagnostics if d.severity == "info"),
            "diagnostics": [d.model_dump() for d in self.diagnostics],
        }


def validate_event_data(
    event_id: int,
    particles: List[ParticleRecord],
    tracker_hits: List[TrackerHitRecord],
    calo_cells: List[CaloCellRecord],
    tracks: List[TrackRecord],
) -> DataQualityReport:
    """Execute complete scientific validation suite on normalized event collections."""
    report = DataQualityReport(event_id)

    # 1. Particle ID uniqueness
    seen_pids: Set[str] = set()
    duplicate_pids: Set[str] = set()
    for p in particles:
        if p.particle_id in seen_pids:
            duplicate_pids.add(p.particle_id)
        seen_pids.add(p.particle_id)

    if duplicate_pids:
        report.add_diagnostic(
            severity="error",
            code="DUPLICATE_PARTICLE_IDS",
            message=f"Found duplicate particle IDs in event: {list(duplicate_pids)[:5]}",
        )

    # 2. Particle kinematics physical validity
    for p in particles:
        if math.isnan(p.energy) or math.isinf(p.energy) or p.energy < 0:
            report.add_diagnostic(
                severity="error",
                code="INVALID_PARTICLE_ENERGY",
                message=f"Particle {p.particle_id} has invalid energy: {p.energy}",
            )
        if math.isnan(p.p) or math.isinf(p.p) or p.p < 0:
            report.add_diagnostic(
                severity="error",
                code="INVALID_PARTICLE_MOMENTUM",
                message=f"Particle {p.particle_id} has invalid momentum: {p.p}",
            )

    # 3. Parent references check
    for p in particles:
        if p.parent_id not in ("-1", "", "None", "null"):
            if p.parent_id not in seen_pids:
                report.add_diagnostic(
                    severity="warning",
                    code="ORPHAN_PARENT_REFERENCE",
                    message=f"Particle {p.particle_id} references missing parent {p.parent_id}",
                )

    # 4. Calorimeter nested contribution parallel-list alignment
    for cell in calo_cells:
        len_ids = len(cell.contrib_particle_ids)
        len_energies = len(cell.contrib_energies)
        len_times = len(cell.contrib_times)

        if not (len_ids == len_energies == len_times):
            report.add_diagnostic(
                severity="error",
                code="CALO_CONTRIB_ALIGNMENT_MISMATCH",
                message=(
                    f"Calorimeter cell {cell.cell_index} has misaligned contribution lists: "
                    f"ids={len_ids}, energies={len_energies}, times={len_times}"
                ),
            )

        # Check for invalid values in contributions
        for e in cell.contrib_energies:
            if math.isnan(e) or math.isinf(e) or e < 0:
                report.add_diagnostic(
                    severity="error",
                    code="INVALID_CALO_CONTRIB_ENERGY",
                    message=f"Cell {cell.cell_index} contains invalid contribution energy {e}",
                )

    # 5. Tracker hit coordinate validity
    for hit in tracker_hits:
        for coord_name, val in [("x", hit.x), ("y", hit.y), ("z", hit.z)]:
            if math.isnan(val) or math.isinf(val):
                report.add_diagnostic(
                    severity="error",
                    code="INVALID_TRACKER_COORDINATE",
                    message=f"Hit {hit.hit_index} has invalid {coord_name}: {val}",
                )

    # 6. Reconstructed track parameters
    for t in tracks:
        if math.isnan(t.qop) or math.isinf(t.qop):
            report.add_diagnostic(
                severity="error",
                code="INVALID_TRACK_QOP",
                message=f"Track {t.track_id} has invalid qop: {t.qop}",
            )
        if t.majority_particle_id not in seen_pids:
            report.add_diagnostic(
                severity="warning",
                code="TRACK_MAJORITY_PARTICLE_NOT_IN_PARTICLES",
                message=(
                    f"Track {t.track_id} majority particle {t.majority_particle_id} "
                    f"not found in truth particle table."
                ),
            )

    return report
