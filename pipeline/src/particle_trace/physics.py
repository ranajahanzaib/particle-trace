"""Scientific calculations and physical derived quantities for Particle Trace.

All calculations follow CERN ColliderML Release 1 and standard particle physics
conventions. Derived quantities document their physical meaning and bounds.
"""

import math
from typing import Dict, List, Optional, Tuple, Any

# Standard PDG ID table mapping to human-readable names and rest properties
PDG_TABLE: Dict[int, Dict[str, Any]] = {
    # Quarks
    1: {"name": "d", "full_name": "down quark", "charge": -1/3, "class": "quark"},
    -1: {"name": "d~", "full_name": "anti-down quark", "charge": 1/3, "class": "quark"},
    2: {"name": "u", "full_name": "up quark", "charge": 2/3, "class": "quark"},
    -2: {"name": "u~", "full_name": "anti-up quark", "charge": -2/3, "class": "quark"},
    3: {"name": "s", "full_name": "strange quark", "charge": -1/3, "class": "quark"},
    -3: {"name": "s~", "full_name": "anti-strange quark", "charge": 1/3, "class": "quark"},
    4: {"name": "c", "full_name": "charm quark", "charge": 2/3, "class": "quark"},
    -4: {"name": "c~", "full_name": "anti-charm quark", "charge": -2/3, "class": "quark"},
    5: {"name": "b", "full_name": "bottom quark", "charge": -1/3, "class": "quark"},
    -5: {"name": "b~", "full_name": "anti-bottom quark", "charge": 1/3, "class": "quark"},
    6: {"name": "t", "full_name": "top quark", "charge": 2/3, "class": "quark"},
    -6: {"name": "t~", "full_name": "anti-top quark", "charge": -2/3, "class": "quark"},
    # Leptons
    11: {"name": "e-", "full_name": "electron", "charge": -1.0, "class": "lepton"},
    -11: {"name": "e+", "full_name": "positron", "charge": 1.0, "class": "lepton"},
    12: {"name": "nu_e", "full_name": "electron neutrino", "charge": 0.0, "class": "neutrino"},
    -12: {"name": "nu_e~", "full_name": "anti-electron neutrino", "charge": 0.0, "class": "neutrino"},
    13: {"name": "mu-", "full_name": "muon", "charge": -1.0, "class": "lepton"},
    -13: {"name": "mu+", "full_name": "anti-muon", "charge": 1.0, "class": "lepton"},
    14: {"name": "nu_mu", "full_name": "muon neutrino", "charge": 0.0, "class": "neutrino"},
    -14: {"name": "nu_mu~", "full_name": "anti-muon neutrino", "charge": 0.0, "class": "neutrino"},
    15: {"name": "tau-", "full_name": "tau", "charge": -1.0, "class": "lepton"},
    -15: {"name": "tau+", "full_name": "anti-tau", "charge": 1.0, "class": "lepton"},
    16: {"name": "nu_tau", "full_name": "tau neutrino", "charge": 0.0, "class": "neutrino"},
    -16: {"name": "nu_tau~", "full_name": "anti-tau neutrino", "charge": 0.0, "class": "neutrino"},
    # Gauge & Higgs bosons
    21: {"name": "g", "full_name": "gluon", "charge": 0.0, "class": "gauge_boson"},
    22: {"name": "gamma", "full_name": "photon", "charge": 0.0, "class": "gauge_boson"},
    23: {"name": "Z0", "full_name": "Z boson", "charge": 0.0, "class": "gauge_boson"},
    24: {"name": "W+", "full_name": "W+ boson", "charge": 1.0, "class": "gauge_boson"},
    -24: {"name": "W-", "full_name": "W- boson", "charge": -1.0, "class": "gauge_boson"},
    25: {"name": "H0", "full_name": "Higgs boson", "charge": 0.0, "class": "higgs"},
    # Light Mesons
    111: {"name": "pi0", "full_name": "neutral pion", "charge": 0.0, "class": "meson"},
    211: {"name": "pi+", "full_name": "positive pion", "charge": 1.0, "class": "meson"},
    -211: {"name": "pi-", "full_name": "negative pion", "charge": -1.0, "class": "meson"},
    130: {"name": "K(L)0", "full_name": "K-long meson", "charge": 0.0, "class": "meson"},
    310: {"name": "K(S)0", "full_name": "K-short meson", "charge": 0.0, "class": "meson"},
    311: {"name": "K0", "full_name": "neutral kaon", "charge": 0.0, "class": "meson"},
    -311: {"name": "K0~", "full_name": "anti-neutral kaon", "charge": 0.0, "class": "meson"},
    321: {"name": "K+", "full_name": "positive kaon", "charge": 1.0, "class": "meson"},
    -321: {"name": "K-", "full_name": "negative kaon", "charge": -1.0, "class": "meson"},
    221: {"name": "eta", "full_name": "eta meson", "charge": 0.0, "class": "meson"},
    331: {"name": "eta'", "full_name": "eta prime meson", "charge": 0.0, "class": "meson"},
    113: {"name": "rho0", "full_name": "rho(770) neutral", "charge": 0.0, "class": "meson"},
    213: {"name": "rho+", "full_name": "rho(770) positive", "charge": 1.0, "class": "meson"},
    -213: {"name": "rho-", "full_name": "rho(770) negative", "charge": -1.0, "class": "meson"},
    223: {"name": "omega", "full_name": "omega(782) meson", "charge": 0.0, "class": "meson"},
    333: {"name": "phi", "full_name": "phi(1020) meson", "charge": 0.0, "class": "meson"},
    # Charmed & Bottom Mesons
    411: {"name": "D+", "full_name": "D+ meson", "charge": 1.0, "class": "meson"},
    -411: {"name": "D-", "full_name": "D- meson", "charge": -1.0, "class": "meson"},
    421: {"name": "D0", "full_name": "D0 meson", "charge": 0.0, "class": "meson"},
    -421: {"name": "D0~", "full_name": "anti-D0 meson", "charge": 0.0, "class": "meson"},
    431: {"name": "Ds+", "full_name": "Ds+ meson", "charge": 1.0, "class": "meson"},
    -431: {"name": "Ds-", "full_name": "Ds- meson", "charge": -1.0, "class": "meson"},
    443: {"name": "J/psi", "full_name": "J/psi meson", "charge": 0.0, "class": "meson"},
    511: {"name": "B0", "full_name": "B0 meson", "charge": 0.0, "class": "meson"},
    -511: {"name": "B0~", "full_name": "anti-B0 meson", "charge": 0.0, "class": "meson"},
    521: {"name": "B+", "full_name": "B+ meson", "charge": 1.0, "class": "meson"},
    -521: {"name": "B-", "full_name": "B- meson", "charge": -1.0, "class": "meson"},
    531: {"name": "Bs0", "full_name": "Bs0 meson", "charge": 0.0, "class": "meson"},
    -531: {"name": "Bs0~", "full_name": "anti-Bs0 meson", "charge": 0.0, "class": "meson"},
    553: {"name": "Upsilon", "full_name": "Upsilon(1S)", "charge": 0.0, "class": "meson"},
    # Baryons
    2212: {"name": "p", "full_name": "proton", "charge": 1.0, "class": "baryon"},
    -2212: {"name": "p~", "full_name": "anti-proton", "charge": -1.0, "class": "baryon"},
    2112: {"name": "n", "full_name": "neutron", "charge": 0.0, "class": "baryon"},
    -2112: {"name": "n~", "full_name": "anti-neutron", "charge": 0.0, "class": "baryon"},
    3122: {"name": "Lambda0", "full_name": "Lambda baryon", "charge": 0.0, "class": "baryon"},
    -3122: {"name": "Lambda0~", "full_name": "anti-Lambda baryon", "charge": 0.0, "class": "baryon"},
    3222: {"name": "Sigma+", "full_name": "Sigma+ baryon", "charge": 1.0, "class": "baryon"},
    3212: {"name": "Sigma0", "full_name": "Sigma0 baryon", "charge": 0.0, "class": "baryon"},
    3112: {"name": "Sigma-", "full_name": "Sigma- baryon", "charge": -1.0, "class": "baryon"},
    3322: {"name": "Xi0", "full_name": "Xi0 baryon", "charge": 0.0, "class": "baryon"},
    3312: {"name": "Xi-", "full_name": "Xi- baryon", "charge": -1.0, "class": "baryon"},
    3334: {"name": "Omega-", "full_name": "Omega- baryon", "charge": -1.0, "class": "baryon"},
}


