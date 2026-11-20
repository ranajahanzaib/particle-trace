"""Particle ancestry hierarchy construction and graph traversal using NetworkX.

Builds directed ancestry graphs from event particle parent_id relationships,
validates against cycles and broken references, and extracts subgraphs for
investigating individual particle lineages.
"""

from typing import Any, Dict, List, Optional, Set, Tuple
import networkx as nx


class AncestryGraph:
    """Ancestry relationship manager for an event's truth particles."""

    def __init__(self, particles: List[Dict[str, Any]]):
        """Construct the ancestry graph from particle list.

        Each particle dict must contain 'particle_id' and 'parent_id' (strings).
        """
        self.particles_by_id: Dict[str, Dict[str, Any]] = {
            p["particle_id"]: p for p in particles
        }
        self.graph = nx.DiGraph()
        self.warnings: List[str] = []
        self._build_graph(particles)

    def _build_graph(self, particles: List[Dict[str, Any]]) -> None:
        """Add nodes and parent->child edges."""
        # Add all nodes first
        for p in particles:
            pid = str(p["particle_id"])
            self.graph.add_node(
                pid,
                pdg_id=p.get("pdg_id"),
                primary=p.get("primary", False),
                pt=p.get("pt"),
                name=p.get("name", "Unknown"),
            )

        # Add directed edges from parent to child
        for p in particles:
            pid = str(p["particle_id"])
            parent_id = str(p.get("parent_id", "-1"))

            # "-1" or empty indicates primary or root particle
            if parent_id in ("-1", "", "None", "null"):
                continue

            if parent_id not in self.particles_by_id:
                self.warnings.append(
                    f"Particle {pid} references nonexistent parent {parent_id}"
                )
                # Still add the edge to an external node so lineage isn't lost
                if not self.graph.has_node(parent_id):
                    self.graph.add_node(parent_id, name="External Parent", external=True)
                self.graph.add_edge(parent_id, pid)
            else:
                self.graph.add_edge(parent_id, pid)

        # Check for cycles
        if not nx.is_directed_acyclic_graph(self.graph):
            cycles = list(nx.simple_cycles(self.graph))
            self.warnings.append(f"Ancestry graph contains cycles: {cycles}")

    @property
    def is_dag(self) -> bool:
        """Check if ancestry graph is a valid DAG."""
        return nx.is_directed_acyclic_graph(self.graph)

    def get_parent_id(self, particle_id: str) -> Optional[str]:
        """Return immediate parent ID or None."""
        particle_id = str(particle_id)
        if not self.graph.has_node(particle_id):
            return None
        predecessors = list(self.graph.predecessors(particle_id))
        return predecessors[0] if predecessors else None

    def get_children_ids(self, particle_id: str) -> List[str]:
        """Return list of immediate child particle IDs."""
        particle_id = str(particle_id)
        if not self.graph.has_node(particle_id):
            return []
        return list(self.graph.successors(particle_id))

    def get_ancestors_ids(self, particle_id: str) -> List[str]:
        """Return all ancestor IDs (parent, grandparent, etc.)."""
        particle_id = str(particle_id)
        if not self.graph.has_node(particle_id):
            return []
        try:
            return list(nx.ancestors(self.graph, particle_id))
        except Exception:
            return []

    def get_descendants_ids(self, particle_id: str) -> List[str]:
        """Return all descendant IDs (children, grandchildren, etc.)."""
        particle_id = str(particle_id)
        if not self.graph.has_node(particle_id):
            return []
        try:
            return list(nx.descendants(self.graph, particle_id))
        except Exception:
            return []

    def get_lineage_subgraph(
        self, particle_id: str, max_depth: int = 3
    ) -> Dict[str, Any]:
        """Extract a structured lineage tree centered around particle_id.

        Returns nodes and edges suitable for frontend tree/graph rendering.
        """
        particle_id = str(particle_id)
        if not self.graph.has_node(particle_id):
            return {
                "nodes": [],
                "edges": [],
                "root_ids": [],
                "target_id": particle_id,
                "warnings": [f"Particle {particle_id} not in ancestry graph"],
            }

        ancestor_ids = set(self.get_ancestors_ids(particle_id))
        descendant_ids = set(self.get_descendants_ids(particle_id))
        relevant_ids = ancestor_ids | descendant_ids | {particle_id}

        subgraph_nodes = []
        for nid in relevant_ids:
            p_data = self.particles_by_id.get(nid, {})
            node_info = {
                "id": nid,
                "label": p_data.get("name", f"ID {nid}"),
                "pdg_id": p_data.get("pdg_id"),
                "charge": p_data.get("charge"),
                "pt": p_data.get("pt"),
                "energy": p_data.get("energy"),
                "primary": p_data.get("primary", False),
                "is_target": (nid == particle_id),
                "is_ancestor": (nid in ancestor_ids),
                "is_descendant": (nid in descendant_ids),
            }
            subgraph_nodes.append(node_info)

        subgraph_edges = []
        for u, v in self.graph.edges():
            if u in relevant_ids and v in relevant_ids:
                subgraph_edges.append({"source": u, "target": v})

        # Identify roots of this subgraph (nodes with no predecessors in relevant_ids)
        roots = [
            nid for nid in relevant_ids
            if not any(src in relevant_ids for src in self.graph.predecessors(nid))
        ]

        return {
            "nodes": subgraph_nodes,
            "edges": subgraph_edges,
            "root_ids": roots,
            "target_id": particle_id,
            "warnings": self.warnings,
        }
