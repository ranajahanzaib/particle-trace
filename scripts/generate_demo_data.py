#!/usr/bin/env python3
"""Generate deterministic demo event fixtures for Particle Trace.

Produces:
1. data/fixtures/manifest.json
2. data/fixtures/ttbar_pu0/manifest.json
3. data/fixtures/ttbar_pu0/events/{0,1,2}.json
and copies them into apps/web/public/data/ for standalone offline execution.
"""

import json
import math
import random
from pathlib import Path

# Add pipeline/src to sys.path
import sys
pipeline_src = Path(__file__).resolve().parent.parent / "pipeline" / "src"
sys.path.insert(0, str(pipeline_src))

from particle_trace.config import PipelineConfig
from particle_trace.dataset import DatasetLoader
from particle_trace.export import export_configuration_bundle
from particle_trace.manifest import generate_dataset_manifest
from particle_trace.normalization import normalize_event


def main():
    root = Path(__file__).resolve().parent.parent
    fixtures_dir = root / "data" / "fixtures"
    public_data_dir = root / "apps" / "web" / "public" / "data"

    print(f"Generating demonstration fixtures in {fixtures_dir} and {public_data_dir}")

    config = PipelineConfig(
        channel="ttbar",
        pileup="pu0",
        max_events=3,
    )
    loader = DatasetLoader(config)
    raw_events = loader.generate_synthetic_events(3)

    bundles = [normalize_event(raw, config) for raw in raw_events]

    # Export to data/fixtures
    export_configuration_bundle(
        bundles=bundles,
        output_dir=fixtures_dir,
        configuration_name=config.configuration_name,
        channel=config.channel,
        pileup=config.pileup,
        compress_events=False,
    )
    top_manifest = generate_dataset_manifest(
        configurations=[config.configuration_name],
        total_events=len(bundles),
    )
    with open(fixtures_dir / "manifest.json", "w", encoding="utf-8") as f:
        f.write(top_manifest.model_dump_json(indent=2))

    # Also export to apps/web/public/data for frontend static demo mode
    export_configuration_bundle(
        bundles=bundles,
        output_dir=public_data_dir,
        configuration_name=config.configuration_name,
        channel=config.channel,
        pileup=config.pileup,
        compress_events=False,
    )
    with open(public_data_dir / "manifest.json", "w", encoding="utf-8") as f:
        f.write(top_manifest.model_dump_json(indent=2))

    print(f"Successfully generated {len(bundles)} events in fixtures and public data.")


if __name__ == "__main__":
    main()
