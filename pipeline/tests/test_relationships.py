"""Tests for relationship indexing and track-to-hit semantics."""

from particle_trace.relationships import (
    build_event_indexes,
    validate_track_hit_semantics,
)
from particle_trace.schema import (
    CaloCellRecord,
    ParticleRecord,
    TrackerHitRecord,
    TrackRecord,
)


def test_build_event_indexes():
    particles = [
        ParticleRecord(
            particle_id="100",
            pdg_id=13,
            name="mu-",
            full_name="muon",
            particle_class="lepton",
            mass=0.105,
            energy=10.0,
            charge=-1.0,
            px=3.0,
            py=4.0,
            pz=5.0,
            vx=0.0,
            vy=0.0,
            vz=0.0,
            time=0.0,
            p=7.07,
            pt=5.0,
            phi=0.92,
            eta=0.88,
            parent_id="-1",
        ),
        ParticleRecord(
            particle_id="101",
            pdg_id=22,
            name="gamma",
            full_name="photon",
            particle_class="gauge_boson",
            mass=0.0,
            energy=5.0,
            charge=0.0,
            px=1.0,
            py=2.0,
            pz=3.0,
            vx=0.0,
            vy=0.0,
            vz=0.0,
            time=0.0,
            p=3.74,
            pt=2.23,
            phi=1.1,
            eta=1.1,
            parent_id="100",
        ),
    ]

    tracker_hits = [
        TrackerHitRecord(
            hit_index=0,
            x=10.0,
            y=10.0,
            z=10.0,
            time=0.1,
            particle_id="100",
            volume_id=8,
            layer_id=0,
            surface_id=1,
            detector="Pixel",
        ),
        TrackerHitRecord(
            hit_index=1,
            x=20.0,
            y=20.0,
            z=20.0,
            time=0.2,
            particle_id="100",
            volume_id=8,
            layer_id=1,
            surface_id=2,
            detector="Pixel",
        ),
    ]

    calo_cells = [
        CaloCellRecord(
            cell_index=0,
            detector="ECal",
            total_energy=4.5,
            x=100.0,
            y=100.0,
            z=100.0,
            contrib_particle_ids=["100", "101"],
            contrib_energies=[2.5, 2.0],
            contrib_times=[1.2, 1.3],
        ),
        CaloCellRecord(
            cell_index=1,
            detector="ECal",
            total_energy=3.0,
            x=110.0,
            y=110.0,
            z=110.0,
            contrib_particle_ids=["101"],
            contrib_energies=[3.0],
            contrib_times=[1.4],
        ),
    ]

    tracks = [
        TrackRecord(
            track_id=0,
            majority_particle_id="100",
            d0=0.01,
            z0=0.02,
            phi=0.92,
            theta=0.78,
            qop=0.14,
            hit_ids=[0, 1],
        )
    ]

    indexes = build_event_indexes(particles, tracker_hits, calo_cells, tracks)

    assert indexes.trackerHitIndicesByParticleId["100"] == [0, 1]
    assert indexes.caloCellIndicesByParticleId["100"] == [0]
    assert indexes.caloCellIndicesByParticleId["101"] == [0, 1]
    assert indexes.trackIndicesByMajorityParticleId["100"] == [0]
    assert indexes.childrenIdsByParentId["100"] == ["101"]


def test_validate_track_hit_semantics():
    tracker_hits = [
        TrackerHitRecord(
            hit_index=i,
            x=float(i),
            y=float(i),
            z=float(i),
            time=0.1,
            particle_id="1",
            volume_id=8,
            layer_id=0,
            surface_id=1,
            detector="Pixel",
        )
        for i in range(10)
    ]

    tracks_valid = [
        TrackRecord(
            track_id=0,
            majority_particle_id="1",
            d0=0.0,
            z0=0.0,
            phi=0.0,
            theta=1.0,
            qop=0.1,
            hit_ids=[0, 1, 2, 3],
        )
    ]
    meta_valid, _ = validate_track_hit_semantics(tracker_hits, tracks_valid)
    assert meta_valid.trackHitMappingStatus == "verified_row_indices"

    # Out of bounds hit_ids (representing Acts surface / hardware channels)
    tracks_unverified = [
        TrackRecord(
            track_id=0,
            majority_particle_id="1",
            d0=0.0,
            z0=0.0,
            phi=0.0,
            theta=1.0,
            qop=0.1,
            hit_ids=[105234, 105235],
        )
    ]
    meta_unverified, diags = validate_track_hit_semantics(tracker_hits, tracks_unverified)
    assert meta_unverified.trackHitMappingStatus == "unverified"
    assert any("unverified" in d.message.lower() for d in diags)
