"""Event data schemas and serialization contracts for Particle Trace.

Ensures strict 64-bit integer safety by serializing particle, parent,
and majority particle IDs as decimal strings.
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class EventSourceMetadata(BaseModel):
    """Provenance metadata for collision event."""
    dataset: str = "CERN/ColliderML-Release-1"
    release: str = "Release 1"
    configuration: str = "ttbar_pu0"
    channel: str = "ttbar"
    pileup: str = "pu0"
    split: str = "train"
    eventId: int


class EventCounts(BaseModel):
    """Object counts within the event."""
    particles: int
    trackerHits: int
    calorimeterCells: int
    tracks: int


class ParticleRecord(BaseModel):
    """Truth particle with kinematics and derived quantities."""
    particle_id: str
    pdg_id: int
    name: str
    full_name: str
    particle_class: str
    mass: float
    energy: float
    charge: float
    px: float
    py: float
    pz: float
    vx: float
    vy: float
    vz: float
    time: float
    perigee_d0: Optional[float] = None
    perigee_z0: Optional[float] = None
    num_tracker_hits: int = 0
    num_calo_hits: int = 0
    primary: bool = False
    vertex_primary: Optional[int] = None
    parent_id: str = "-1"
    # Derived quantities
    p: float
    pt: float
    phi: float
    eta: Optional[float] = None


class TrackerHitRecord(BaseModel):
    """Tracker measurement at measured (x, y, z) with optional true position."""
    hit_index: int
    x: float
    y: float
    z: float
    true_x: Optional[float] = None
    true_y: Optional[float] = None
    true_z: Optional[float] = None
    time: float
    particle_id: str
    volume_id: int
    layer_id: int
    surface_id: int
    detector: str
    # Derived displacement
    dx: Optional[float] = None
    dy: Optional[float] = None
    dz: Optional[float] = None
    dr: Optional[float] = None


class CaloCellRecord(BaseModel):
    """Calorimeter cell containing multi-particle energy deposits."""
    cell_index: int
    detector: str
    total_energy: float
    x: float
    y: float
    z: float
    contrib_particle_ids: List[str]
    contrib_energies: List[float]
    contrib_times: List[float]


class TrackRecord(BaseModel):
    """Reconstructed track associated to a truth particle via majority_particle_id."""
    track_id: int
    majority_particle_id: str
    d0: float
    z0: float
    phi: float
    theta: float
    qop: float
    hit_ids: List[int]
    # Derived quantities
    p: Optional[float] = None
    pt: Optional[float] = None
    eta: Optional[float] = None


class RelationshipMetadata(BaseModel):
    """Relationship verification statuses and semantics."""
    trackHitMappingStatus: str = "unverified"
    notes: str = (
        "Reconstructed track hit_ids semantics are not confirmed as direct array "
        "indices into tracker_hits; track-hit associations are kept as separate "
        "views without fabricated purity scores."
    )


class DiagnosticItem(BaseModel):
    """Quality diagnostic message for an event."""
    severity: str  # "info", "warning", "error"
    code: str
    message: str


class EventIndexes(BaseModel):
    """Pre-computed event-scoped index mappings for constant-time lookups."""
    trackerHitIndicesByParticleId: Dict[str, List[int]]
    caloCellIndicesByParticleId: Dict[str, List[int]]
    trackIndicesByMajorityParticleId: Dict[str, List[int]]
    childrenIdsByParentId: Dict[str, List[str]]


class EventBundle(BaseModel):
    """Complete, self-contained event data bundle."""
    schemaVersion: int = 1
    source: EventSourceMetadata
    counts: EventCounts
    particles: List[ParticleRecord]
    trackerHits: List[TrackerHitRecord]
    calorimeterCells: List[CaloCellRecord]
    tracks: List[TrackRecord]
    indexes: EventIndexes
    relationships: RelationshipMetadata = Field(default_factory=RelationshipMetadata)
    diagnostics: List[DiagnosticItem] = Field(default_factory=list)
