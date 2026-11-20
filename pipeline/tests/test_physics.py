"""Tests for physics calculations and derived quantities."""

import math
import pytest
from particle_trace.physics import (
    calculate_momentum,
    calculate_transverse_momentum,
    calculate_phi,
    calculate_pseudorapidity,
    calculate_track_momentum,
    calculate_track_transverse_momentum,
    calculate_track_pseudorapidity,
    calculate_tracker_displacement,
    calculate_calo_summary,
    calculate_track_hit_purity,
    lookup_pdg,
)


def test_truth_momentum_calculations():
    # 3-4-12 triangle -> sqrt(9 + 16 + 144) = sqrt(169) = 13
    px, py, pz = 3.0, 4.0, 12.0
    p = calculate_momentum(px, py, pz)
    assert pytest.approx(p) == 13.0

    pt = calculate_transverse_momentum(px, py)
    assert pytest.approx(pt) == 5.0

    phi = calculate_phi(px, py)
    assert pytest.approx(phi) == math.atan2(4.0, 3.0)

    # eta = asinh(pz / pt) = asinh(12 / 5) = asinh(2.4) = ln(2.4 + sqrt(2.4^2 + 1))
    eta = calculate_pseudorapidity(pz, pt)
    assert eta is not None
    assert pytest.approx(eta) == math.asinh(2.4)


def test_pseudorapidity_edge_cases():
    # pt = 0 along beam axis
    assert calculate_pseudorapidity(10.0, 0.0) is None
    assert calculate_pseudorapidity(0.0, 0.0) == 0.0


def test_track_derived_quantities():
    # qop = 0.1 (p = 10 GeV/c), theta = pi / 6 (30 deg)
    qop = 0.1
    theta = math.pi / 6.0

    p = calculate_track_momentum(qop)
    assert p is not None
    assert pytest.approx(p) == 10.0

    pt = calculate_track_transverse_momentum(qop, theta)
    assert pt is not None
    assert pytest.approx(pt) == 10.0 * math.sin(math.pi / 6.0)

    # eta = -ln(tan(theta / 2))
    eta = calculate_track_pseudorapidity(theta)
    assert eta is not None
    assert pytest.approx(eta) == -math.log(math.tan(math.pi / 12.0))

    # Invalid qop
    assert calculate_track_momentum(0.0) is None
    assert calculate_track_transverse_momentum(0.0, theta) is None

    # Invalid theta
    assert calculate_track_pseudorapidity(0.0) is None
    assert calculate_track_pseudorapidity(math.pi) is None


def test_tracker_displacement():
    disp = calculate_tracker_displacement(10.0, 20.0, 30.0, 10.03, 19.96, 30.0)
    assert pytest.approx(disp["dx"]) == -0.03
    assert pytest.approx(disp["dy"]) == 0.04
    assert pytest.approx(disp["dz"]) == 0.0
    assert pytest.approx(disp["dr"]) == 0.05  # sqrt((-0.03)^2 + 0.04^2)


def test_calo_summary():
    energies = [2.0, 4.0, 4.0]
    times = [10.0, 20.0, 30.0]
    # total = 10.0 GeV
    # weighted time = (2*10 + 4*20 + 4*30) / 10 = (20 + 80 + 120) / 10 = 22.0 ns
    res = calculate_calo_summary(energies, times)
    assert pytest.approx(res["total_energy"]) == 10.0
    assert res["num_cells"] == 3
    assert pytest.approx(res["mean_weighted_time"]) == 22.0
    assert pytest.approx(res["min_time"]) == 10.0
    assert pytest.approx(res["max_time"]) == 30.0

    # Empty summary
    empty_res = calculate_calo_summary([], [])
    assert empty_res["total_energy"] == 0.0
    assert empty_res["num_cells"] == 0
    assert empty_res["mean_weighted_time"] is None


def test_track_hit_purity():
    assert calculate_track_hit_purity(8, 10) == 0.8
    assert calculate_track_hit_purity(0, 0) is None


def test_pdg_lookup():
    muon = lookup_pdg(13)
    assert muon["name"] == "mu-"
    assert muon["charge"] == -1.0
    assert muon["class"] == "lepton"

    top = lookup_pdg(6)
    assert top["name"] == "t"
    assert pytest.approx(top["charge"]) == 2/3

    unknown = lookup_pdg(999999)
    assert "999999" in unknown["name"]
