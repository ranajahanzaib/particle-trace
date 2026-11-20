# Particle Trace — System Architecture & Scientific Data Model

## 1. Overview & Core Philosophy

**Particle Trace** is an end-to-end scientific investigation application for tracing individual simulated truth particles through high-energy physics collision events in a collider detector.

Built on the **CERN ColliderML Release 1** dataset, Particle Trace connects five complementary physical representations of an event:

1. **Truth Particles** (`particles` table)
2. **Tracker Measurements** (`tracker_hits` table)
3. **Calorimeter Energy Deposits** (`calo_hits` table)
4. **Reconstructed Tracks** (`tracks` table)
5. **Decay Ancestry** (directed parent–child decay graph)

The core scientific design principle is:
$$\text{Truth Particle} \longleftrightarrow \text{Tracker Measurements} \longleftrightarrow \text{Calorimeter Deposits} \longleftrightarrow \text{Reconstructed Tracks} \longleftrightarrow \text{Decay Tree}$$

All representations remain synchronized in real time: selecting a particle anywhere updates the 3D detector view, kinematics tables, tracker residual metrics, calorimeter cell showers, majority track associations, and ancestry trees.

---

## 2. Scientific Data Model & Relationship Semantics

### 2.1 64-Bit Integer Precision & Entity Identity

In CERN ColliderML Release 1, `particle_id`, `parent_id`, and `majority_particle_id` are unsigned 64-bit integers. Because standard JavaScript IEEE-754 double precision floats can only safely represent integers up to $2^{53} - 1$ ($9,007,199,254,740,991$), large 64-bit identifiers risk silent bit truncation.

**Architectural decision:** The pipeline normalizes all particle identifiers, parent links, and majority particle IDs to **decimal strings** in serialized JSON bundles. String-based equality comparisons are enforced throughout frontend lookups.

Composite entity identity is scoped to the collision event:
$$\text{Entity Key} = (\text{configuration}, \text{eventId}, \text{particleId})$$

### 2.2 Truth-Level Particle Kinematics

Given momentum components $(p_x, p_y, p_z)$:

- **Total momentum:**
  $$p = \sqrt{p_x^2 + p_y^2 + p_z^2} \quad [\text{GeV}/c]$$
- **Transverse momentum:**
  $$p_T = \sqrt{p_x^2 + p_y^2} \quad [\text{GeV}/c]$$
- **Azimuthal angle:**
  $$\phi = \text{atan2}(p_y, p_x) \in [-\pi, \pi] \quad [\text{rad}]$$
- **Pseudorapidity:**
  $$\eta = \operatorname{asinh}\left(\frac{p_z}{p_T}\right) = \ln\left[\tan\left(\frac{\theta}{2}\right)\right]^{-1}$$
  When $p_T \le 10^{-12}$ (particles colinear with the beam pipe), $\eta$ is safely handled as `null` or $0.0$ rather than producing numerical overflows.

### 2.3 Tracker Measurement & True Position Comparisons

The application strictly uses measured detector positions $(x, y, z)$ in millimeters for physical detector rendering. True pre-digitization positions $(\text{true\_x}, \text{true\_y}, \text{true\_z})$ are preserved in a separate comparison layer.

- **3D Spatial Residual / Displacement:**
  $$\Delta x = x - \text{true\_x}, \quad \Delta y = y - \text{true\_y}, \quad \Delta z = z - \text{true\_z}$$
  $$\Delta r = \sqrt{\Delta x^2 + \Delta y^2 + \Delta z^2}$$

### 2.4 Calorimeter Energy Deposits & Multi-Particle Contributions

In ColliderML, calorimeter cells group multi-particle energy depositions in nested parallel lists:
`contrib_particle_ids`, `contrib_energies`, and `contrib_times`.

A single cell may receive energy from dozens of particles; conversely, an electromagnetic or hadronic shower from a single particle spans multiple adjacent cells.

Particle Trace never treats a cell's `total_energy` as belonging solely to the selected particle. For selected particle $P$:

1. Locate aligned indices $k$ where $\text{contrib\_particle\_ids}[k] == P$.
2. Retrieve particle contribution energy $E_k = \text{contrib\_energies}[k]$ and contribution time $t_k = \text{contrib\_times}[k]$.
3. Compute derived energy-weighted mean contribution time:
   $$\bar{t} = \frac{\sum_k E_k \cdot t_k}{\sum_k E_k}$$

### 2.5 Reconstructed Tracks & Majority Truth Association

Reconstructed tracks in the dataset are linked to truth particles via `majority_particle_id` (the truth particle that produced the largest share of hits on that track).

- **Association nature:** This relationship is many-to-many or one-to-many; multiple reconstructed tracks can share the same majority particle. It is explicitly presented as a **majority association**, not an idealized 1-to-1 reconstruction match.
- **Derived track quantities:**
  $$p = \left|\frac{1}{q/p}\right|, \quad p_T = \left|\frac{1}{q/p}\right| \sin(\theta), \quad \eta = -\ln\left[\tan\left(\frac{\theta}{2}\right)\right]$$
- **Track-to-hit ID semantics status:** Documented as `unverified` if hit IDs represent Acts surface channels or hardware detector IDs rather than direct array row indices. No fabricated purity percentage is shown unless confirmed.