def lookup_pdg(pdg_id: int) -> Dict[str, Any]:
    """Resolve a PDG identifier to particle name and classification."""
    if pdg_id in PDG_TABLE:
        return PDG_TABLE[pdg_id]
    # Generic fallback
    return {
        "name": f"PDG:{pdg_id}",
        "full_name": f"Unknown particle ({pdg_id})",
        "charge": 0.0,
        "class": "unknown",
    }


def calculate_momentum(px: float, py: float, pz: float) -> float:
    """Total momentum: p = sqrt(px^2 + py^2 + pz^2) in GeV/c."""
    return math.sqrt(px * px + py * py + pz * pz)


def calculate_transverse_momentum(px: float, py: float) -> float:
    """Transverse momentum: pt = sqrt(px^2 + py^2) in GeV/c."""
    return math.sqrt(px * px + py * py)


def calculate_phi(px: float, py: float) -> float:
    """Azimuthal angle: phi = atan2(py, px) in radians, range [-pi, pi]."""
    return math.atan2(py, px)


def calculate_pseudorapidity(pz: float, pt: float) -> Optional[float]:
    """Pseudorapidity: eta = asinh(pz / pt).

    Returns None if pt is 0 or invalid (e.g. infinite pseudorapidity along beam axis).
    """
    if pt <= 1e-12:
        if abs(pz) < 1e-12:
            return 0.0
        # Particle is strictly colinear with z axis; pseudorapidity diverges
        return None
    try:
        return math.asinh(pz / pt)
    except (ValueError, OverflowError):
        return None


