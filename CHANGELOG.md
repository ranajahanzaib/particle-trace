# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-11-20

### Added

- **Core Investigation Workspace**: Interactive three-panel interface connecting Truth Particles, Tracker Hits, Calorimeter Deposits, Reconstructed Tracks, and Particle Decay Ancestry.
- **3D Open Data Detector Visualization**: Data-driven Three.js & React Three Fiber visualization supporting full ODD detector geometry, measured tracker hit rendering with raycasting selection, true position residual vectors, calorimeter cell deposit scaling, and production vertex indicators.
- **Scientific Calculations & Precision**: Strict 64-bit unsigned integer serialization as decimal strings, kinematics calculations ($p, p_T, \phi, \eta$), 3D tracker residuals ($\Delta r$), calorimeter energy-weighted times, and full PDG table resolution.
- **Python Data Pipeline**: Configurable ColliderML ingestion pipeline (`pipeline/src/particle_trace`) with schema validation, NetworkX ancestry DAG construction, event bundle serialization, and Cloudflare R2 synchronization.
- **Cloudflare Pages Functions API**: REST endpoints (`/api/health`, `/api/manifest`, `/api/configs`, `/api/configs/:config/events`, `/api/configs/:config/events/:id`) with path traversal guards and immutable caching.
- **Testing & Verification**: 14 Python unit tests in pytest and 19 frontend and API tests in Vitest, including a complete 10-step end-to-end investigation workflow test.
- **Offline Demo Mode**: Packaged verified sample collision fixtures in `apps/web/public/data/` enabling immediate local exploration without external dataset dependencies.
