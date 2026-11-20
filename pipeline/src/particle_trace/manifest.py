"""Dataset and configuration manifest generation."""

from datetime import datetime, timezone
from typing import Any, Dict, List
from pydantic import BaseModel


class EventSummary(BaseModel):
    """Summary record for an event in configuration manifest."""
    eventId: int
    particleCount: int
    trackerHitCount: int
    calorimeterCellCount: int
    trackCount: int


class ConfigManifest(BaseModel):
    """Manifest for a specific configuration, e.g. ttbar_pu0."""
    configuration: str
    channel: str
    pileup: str
    eventCount: int
    events: List[EventSummary]
    updatedAt: str


class DatasetManifest(BaseModel):
    """Top-level dataset manifest listing available configurations."""
    dataset: str = "CERN/ColliderML-Release-1"
    release: str = "Release 1"
    description: str = (
        "Simulated high-energy physics collision events across truth particles, "
        "tracker measurements, calorimeter cells, and reconstructed tracks."
    )
    citation: str = "CERN ColliderML Collaboration (2024). ColliderML Release 1. Hugging Face."
    license: str = "CC-BY-4.0"
    configurations: List[str]
    totalEvents: int
    updatedAt: str


def generate_config_manifest(
    configuration: str, channel: str, pileup: str, events: List[EventSummary]
) -> ConfigManifest:
    """Generate configuration manifest."""
    return ConfigManifest(
        configuration=configuration,
        channel=channel,
        pileup=pileup,
        eventCount=len(events),
        events=events,
        updatedAt=datetime.now(timezone.utc).isoformat(),
    )


def generate_dataset_manifest(
    configurations: List[str], total_events: int
) -> DatasetManifest:
    """Generate top-level dataset manifest."""
    return DatasetManifest(
        configurations=configurations,
        totalEvents=total_events,
        updatedAt=datetime.now(timezone.utc).isoformat(),
    )
