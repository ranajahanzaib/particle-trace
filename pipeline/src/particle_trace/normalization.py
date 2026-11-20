"""Event normalization and bundle construction.

Transforms raw event collections into strictly typed, verified, and indexed
EventBundle objects.
"""

from typing import Any, Dict, List
from particle_trace.ancestry import AncestryGraph
from particle_trace.config import PipelineConfig
from particle_trace.physics import (
    calculate_momentum,
    calculate_pseudorapidity,
    calculate_phi,
    calculate_track_momentum,
    calculate_track_pseudorapidity,
    calculate_track_transverse_momentum,
    calculate_tracker_displacement,
    calculate_transverse_momentum,
    lookup_pdg,
)
from particle_trace.relationships import (
    build_event_indexes,
    validate_track_hit_semantics,
)
from particle_trace.schema import (
    CaloCellRecord,
    DiagnosticItem,
    EventBundle,
    EventCounts,
    EventSourceMetadata,
    ParticleRecord,
    TrackerHitRecord,
    TrackRecord,
)
from particle_trace.validation import validate_event_data


def normalize_event(raw_event: Dict[str, Any], config: PipelineConfig) -> EventBundle:
    """Normalize raw event dictionaries into an EventBundle."""
    event_id = int(raw_event.get("event_id", 0))
    is_synthetic = bool(raw_event.get("is_synthetic", False))

    # 1. Normalize particles
    normalized_particles: List[ParticleRecord] = []
    raw_particles = raw_event.get("particles", [])

    for p in raw_particles:
        pid_str = str(p["particle_id"])
        parent_id_str = str(p.get("parent_id", "-1"))
        pdg_id = int(p["pdg_id"])
        pdg_info = lookup_pdg(pdg_id)

        px = float(p.get("px", 0.0))
        py = float(p.get("py", 0.0))
        pz = float(p.get("pz", 0.0))

        tot_p = calculate_momentum(px, py, pz)
        pt = calculate_transverse_momentum(px, py)
        phi = calculate_phi(px, py)
        eta = calculate_pseudorapidity(pz, pt)

        normalized_particles.append(
            ParticleRecord(
                particle_id=pid_str,
                pdg_id=pdg_id,
                name=pdg_info["name"],
                full_name=pdg_info["full_name"],
                particle_class=pdg_info["class"],
                mass=float(p.get("mass", 0.0)),
                energy=float(p.get("energy", 0.0)),
                charge=float(p.get("charge", pdg_info["charge"])),
                px=px,
                py=py,
                pz=pz,
                vx=float(p.get("vx", 0.0)),
                vy=float(p.get("vy", 0.0)),
                vz=float(p.get("vz", 0.0)),
                time=float(p.get("time", 0.0)),
                perigee_d0=p.get("perigee_d0"),
                perigee_z0=p.get("perigee_z0"),
                num_tracker_hits=int(p.get("num_tracker_hits", 0)),
                num_calo_hits=int(p.get("num_calo_hits", 0)),
                primary=bool(p.get("primary", False)),
                vertex_primary=p.get("vertex_primary"),
                parent_id=parent_id_str,
                p=tot_p,
                pt=pt,
                phi=phi,
                eta=eta,
            )
        )

    # 2. Normalize tracker hits
    normalized_tracker_hits: List[TrackerHitRecord] = []
    raw_hits = raw_event.get("tracker_hits", [])

    for idx, hit in enumerate(raw_hits):
        x = float(hit["x"])
        y = float(hit["y"])
        z = float(hit["z"])

        true_x = hit.get("true_x")
        true_y = hit.get("true_y")
        true_z = hit.get("true_z")

        dx = dy = dz = dr = None
        if true_x is not None and true_y is not None and true_z is not None:
            disp = calculate_tracker_displacement(
                x, y, z, float(true_x), float(true_y), float(true_z)
            )
            dx = disp["dx"]
            dy = disp["dy"]
            dz = disp["dz"]
            dr = disp["dr"]

        normalized_tracker_hits.append(
            TrackerHitRecord(
                hit_index=idx,
                x=x,
                y=y,
                z=z,
                true_x=float(true_x) if true_x is not None else None,
                true_y=float(true_y) if true_y is not None else None,
                true_z=float(true_z) if true_z is not None else None,
                time=float(hit.get("time", 0.0)),
                particle_id=str(hit["particle_id"]),
                volume_id=int(hit.get("volume_id", 0)),
                layer_id=int(hit.get("layer_id", 0)),
                surface_id=int(hit.get("surface_id", 0)),
                detector=str(hit.get("detector", "Tracker")),
                dx=dx,
                dy=dy,
                dz=dz,
                dr=dr,
            )
        )

    # 3. Normalize calorimeter cells
    normalized_calo_cells: List[CaloCellRecord] = []
    raw_cells = raw_event.get("calo_hits", [])

    for idx, cell in enumerate(raw_cells):
        contrib_pids = [str(pid) for pid in cell.get("contrib_particle_ids", [])]
        contrib_energies = [float(e) for e in cell.get("contrib_energies", [])]
        contrib_times = [float(t) for t in cell.get("contrib_times", [])]

        normalized_calo_cells.append(
            CaloCellRecord(
                cell_index=idx,
                detector=str(cell.get("detector", "Calorimeter")),
                total_energy=float(cell.get("total_energy", sum(contrib_energies))),
                x=float(cell["x"]),
                y=float(cell["y"]),
                z=float(cell["z"]),
                contrib_particle_ids=contrib_pids,
                contrib_energies=contrib_energies,
                contrib_times=contrib_times,
            )
        )

    # 4. Normalize tracks
    normalized_tracks: List[TrackRecord] = []
    raw_tracks = raw_event.get("tracks", [])

    for idx, t in enumerate(raw_tracks):
        qop = float(t.get("qop", 0.0))
        theta = float(t.get("theta", 0.0))

        track_p = calculate_track_momentum(qop)
        track_pt = calculate_track_transverse_momentum(qop, theta)
        track_eta = calculate_track_pseudorapidity(theta)

        normalized_tracks.append(
            TrackRecord(
                track_id=int(t.get("track_id", idx)),
                majority_particle_id=str(t["majority_particle_id"]),
                d0=float(t.get("d0", 0.0)),
                z0=float(t.get("z0", 0.0)),
                phi=float(t.get("phi", 0.0)),
                theta=theta,
                qop=qop,
                hit_ids=[int(hid) for hid in t.get("hit_ids", [])],
                p=track_p,
                pt=track_pt,
                eta=track_eta,
            )
        )

    # Build relationship indexes
    indexes = build_event_indexes(
        normalized_particles,
        normalized_tracker_hits,
        normalized_calo_cells,
        normalized_tracks,
    )

    # Validate track hit semantics
    relationships_meta, rel_diagnostics = validate_track_hit_semantics(
        normalized_tracker_hits, normalized_tracks
    )

    # Run data quality validation
    validation_report = validate_event_data(
        event_id,
        normalized_particles,
        normalized_tracker_hits,
        normalized_calo_cells,
        normalized_tracks,
    )

    # Compile diagnostics
    diagnostics: List[DiagnosticItem] = []
    if is_synthetic:
        diagnostics.append(
            DiagnosticItem(
                severity="info",
                code="DATA_SOURCE_SYNTHETIC_DEMO",
                message=(
                    "This event was generated by the deterministic synthetic simulation "
                    "pipeline for local demonstration and testing. Values simulate realistic "
                    "detector physics but are not official CERN measurements."
                ),
            )
        )

    diagnostics.extend(rel_diagnostics)
    diagnostics.extend(validation_report.diagnostics)

    # Build source metadata
    source_meta = EventSourceMetadata(
        dataset=config.dataset_name if not is_synthetic else "Particle Trace Demo",
        release=config.dataset_release,
        configuration=config.configuration_name,
        channel=config.channel,
        pileup=config.pileup,
        split=config.split,
        eventId=event_id,
    )

    counts = EventCounts(
        particles=len(normalized_particles),
        trackerHits=len(normalized_tracker_hits),
        calorimeterCells=len(normalized_calo_cells),
        tracks=len(normalized_tracks),
    )

    return EventBundle(
        schemaVersion=1,
        source=source_meta,
        counts=counts,
        particles=normalized_particles,
        trackerHits=normalized_tracker_hits,
        calorimeterCells=normalized_calo_cells,
        tracks=normalized_tracks,
        indexes=indexes,
        relationships=relationships_meta,
        diagnostics=diagnostics,
    )
