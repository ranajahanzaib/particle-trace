"""Command-line interface for Particle Trace pipeline."""

import argparse
import json
import logging
from pathlib import Path
import sys
from typing import List

from particle_trace.config import PipelineConfig
from particle_trace.dataset import DatasetLoader
from particle_trace.export import export_configuration_bundle, save_bundle_json
from particle_trace.manifest import generate_dataset_manifest
from particle_trace.normalization import normalize_event
from particle_trace.schema import EventBundle
from particle_trace.storage import R2StoragePublisher

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("particle_trace")


def generate_fixtures_command(args: argparse.Namespace) -> int:
    """Generate deterministic fixtures for offline demonstration and testing."""
    config = PipelineConfig(
        channel=args.channel,
        pileup=args.pileup,
        max_events=args.events,
    )
    fixtures_dir = Path(args.output_dir)
    logger.info(f"Generating {args.events} demonstration fixtures in {fixtures_dir}")

    loader = DatasetLoader(config)
    raw_events = loader.generate_synthetic_events(args.events)

    bundles: List[EventBundle] = []
    for raw in raw_events:
        bundle = normalize_event(raw, config)
        bundles.append(bundle)

    # Export to fixtures directory
    export_configuration_bundle(
        bundles=bundles,
        output_dir=fixtures_dir,
        configuration_name=config.configuration_name,
        channel=config.channel,
        pileup=config.pileup,
        compress_events=False,
    )

    # Top level manifest
    top_manifest = generate_dataset_manifest(
        configurations=[config.configuration_name],
        total_events=len(bundles),
    )
    with open(fixtures_dir / "manifest.json", "w", encoding="utf-8") as f:
        f.write(top_manifest.model_dump_json(indent=2))

    logger.info(f"Successfully generated fixtures: {len(bundles)} events in {fixtures_dir}")
    return 0


def ingest_command(args: argparse.Namespace) -> int:
    """Ingest events from ColliderML or generate processed event bundles."""
    config = PipelineConfig(
        channel=args.channel,
        pileup=args.pileup,
        max_events=args.events,
        output_dir=Path(args.output_dir),
    )
    logger.info(
        f"Ingesting {config.configuration_name} (max {args.events} events) into {config.output_dir}"
    )

    loader = DatasetLoader(config)
    raw_events = loader.load_events(args.events)

    bundles: List[EventBundle] = []
    for raw in raw_events:
        bundle = normalize_event(raw, config)
        bundles.append(bundle)

    export_configuration_bundle(
        bundles=bundles,
        output_dir=config.output_dir,
        configuration_name=config.configuration_name,
        channel=config.channel,
        pileup=config.pileup,
        compress_events=args.compress,
    )

    top_manifest = generate_dataset_manifest(
        configurations=[config.configuration_name],
        total_events=len(bundles),
    )
    with open(config.output_dir / "manifest.json", "w", encoding="utf-8") as f:
        f.write(top_manifest.model_dump_json(indent=2))

    logger.info(f"Processed and exported {len(bundles)} events.")
    return 0


def validate_command(args: argparse.Namespace) -> int:
    """Validate processed event bundles and check data quality reports."""
    target_dir = Path(args.target_dir)
    logger.info(f"Validating processed event bundles in {target_dir}")

    event_files = list(target_dir.glob("**/events/*.json")) + list(
        target_dir.glob("**/events/*.json.gz")
    )
    if not event_files:
        logger.warning(f"No event bundle files found in {target_dir}")
        return 1

    error_count = 0
    warning_count = 0

    for ef in event_files:
        try:
            with open(ef, "r", encoding="utf-8") as f:
                data = json.load(f)
            bundle = EventBundle.model_validate(data)

            for diag in bundle.diagnostics:
                if diag.severity == "error":
                    error_count += 1
                    logger.error(f"[{ef.name}] {diag.code}: {diag.message}")
                elif diag.severity == "warning":
                    warning_count += 1
                    logger.warning(f"[{ef.name}] {diag.code}: {diag.message}")

            logger.info(
                f"Event {bundle.source.eventId} valid: "
                f"{bundle.counts.particles} particles, {bundle.counts.trackerHits} hits, "
                f"{bundle.counts.calorimeterCells} cells, {bundle.counts.tracks} tracks"
            )
        except Exception as e:
            error_count += 1
            logger.error(f"Failed to validate {ef}: {e}")

    logger.info(f"Validation complete: {error_count} errors, {warning_count} warnings.")
    return 1 if error_count > 0 else 0


def publish_command(args: argparse.Namespace) -> int:
    """Publish processed bundles to Cloudflare R2."""
    config = PipelineConfig(
        output_dir=Path(args.target_dir),
        r2_bucket=args.bucket,
        r2_endpoint_url=args.endpoint,
    )
    logger.info(f"Publishing {config.output_dir} to Cloudflare R2 bucket: {config.r2_bucket}")
    publisher = R2StoragePublisher(config)
    count = publisher.publish_directory(config.output_dir)
    logger.info(f"Successfully uploaded {count} files to R2.")
    return 0


def main() -> None:
    """CLI entrypoint."""
    parser = argparse.ArgumentParser(
        prog="particle-trace",
        description="Particle Trace scientific data preparation pipeline.",
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    # generate-fixtures
    p_fixtures = subparsers.add_parser("generate-fixtures", help="Generate demo fixtures")
    p_fixtures.add_argument("--channel", default="ttbar")
    p_fixtures.add_argument("--pileup", default="pu0")
    p_fixtures.add_argument("--events", type=int, default=3)
    p_fixtures.add_argument("--output-dir", default="./data/fixtures")
    p_fixtures.set_defaults(func=generate_fixtures_command)

    # ingest
    p_ingest = subparsers.add_parser("ingest", help="Ingest and normalize dataset")
    p_ingest.add_argument("--channel", default="ttbar")
    p_ingest.add_argument("--pileup", default="pu0")
    p_ingest.add_argument("--events", type=int, default=10)
    p_ingest.add_argument("--output-dir", default="./data/processed")
    p_ingest.add_argument("--compress", action="store_true")
    p_ingest.set_defaults(func=ingest_command)

    # validate
    p_validate = subparsers.add_parser("validate", help="Validate processed data")
    p_validate.add_argument("--target-dir", default="./data/processed")
    p_validate.set_defaults(func=validate_command)

    # publish
    p_publish = subparsers.add_parser("publish", help="Publish processed data to R2")
    p_publish.add_argument("--target-dir", default="./data/processed")
    p_publish.add_argument("--bucket", required=False)
    p_publish.add_argument("--endpoint", required=False)
    p_publish.set_defaults(func=publish_command)

    args = parser.parse_args()
    sys.exit(args.func(args))


if __name__ == "__main__":
    main()
