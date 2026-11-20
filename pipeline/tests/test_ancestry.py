"""Tests for ancestry hierarchy and graph traversal."""

from particle_trace.ancestry import AncestryGraph


def test_ancestry_graph_dag():
    particles = [
        {"particle_id": "1", "parent_id": "-1", "name": "Top", "pdg_id": 6},
        {"particle_id": "2", "parent_id": "1", "name": "W+", "pdg_id": 24},
        {"particle_id": "3", "parent_id": "1", "name": "b", "pdg_id": 5},
        {"particle_id": "4", "parent_id": "2", "name": "mu+", "pdg_id": -13},
        {"particle_id": "5", "parent_id": "2", "name": "nu_mu", "pdg_id": 14},
    ]

    ag = AncestryGraph(particles)
    assert ag.is_dag
    assert len(ag.warnings) == 0

    assert ag.get_parent_id("4") == "2"
    assert ag.get_parent_id("2") == "1"
    assert ag.get_parent_id("1") is None

    assert set(ag.get_children_ids("1")) == {"2", "3"}
    assert set(ag.get_children_ids("2")) == {"4", "5"}
    assert ag.get_children_ids("4") == []

    assert set(ag.get_ancestors_ids("4")) == {"1", "2"}
    assert set(ag.get_descendants_ids("1")) == {"2", "3", "4", "5"}

    # Test lineage subgraph around particle 2
    subgraph = ag.get_lineage_subgraph("2")
    assert subgraph["target_id"] == "2"
    node_ids = {n["id"] for n in subgraph["nodes"]}
    assert node_ids == {"1", "2", "4", "5"}


def test_ancestry_graph_cycle_detection():
    # Synthetic malformed cycle: 1 -> 2 -> 3 -> 1
    particles = [
        {"particle_id": "1", "parent_id": "3", "name": "P1"},
        {"particle_id": "2", "parent_id": "1", "name": "P2"},
        {"particle_id": "3", "parent_id": "2", "name": "P3"},
    ]
    ag = AncestryGraph(particles)
    assert not ag.is_dag
    assert any("cycles" in w for w in ag.warnings)


def test_ancestry_orphan_parent():
    particles = [
        {"particle_id": "10", "parent_id": "999", "name": "Child"},
    ]
    ag = AncestryGraph(particles)
    assert any("nonexistent parent 999" in w for w in ag.warnings)
