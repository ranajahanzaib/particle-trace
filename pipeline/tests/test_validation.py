"""Tests for scientific data validation and data quality reports."""

from particle_trace.schema import (
    CaloCellRecord,
    ParticleRecord,
    TrackerHitRecord,
    TrackRecord,
)
from particle_trace.validation import validate_event_data


def test_validation_detects_duplicates_and_alignment():
    # Duplicate particle IDs
    p1 = ParticleRecord(
        particle_id="1001",
        pdg_id=13,
        name="mu-",
        full_name="muon",
        particle_class="lepton",
        mass=0.105,
        energy=10.0,
        charge=-1.0,
        px=1.0,
        py=1.0,
        pz=1.0,
        vx=0.0,
        vy=0.0,
        vz=0.0,
        time=0.0,
        p=1.73,
        pt=1.41,
        phi=0.78,
        eta=0.65,
        parent_id="-1",
    )
    p2 = p1.model_copy()

    # Misaligned calo cell
    cell = CaloCellRecord(
        cell_index=0,
        detector="ECal",
        total_energy=5.0,
        x=10.0,
        y=10.0,
        z=10.0,
        contrib_particle_ids=["1001"],
        contrib_energies=[5.0, 2.0],  # 2 energies but 1 id!
        contrib_times=[1.0],
    )

    report = validate_event_data(
        event_id=42,
        particles=[p1, p2],
        tracker_hits=[],
        calo_cells=[cell],
        tracks=[],
    )

    assert not report.is_valid
    codes = {d.code for d in report.diagnostics}
    assert "DUPLICATE_PARTICLE_IDS" in codes
    assert "CALO_CONTRIB_ALIGNMENT_MISMATCH" in codes
