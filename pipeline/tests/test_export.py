"""Tests for bundle serialization, export, and round-trip parsing."""

import json
from pathlib import Path
from particle_trace.config import PipelineConfig
from particle_trace.dataset import DatasetLoader
from particle_trace.export import export_configuration_bundle
from particle_trace.normalization import normalize_event
from particle_trace.schema import EventBundle


def test_export_roundtrip(tmp_path: Path):
    config = PipelineConfig(
        channel="ttbar",
        pileup="pu0",
        max_events=2,
        output_dir=tmp_path / "processed",
    )
    loader = DatasetLoader(config)
    raw_events = loader.generate_synthetic_events(2)

    bundles = [normalize_event(raw, config) for raw in raw_events]
    assert len(bundles) == 2

    manifest = export_configuration_bundle(
        bundles=bundles,
        output_dir=config.output_dir,
        configuration_name=config.configuration_name,
        channel=config.channel,
        pileup=config.pileup,
        compress_events=False,
    )

    assert manifest.eventCount == 2
    event_file = config.output_dir / "ttbar_pu0" / "events" / "0.json"
    assert event_file.exists()

    with open(event_file, "r", encoding="utf-8") as f:
        loaded_dict = json.load(f)

    # Validate that schema parses back correctly
    bundle_loaded = EventBundle.model_validate(loaded_dict)
    assert bundle_loaded.source.eventId == 0
    assert bundle_loaded.counts.particles > 0
    assert len(bundle_loaded.particles) == bundle_loaded.counts.particles
    # Check 64-bit ID string preserved
    first_pid = bundle_loaded.particles[0].particle_id
    assert isinstance(first_pid, str)
    assert len(first_pid) >= 16  # >= 10^15