def calculate_track_momentum(qop: float) -> Optional[float]:
    """Reconstructed track total momentum: p = |1 / qop| in GeV/c.

    qop is charge divided by momentum (e / GeV).
    Returns None if qop is zero or invalid.
    """
    if abs(qop) <= 1e-12:
        return None
    return abs(1.0 / qop)


def calculate_track_transverse_momentum(qop: float, theta: float) -> Optional[float]:
    """Reconstructed track transverse momentum: pt = |1 / qop| * sin(theta) in GeV/c.

    Returns None if qop is zero or theta is invalid.
    """
    p = calculate_track_momentum(qop)
    if p is None:
        return None
    return p * math.sin(theta)


def calculate_track_pseudorapidity(theta: float) -> Optional[float]:
    """Reconstructed track pseudorapidity: eta = -ln(tan(theta / 2)).

    theta is polar angle in radians.
    Returns None if theta <= 0 or theta >= pi.
    """
    if theta <= 1e-12 or theta >= (math.pi - 1e-12):
        return None
    try:
        val = math.tan(theta / 2.0)
        if val <= 1e-12:
            return None
        return -math.log(val)
    except (ValueError, OverflowError):
        return None


def calculate_tracker_displacement(
    x: float, y: float, z: float, true_x: float, true_y: float, true_z: float
) -> Dict[str, float]:
    """Compute tracker measurement displacement: measured - true in mm.

    Returns dx, dy, dz, and 3D Euclidean residual dr.
    """
    dx = x - true_x
    dy = y - true_y
    dz = z - true_z
    dr = math.sqrt(dx * dx + dy * dy + dz * dz)
    return {
        "dx": dx,
        "dy": dy,
        "dz": dz,
        "dr": dr,
    }


def calculate_calo_summary(
    energies: List[float], times: List[float]
) -> Dict[str, Any]:
    """Calculate calorimeter contribution summary for a selected particle.

    Computes:
    - total_energy: sum of energies contributed by this particle (GeV)
    - num_cells: number of cells with contribution
    - mean_weighted_time: energy-weighted average time (ns)
    - min_time: earliest contribution time (ns)
    - max_time: latest contribution time (ns)
    """
    if not energies:
        return {
            "total_energy": 0.0,
            "num_cells": 0,
            "mean_weighted_time": None,
            "min_time": None,
            "max_time": None,
        }

    total_e = sum(energies)
    num_cells = len(energies)

    weighted_time_sum = 0.0
    for e, t in zip(energies, times):
        weighted_time_sum += e * t

    mean_time = (weighted_time_sum / total_e) if total_e > 1e-12 else None
    min_time = min(times) if times else None
    max_time = max(times) if times else None

    return {
        "total_energy": total_e,
        "num_cells": num_cells,
        "mean_weighted_time": mean_time,
        "min_time": min_time,
        "max_time": max_time,
    }


def calculate_track_hit_purity(
    associated_particle_hits: int, total_valid_track_hits: int
) -> Optional[float]:
    """Calculate derived hit purity: associated_hits / total_valid_track_hits.

    Only returned when track-hit ID semantics have been validated.
    """
    if total_valid_track_hits <= 0:
        return None
    return associated_particle_hits / total_valid_track_hits
