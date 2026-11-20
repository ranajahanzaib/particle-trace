"""Export utilities for serialized EventBundle objects."""

import gzip
import json
from pathlib import Path
from typing import Any, Dict, List
from particle_trace.manifest import (
    ConfigManifest,
    DatasetManifest,
    EventSummary,
    generate_config_manifest,
    generate_dataset_manifest,
)
from particle_trace.schema import EventBundle


def serialize_bundle(bundle: EventBundle) -> str:
    """Serialize an EventBundle to formatted JSON string."""
    return bundle.model_dump_json(indent=2)


def save_bundle_json(bundle: EventBundle, output_path: Path, compress: bool = False) -> Path:
    """Save an EventBundle to JSON or compressed gzip file."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    json_bytes = bundle.model_dump_json().encode("utf-8")

    if compress or output_path.suffix == ".gz":
        final_path = output_path if output_path.suffix == ".gz" else output_path.with_suffix(".json.gz")
        with gzip.open(final_path, "wb") as f:
            f.write(json_bytes)
        return final_path

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(bundle.model_dump_json(indent=2))
    return output_path


def export_configuration_bundle(
    bundles: List[EventBundle],
    output_dir: Path,
    configuration_name: str,
    channel: str,
    pileup: str,
    compress_events: bool = False,
) -> ConfigManifest:
    """Export all events and configuration manifest into structured directory."""
    config_dir = output_dir / configuration_name
    events_dir = config_dir / "events"
    events_dir.mkdir(parents=True, exist_ok=True)

    summaries: List[EventSummary] = []

    for bundle in bundles:
        event_id = bundle.source.eventId
        summaries.append(
            EventSummary(
                eventId=event_id,
                particleCount=bundle.counts.particles,
                trackerHitCount=bundle.counts.trackerHits,
                calorimeterCellCount=bundle.counts.calorimeterCells,
                trackCount=bundle.counts.tracks,
            )
        )

        event_filename = f"{event_id}.json.gz" if compress_events else f"{event_id}.json"
        save_bundle_json(bundle, events_dir / event_filename, compress=compress_events)

    config_manifest = generate_config_manifest(
        configuration=configuration_name,
        channel=channel,
        pileup=pileup,
        events=summaries,
    )

    manifest_path = config_dir / "manifest.json"
    with open(manifest_path, "w", encoding="utf-8") as f:
        f.write(config_manifest.model_dump_json(indent=2))

    return config_manifest
