export interface ParticleRecord {
  particle_id: string;
  pdg_id: number;
  name: string;
  full_name: string;
  particle_class: string;
  mass: number;
  energy: number;
  charge: number;
  px: number;
  py: number;
  pz: number;
  vx: number;
  vy: number;
  vz: number;
  time: number;
  perigee_d0?: number | null;
  perigee_z0?: number | null;
  num_tracker_hits: number;
  num_calo_hits: number;
  primary: boolean;
  vertex_primary?: number | null;
  parent_id: string;
  p: number;
  pt: number;
  phi: number;
  eta?: number | null;
}

export interface TrackerHitRecord {
  hit_index: number;
  x: number;
  y: number;
  z: number;
  true_x?: number | null;
  true_y?: number | null;
  true_z?: number | null;
  time: number;
  particle_id: string;
  volume_id: number;
  layer_id: number;
  surface_id: number;
  detector: string;
  dx?: number | null;
  dy?: number | null;
  dz?: number | null;
  dr?: number | null;
}

export interface CaloCellRecord {
  cell_index: number;
  detector: string;
  total_energy: number;
  x: number;
  y: number;
  z: number;
  contrib_particle_ids: string[];
  contrib_energies: number[];
  contrib_times: number[];
}

export interface TrackRecord {
  track_id: number;
  majority_particle_id: string;
  d0: number;
  z0: number;
  phi: number;
  theta: number;
  qop: number;
  hit_ids: number[];
  p?: number | null;
  pt?: number | null;
  eta?: number | null;
}

export interface EventSourceMetadata {
  dataset: string;
  release: string;
  configuration: string;
  channel: string;
  pileup: string;
  split: string;
  eventId: number;
}

export interface EventCounts {
  particles: number;
  trackerHits: number;
  calorimeterCells: number;
  tracks: number;
}

export interface EventIndexes {
  trackerHitIndicesByParticleId: Record<string, number[]>;
  caloCellIndicesByParticleId: Record<string, number[]>;
  trackIndicesByMajorityParticleId: Record<string, number[]>;
  childrenIdsByParentId: Record<string, string[]>;
}

export interface RelationshipMetadata {
  trackHitMappingStatus: string;
  notes: string;
}

export interface DiagnosticItem {
  severity: "info" | "warning" | "error";
  code: string;
  message: string;
}

export interface EventBundle {
  schemaVersion: number;
  source: EventSourceMetadata;
  counts: EventCounts;
  particles: ParticleRecord[];
  trackerHits: TrackerHitRecord[];
  calorimeterCells: CaloCellRecord[];
  tracks: TrackRecord[];
  indexes: EventIndexes;
  relationships: RelationshipMetadata;
  diagnostics: DiagnosticItem[];
}

export interface EventSummary {
  eventId: number;
  particleCount: number;
  trackerHitCount: number;
  calorimeterCellCount: number;
  trackCount: number;
}

export interface ConfigManifest {
  configuration: string;
  channel: string;
  pileup: string;
  eventCount: number;
  events: EventSummary[];
  updatedAt: string;
}

export interface DatasetManifest {
  dataset: string;
  release: string;
  description: string;
  citation: string;
  license: string;
  configurations: string[];
  totalEvents: number;
  updatedAt: string;
}

export interface LayerVisibilityState {
  detectorGeometry: boolean;
  selectedTrackerHits: boolean;
  otherTrackerHits: boolean;
  trueHitPositions: boolean;
  calorimeterCells: boolean;
  reconstructedTracks: boolean;
  productionVertex: boolean;
  trajectoryGuide: boolean;
  axesGrid: boolean;
}

export interface ParticleFiltersState {
  searchQuery: string;
  pdgClass: string;
  primaryOnly: boolean | null;
  hasTrackerHits: boolean;
  hasCaloHits: boolean;
  hasTracks: boolean;
  minPt: number;
  sortBy: "pt" | "energy" | "particle_id" | "num_tracker_hits" | "name";
  sortOrder: "asc" | "desc";
}