### 2.6 Particle Ancestry Graph

Parent relationships are resolved using `parent_id` (with `-1` indicating a primary or root particle).

- Managed via **NetworkX** directed acyclic graphs (`nx.DiGraph`).
- Validates against circular cycles (`nx.is_directed_acyclic_graph`).
- Handles orphan parents and multi-root parton vertices without crashing.
- Extracts subgraphs containing grandparents, parents, target particle, and all decay descendants.

---

## 3. System Architecture & Data Flow

```
+-----------------------------------------------------------+
|              CERN ColliderML Release 1 (Hugging Face)     |
|          Parquet Datasets: particles, tracker_hits,       |
|                  calo_hits, tracks (~28 TB)               |
+-----------------------------------------------------------+
                             │
                             ▼ (Selective Ingestion: 10-100 events)
+-----------------------------------------------------------+
|               Python Data Pipeline (`pipeline/`)          |
|  - `DatasetLoader`: Configurable channel, pileup, limits  |
|  - `validation.py`: Parallel array & schema validation    |
|  - `physics.py`: Pure kinematics & residual calculations  |
|  - `ancestry.py`: NetworkX DAG decay hierarchy            |
|  - `export.py`: Compact JSON event bundle generation      |
|  - `storage.py`: Cloudflare R2 publishing                 |
+-----------------------------------------------------------+
                             │
              ┌──────────────┴──────────────┐
              ▼                             ▼
+---------------------------+ +-----------------------------+
| Cloudflare R2 Storage     | | Local Fixtures / Static     |
| - colliderml-release-1/   | | - data/fixtures/            |
|   manifest.json           | | - apps/web/public/data/     |
|   [config]/manifest.json  | |   (Instant offline demo)    |
|   [config]/events/*.json  | |                             |
+---------------------------+ +-----------------------------+
              │                             │
              ▼                             ▼
+-----------------------------------------------------------+
|        Cloudflare Pages Functions API (`/api/*`)          |
|  - `/api/health`: Service & storage backend status        |
|  - `/api/manifest`: Dataset & configuration metadata      |
|  - `/api/configs/:config/events`: Paginated event index   |
|  - `/api/configs/:config/events/:id`: Event bundle        |
|  (Automatic graceful fallback to local fixtures)          |
+-----------------------------------------------------------+
                             │
                             ▼
+-----------------------------------------------------------+
|             Frontend Application (`apps/web/`)            |
|  - React 19 + TypeScript + Vite + Tailwind CSS            |
|  - Three.js + React Three Fiber + Drei (3D Detector)      |
|  - Apache ECharts (Scientific Kinematics & Timing)        |
|  - Data Repository Abstraction (`api.ts`)                 |
|  - Shared URL State (`?config=...&event=...&particle=...`) |
+-----------------------------------------------------------+
```

---

## 4. 3D Detector Visualization Architecture

The 3D detector visualization is implemented with Three.js via React Three Fiber (`@react-three/fiber` and `@react-three/drei`):

- **Coordinate System:**
  - $X$ in mm (horizontal transverse)
  - $Y$ in mm (vertical transverse)
  - $Z$ in mm (longitudinal beam axis)
  - Scale factor: $1 \text{ Three.js unit} = 100 \text{ mm}$ ($0.1\text{ m}$)
- **Open Data Detector (ODD) Schematic Geometry:**
  - Beam pipe cylinder: $r = 20\text{ mm}, L = 3600\text{ mm}$
  - Pixel barrel layers: $r \in [32, 72, 116, 172]\text{ mm}, L = 1100\text{ mm}$
  - Short-strip barrel: $r \in [260, 360, 500]\text{ mm}, L = 1900\text{ mm}$
  - Long-strip barrel: $r \in [660, 820, 1020]\text{ mm}, L = 2400\text{ mm}$
  - ECal barrel & endcaps: $r \in [1150, 1400]\text{ mm}, L = 2800\text{ mm}$
  - HCal barrel & endcaps: $r \in [1500, 2300]\text{ mm}, L = 3600\text{ mm}$
- **Layer Visibility Management:** Independent toggles for Geometry, Selected Hits, Other Hits, True Positions, Calorimeter Cells, Vertex, and Trajectory Guide.
- **Interactivity:** Raycasting on 3D hit spheres highlights and selects the associated truth particle across the entire workspace.
- **Camera Views:** Instant alignment for Isometric, Transverse ($X-Y$ beam-on), and Longitudinal ($R-Z$ side view).

---

## 5. Performance & Data Storage Strategy

1. **Pre-computed Event Indexes:**
   During normalization, event bundles compile constant-time lookup maps:
   - `trackerHitIndicesByParticleId`
   - `caloCellIndicesByParticleId`
   - `trackIndicesByMajorityParticleId`
   - `childrenIdsByParentId`
     Selecting a particle never scans tens of thousands of hit records on every render.
2. **Selective Remote Ingestion:**
   The full ~28 TB dataset is never downloaded locally. Developers ingest bounded event samples (e.g. 10–20 events) or run against lightweight bundled fixtures.
3. **Bundle Optimization:**
   Frontend dependencies are code-split into distinct vendor chunks (`vendor-three`, `vendor-echarts`, `vendor-react`), maintaining application chunk size under 95 kB.
