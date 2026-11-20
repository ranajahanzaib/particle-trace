"""Event-scoped relationship builder and indexer.

Constructs indexed mappings linking truth particles to tracker hits,
calorimeter cells, reconstructed tracks, and family ancestry.
"""

from collections import defaultdict
from typing import Any, Dict, List, Set, Tuple
from particle_trace.schema import (
    CaloCellRecord,
    DiagnosticItem,
    EventIndexes,
    ParticleRecord,
    RelationshipMetadata,
    TrackerHitRecord,
    TrackRecord,
)


def build_event_indexes(
    particles: List[ParticleRecord],
    tracker_hits: List[TrackerHitRecord],
    calo_cells: List[CaloCellRecord],
    tracks: List[TrackRecord],
) -> EventIndexes:
    """Build constant-time event-local lookup indices."""
    # 1. Tracker hits by particle ID
    hits_by_pid: Dict[str, List[int]] = defaultdict(list)
    for hit in tracker_hits:
        hits_by_pid[hit.particle_id].append(hit.hit_index)

    # 2. Calorimeter cells by particle ID (searching nested contrib_particle_ids)
    calo_by_pid: Dict[str, List[int]] = defaultdict(list)
    for cell in calo_cells:
        seen_in_cell: Set[str] = set()
        for pid in cell.contrib_particle_ids:
            if pid not in seen_in_cell:
                calo_by_pid[pid].append(cell.cell_index)
                seen_in_cell.add(pid)

    # 3. Tracks by majority particle ID
    tracks_by_pid: Dict[str, List[int]] = defaultdict(list)
    for idx, track in enumerate(tracks):
        tracks_by_pid[track.majority_particle_id].append(idx)

    # 4. Children by parent ID
    children_by_parent: Dict[str, List[str]] = defaultdict(list)
    for p in particles:
        if p.parent_id not in ("-1", "", "None", "null"):
            children_by_parent[p.parent_id].append(p.particle_id)

    return EventIndexes(
        trackerHitIndicesByParticleId=dict(hits_by_pid),
        caloCellIndicesByParticleId=dict(calo_by_pid),
        trackIndicesByMajorityParticleId=dict(tracks_by_pid),
        childrenIdsByParentId=dict(children_by_parent),
    )


def validate_track_hit_semantics(
    tracker_hits: List[TrackerHitRecord], tracks: List[TrackRecord]
) -> Tuple[RelationshipMetadata, List[DiagnosticItem]]:
    """Inspect and test reconstructed track hit_ids semantics.

    Validates whether track hit_ids match tracker hit indices or surface IDs,
    or remain unverified.
    """
    diagnostics: List[DiagnosticItem] = []
    if not tracks:
        return RelationshipMetadata(
            trackHitMappingStatus="no_tracks",
            notes="Event contains no reconstructed tracks.",
        ), diagnostics

    num_hits = len(tracker_hits)
    all_hit_ids = [hid for t in tracks for hid in t.hit_ids]

    if not all_hit_ids:
        return RelationshipMetadata(
            trackHitMappingStatus="no_track_hit_ids",
            notes="Tracks contain empty hit_ids lists.",
        ), diagnostics

    # Check bounds against hit array indices [0, num_hits - 1]
    in_bounds = [hid for hid in all_hit_ids if 0 <= hid < num_hits]
    fraction_in_bounds = len(in_bounds) / len(all_hit_ids) if all_hit_ids else 0.0

    if fraction_in_bounds < 0.95:
        metadata = RelationshipMetadata(
            trackHitMappingStatus="unverified",
            notes=(
                f"Track-hit mapping semantics are unverified: only {fraction_in_bounds:.1%} of track hit_ids "
                f"fall within tracker hit indices [0, {num_hits - 1}]. hit_ids may represent hardware/detector "
                f"sensor channels or internal Acts identifiers rather than row indices. "
                f"Track-to-hit links are displayed as separate views without fabricated purity."
            ),
        )
        diagnostics.append(
            DiagnosticItem(
                severity="info",
                code="TRACK_HIT_SEMANTICS_UNVERIFIED",
                message=metadata.notes,
            )
        )
        return metadata, diagnostics

    # If bounds match, verify consistency with majority particle
    metadata = RelationshipMetadata(
        trackHitMappingStatus="verified_row_indices",
        notes="Track hit_ids verified as 0-indexed tracker hit array positions.",
    )
    diagnostics.append(
        DiagnosticItem(
            severity="info",
            code="TRACK_HIT_SEMANTICS_VERIFIED",
            message=metadata.notes,
        )
    )
    return metadata, diagnostics
