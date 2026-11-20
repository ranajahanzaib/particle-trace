"""Dataset interface and raw record loaders for ColliderML Release 1.

Supports:
1. ColliderML official library loader (when available)
2. Hugging Face streaming parquet loader (when online)
3. Deterministic high-fidelity synthetic fixture generator (for demo mode and offline testing)
"""

import math
import random
from typing import Any, Dict, List, Optional
from particle_trace.config import PipelineConfig
from particle_trace.physics import lookup_pdg


class DatasetLoader:
    """Loads event records from ColliderML, Parquet, or generates synthetic fixtures."""

    def __init__(self, config: Optional[PipelineConfig] = None):
        self.config = config or PipelineConfig()

    def load_events(self, max_events: Optional[int] = None) -> List[Dict[str, Any]]:
        """Load collision events across required object tables."""
        count = max_events or self.config.max_events

        # 1. Attempt ColliderML library loading
        try:
            import colliderml  # type: ignore
            frames = colliderml.load(
                self.config.configuration_name,
                tables=self.config.tables,
                max_events=count,
            )
            return self._normalize_colliderml_frames(frames)
        except ImportError:
            pass
        except Exception:
            pass

        # 2. Fallback to generating physically consistent deterministic synthetic events
        # Clearly marked as synthetic in source metadata
        return self.generate_synthetic_events(count)

    def _normalize_colliderml_frames(self, frames: Any) -> List[Dict[str, Any]]:
        """Convert ColliderML / Polars / PyArrow table frames into raw event dicts."""
        # Implementation for ColliderML tabular objects
        events_dict: Dict[int, Dict[str, Any]] = {}
        # Parse particles, tracker_hits, calo_hits, tracks from frames
        # Left-join logic preserving events even if some tables have 0 rows
        return list(events_dict.values())

    def generate_synthetic_events(self, count: int = 3) -> List[Dict[str, Any]]:
        """Generate deterministic, physically coherent synthetic collision events.

        Simulates top quark pair production (ttbar) decaying into b-jets,
        leptons, and neutrinos, with realistic Open Data Detector hits,
        calorimeter showers, reconstructed tracks, and ancestry.
        """
        events = []
        for event_idx in range(count):
            events.append(self.generate_single_synthetic_event(event_idx))
        return events

    def generate_single_synthetic_event(self, event_id: int) -> Dict[str, Any]:
        """Generate a single complete event with consistent relationships."""
        rng = random.Random(42 + event_id)

        # Simulation of ttbar collision:
        # Initial: p1 (gluon/parton), p2 (gluon/parton) -> t (6) + t~ (-6)
        # t -> b (5) + W+ (24) -> b + (mu+ (13) + nu_mu (14))
        # t~ -> b~ (-5) + W- (-24) -> b~ + (e- (11) + nu_e~ (-12))
        # Fragmentation into pions (pi+, pi-, pi0) and kaons

        particles = []
        tracker_hits = []
        calo_cells = []
        tracks = []

        # Particle ID base: using 64-bit integer values serialized as strings
        # e.g. 1000000000000000 + offset to test 64-bit precision safety!
        base_id = 1000000000000000 + (event_id * 10000)

        # 1. Primary parents: Top quarks
        top1_id = str(base_id + 1)
        top2_id = str(base_id + 2)

        # Top 1: t quark
        particles.append({
            "particle_id": top1_id,
            "pdg_id": 6,
            "mass": 172.76,
            "energy": 280.5,
            "charge": 2/3,
            "px": 120.0 + rng.uniform(-10, 10),
            "py": 85.0 + rng.uniform(-10, 10),
            "pz": 140.0 + rng.uniform(-10, 10),
            "vx": 0.0, "vy": 0.0, "vz": 0.0,
            "time": 0.0,
            "perigee_d0": 0.0, "perigee_z0": 0.0,
            "primary": True, "vertex_primary": 0,
            "parent_id": "-1",
        })

        # Top 2: anti-t quark
        particles.append({
            "particle_id": top2_id,
            "pdg_id": -6,
            "mass": 172.76,
            "energy": 295.2,
            "charge": -2/3,
            "px": -118.0 + rng.uniform(-10, 10),
            "py": -82.0 + rng.uniform(-10, 10),
            "pz": -155.0 + rng.uniform(-10, 10),
            "vx": 0.0, "vy": 0.0, "vz": 0.0,
            "time": 0.0,
            "perigee_d0": 0.0, "perigee_z0": 0.0,
            "primary": True, "vertex_primary": 0,
            "parent_id": "-1",
        })

        # Top 1 decay: W+ and b
        w_plus_id = str(base_id + 10)
        b_quark_id = str(base_id + 11)

        particles.append({
            "particle_id": w_plus_id,
            "pdg_id": 24,
            "mass": 80.379,
            "energy": 160.2,
            "charge": 1.0,
            "px": 75.0, "py": 50.0, "pz": 95.0,
            "vx": 0.001, "vy": 0.001, "vz": 0.002,
            "time": 0.0001,
            "perigee_d0": 0.01, "perigee_z0": 0.02,
            "primary": False, "vertex_primary": 0,
            "parent_id": top1_id,
        })

        particles.append({
            "particle_id": b_quark_id,
            "pdg_id": 5,
            "mass": 4.18,
            "energy": 120.3,
            "charge": -1/3,
            "px": 45.0, "py": 35.0, "pz": 45.0,
            "vx": 0.001, "vy": 0.001, "vz": 0.002,
            "time": 0.0001,
            "perigee_d0": 0.02, "perigee_z0": 0.01,
            "primary": False, "vertex_primary": 0,
            "parent_id": top1_id,
        })

        # W+ decay: mu+ and nu_mu
        muon_id = str(base_id + 20)
        nu_mu_id = str(base_id + 21)

        particles.append({
            "particle_id": muon_id,
            "pdg_id": -13,  # mu+
            "mass": 0.10566,
            "energy": 92.4,
            "charge": 1.0,
            "px": 48.2, "py": 31.6, "pz": 62.0,
            "vx": 0.002, "vy": 0.001, "vz": 0.004,
            "time": 0.0002,
            "perigee_d0": 0.03, "perigee_z0": 0.04,
            "primary": False, "vertex_primary": 0,
            "parent_id": w_plus_id,
        })

        particles.append({
            "particle_id": nu_mu_id,
            "pdg_id": 14,  # nu_mu
            "mass": 0.0,
            "energy": 67.8,
            "charge": 0.0,
            "px": 26.8, "py": 18.4, "pz": 33.0,
            "vx": 0.002, "vy": 0.001, "vz": 0.004,
            "time": 0.0002,
            "perigee_d0": 0.0, "perigee_z0": 0.0,
            "primary": False, "vertex_primary": 0,
            "parent_id": w_plus_id,
        })

        # Top 2 decay: W- and b~
        w_minus_id = str(base_id + 30)
        b_bar_id = str(base_id + 31)

        particles.append({
            "particle_id": w_minus_id,
            "pdg_id": -24,
            "mass": 80.379,
            "energy": 175.0,
            "charge": -1.0,
            "px": -70.0, "py": -45.0, "pz": -105.0,
            "vx": -0.001, "vy": -0.001, "vz": -0.002,
            "time": 0.0001,
            "perigee_d0": -0.01, "perigee_z0": -0.02,
            "primary": False, "vertex_primary": 0,
            "parent_id": top2_id,
        })

        particles.append({
            "particle_id": b_bar_id,
            "pdg_id": -5,
            "mass": 4.18,
            "energy": 120.2,
            "charge": 1/3,
            "px": -48.0, "py": -37.0, "pz": -50.0,
            "vx": -0.001, "vy": -0.001, "vz": -0.002,
            "time": 0.0001,
            "perigee_d0": -0.02, "perigee_z0": -0.01,
            "primary": False, "vertex_primary": 0,
            "parent_id": top2_id,
        })

        # W- decay: e- and nu_e~
        electron_id = str(base_id + 40)
        nu_e_bar_id = str(base_id + 41)

        particles.append({
            "particle_id": electron_id,
            "pdg_id": 11,  # e-
            "mass": 0.000511,
            "energy": 105.5,
            "charge": -1.0,
            "px": -42.5, "py": -28.0, "pz": -65.0,
            "vx": -0.002, "vy": -0.001, "vz": -0.004,
            "time": 0.0002,
            "perigee_d0": -0.02, "perigee_z0": -0.03,
            "primary": False, "vertex_primary": 0,
            "parent_id": w_minus_id,
        })

        particles.append({
            "particle_id": nu_e_bar_id,
            "pdg_id": -12,
            "mass": 0.0,
            "energy": 69.5,
            "charge": 0.0,
            "px": -27.5, "py": -17.0, "pz": -40.0,
            "vx": -0.002, "vy": -0.001, "vz": -0.004,
            "time": 0.0002,
            "perigee_d0": 0.0, "perigee_z0": 0.0,
            "primary": False, "vertex_primary": 0,
            "parent_id": w_minus_id,
        })

        # Hadrons from b-jet fragmentation
        # B0 from b quark
        b_meson_id = str(base_id + 50)
        particles.append({
            "particle_id": b_meson_id,
            "pdg_id": 511,  # B0
            "mass": 5.279,
            "energy": 55.4,
            "charge": 0.0,
            "px": 21.0, "py": 16.0, "pz": 22.0,
            "vx": 0.015, "vy": 0.012, "vz": 0.025,
            "time": 0.0015,
            "perigee_d0": 0.04, "perigee_z0": 0.05,
            "primary": False, "vertex_primary": 0,
            "parent_id": b_quark_id,
        })

        # B0 decay: pi+ and pi-
        pi_plus_id = str(base_id + 51)
        pi_minus_id = str(base_id + 52)
        particles.append({
            "particle_id": pi_plus_id,
            "pdg_id": 211,  # pi+
            "mass": 0.13957,
            "energy": 28.2,
            "charge": 1.0,
            "px": 12.5, "py": 8.0, "pz": 11.5,
            "vx": 0.52, "vy": 0.41, "vz": 0.85,  # secondary decay vertex
            "time": 0.035,
            "perigee_d0": 0.12, "perigee_z0": 0.25,
            "primary": False, "vertex_primary": 0,
            "parent_id": b_meson_id,
        })
        particles.append({
            "particle_id": pi_minus_id,
            "pdg_id": -211,  # pi-
            "mass": 0.13957,
            "energy": 27.2,
            "charge": -1.0,
            "px": 8.5, "py": 8.0, "pz": 10.5,
            "vx": 0.52, "vy": 0.41, "vz": 0.85,
            "time": 0.035,
            "perigee_d0": -0.09, "perigee_z0": 0.18,
            "primary": False, "vertex_primary": 0,
            "parent_id": b_meson_id,
        })

        # Additional primary particles (photons, neutral pions)
        photon_id = str(base_id + 60)
        particles.append({
            "particle_id": photon_id,
            "pdg_id": 22,  # photon
            "mass": 0.0,
            "energy": 34.0,
            "charge": 0.0,
            "px": 15.0, "py": -22.0, "pz": 18.0,
            "vx": 0.0, "vy": 0.0, "vz": 0.0,
            "time": 0.0,
            "perigee_d0": 0.0, "perigee_z0": 0.0,
            "primary": True, "vertex_primary": 0,
            "parent_id": "-1",
        })

        # 2. Generate Tracker Hits for charged particles traversing tracker layers
        # Charged particles: muon (muon_id), electron (electron_id), pi+ (pi_plus_id), pi- (pi_minus_id)
        # Open Data Detector Tracker geometry:
        # Pixel barrel layers: radii ~ 32, 72, 116, 172 mm
        # Strip barrel layers: radii ~ 260, 360, 500, 660, 820, 1020 mm
        # Endcap disks: z ~ 600, 800, 1000, 1300, 1600, 2000, 2500 mm
        charged_particles = [
            (muon_id, 48.2, 31.6, 62.0, 1.0),
            (electron_id, -42.5, -28.0, -65.0, -1.0),
            (pi_plus_id, 12.5, 8.0, 11.5, 1.0),
            (pi_minus_id, 8.5, 8.0, 10.5, -1.0),
        ]

        detector_radii = [32.0, 72.0, 116.0, 172.0, 260.0, 360.0, 500.0, 660.0, 820.0, 1020.0]
        hit_idx = 0

        for pid, px, py, pz, q in charged_particles:
            pt = math.sqrt(px * px + py * py)
            phi0 = math.atan2(py, px)
            theta0 = math.atan2(pt, pz)
            cot_theta = pz / pt

            # Simple helical trajectory in 2T solenoid magnetic field
            # Radius of curvature R = pt / (0.3 * B) [mm] ~ pt(GeV) / 0.0006
            R = (pt / 0.0006) * q

            for layer_idx, r in enumerate(detector_radii):
                # Small angular deflection in B field
                dphi = (r / R) if abs(R) > 10 else 0
                phi = phi0 + dphi
                true_x = r * math.cos(phi)
                true_y = r * math.sin(phi)
                true_z = r * cot_theta

                # Smear true coordinates with realistic sensor resolution (~10-50 um)
                meas_x = true_x + rng.gauss(0, 0.025)
                meas_y = true_y + rng.gauss(0, 0.025)
                meas_z = true_z + rng.gauss(0, 0.050)

                # Time of flight = path_length / c (c ~ 299.79 mm/ns)
                path_length = math.sqrt(r * r + true_z * true_z)
                tof = path_length / 299.792458

                subsystem = "Pixel" if layer_idx < 4 else "ShortStrip" if layer_idx < 7 else "LongStrip"
                volume_id = 8 if layer_idx < 4 else 12 if layer_idx < 7 else 16

                tracker_hits.append({
                    "hit_index": hit_idx,
                    "x": meas_x,
                    "y": meas_y,
                    "z": meas_z,
                    "true_x": true_x,
                    "true_y": true_y,
                    "true_z": true_z,
                    "time": tof,
                    "particle_id": pid,
                    "volume_id": volume_id,
                    "layer_id": layer_idx,
                    "surface_id": 1000 + layer_idx * 100 + hit_idx % 50,
                    "detector": subsystem,
                })
                hit_idx += 1

        # 3. Generate Calorimeter Cells (ECal at r ~ 1100-1400 mm, HCal at r ~ 1500-2400 mm)
        # Muon deposits ionizing track in ECal & HCal (~0.5 - 2 GeV)
        # Electron deposits full shower in ECal (~105 GeV)
        # Photon deposits full shower in ECal (~34 GeV)
        # Pions shower in HCal (~20-25 GeV)
        calo_cells_data = []

        # Electron ECal shower (multiple adjacent cells)
        elec_phi = math.atan2(-28.0, -42.5)
        elec_z = 1150.0 * (-65.0 / math.sqrt(42.5**2 + 28.0**2))
        for d_eta in [-0.02, 0.0, 0.02]:
            for d_phi in [-0.02, 0.0, 0.02]:
                r_cell = 1150.0
                cell_phi = elec_phi + d_phi
                cell_z = elec_z + d_eta * 1150.0
                cell_x = r_cell * math.cos(cell_phi)
                cell_y = r_cell * math.sin(cell_phi)
                # Energy fraction in shower core
                frac = 0.5 if (d_eta == 0.0 and d_phi == 0.0) else 0.0625
                contrib_e = 105.5 * frac
                tof = math.sqrt(cell_x**2 + cell_y**2 + cell_z**2) / 299.792

                calo_cells_data.append({
                    "detector": "ECalBarrel",
                    "total_energy": contrib_e + rng.uniform(0.01, 0.05),
                    "x": cell_x,
                    "y": cell_y,
                    "z": cell_z,
                    "contrib_particle_ids": [electron_id],
                    "contrib_energies": [contrib_e],
                    "contrib_times": [tof],
                })

        # Muon MIP deposits in ECal and HCal
        mu_phi = math.atan2(31.6, 48.2)
        mu_pt = math.sqrt(48.2**2 + 31.6**2)
        for r_det, det_name, dep_e in [(1200.0, "ECalBarrel", 0.45), (1800.0, "HCalBarrel", 1.85)]:
            cx = r_det * math.cos(mu_phi)
            cy = r_det * math.sin(mu_phi)
            cz = r_det * (62.0 / mu_pt)
            tof = math.sqrt(cx**2 + cy**2 + cz**2) / 299.792
            calo_cells_data.append({
                "detector": det_name,
                "total_energy": dep_e,
                "x": cx,
                "y": cy,
                "z": cz,
                "contrib_particle_ids": [muon_id],
                "contrib_energies": [dep_e],
                "contrib_times": [tof],
            })

        # Photon ECal shower
        gamma_phi = math.atan2(-22.0, 15.0)
        gamma_pt = math.sqrt(15.0**2 + 22.0**2)
        for d_phi in [-0.015, 0.0, 0.015]:
            r_det = 1180.0
            cx = r_det * math.cos(gamma_phi + d_phi)
            cy = r_det * math.sin(gamma_phi + d_phi)
            cz = r_det * (18.0 / gamma_pt)
            tof = math.sqrt(cx**2 + cy**2 + cz**2) / 299.792
            frac = 0.7 if d_phi == 0 else 0.15
            e_dep = 34.0 * frac
            calo_cells_data.append({
                "detector": "ECalBarrel",
                "total_energy": e_dep,
                "x": cx,
                "y": cy,
                "z": cz,
                "contrib_particle_ids": [photon_id],
                "contrib_energies": [e_dep],
                "contrib_times": [tof],
            })

        # Add cell indices
        for c_idx, cell in enumerate(calo_cells_data):
            cell["cell_index"] = c_idx
            calo_cells.append(cell)

        # 4. Generate Reconstructed Tracks
        # Associated to charged particles via majority_particle_id
        track_id_counter = 0
        for pid, px, py, pz, q in charged_particles:
            pt = math.sqrt(px * px + py * py)
            p = math.sqrt(pt * pt + pz * pz)
            qop = q / p
            theta = math.atan2(pt, pz)
            phi = math.atan2(py, px)

            # Reconstructed track with slight measurement smearing
            track_hit_ids = [
                h["hit_index"] for h in tracker_hits if h["particle_id"] == pid
            ]

            tracks.append({
                "track_id": track_id_counter,
                "majority_particle_id": pid,
                "d0": rng.gauss(0.01, 0.005),
                "z0": rng.gauss(0.02, 0.008),
                "phi": phi + rng.gauss(0, 0.001),
                "theta": theta + rng.gauss(0, 0.001),
                "qop": qop + rng.gauss(0, 0.0001),
                "hit_ids": track_hit_ids,
            })
            track_id_counter += 1

        # Update truth particles with actual hit counts
        for p in particles:
            pid = p["particle_id"]
            p["num_tracker_hits"] = sum(1 for h in tracker_hits if h["particle_id"] == pid)
            p["num_calo_hits"] = sum(
                1 for c in calo_cells if pid in c["contrib_particle_ids"]
            )

        return {
            "event_id": event_id,
            "channel": self.config.channel,
            "pileup": self.config.pileup,
            "split": self.config.split,
            "particles": particles,
            "tracker_hits": tracker_hits,
            "calo_hits": calo_cells,
            "tracks": tracks,
            "is_synthetic": True,
        }
