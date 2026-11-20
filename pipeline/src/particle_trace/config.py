"""Configuration settings for the Particle Trace pipeline."""

from dataclasses import dataclass, field
import os
from pathlib import Path
from typing import List, Optional


@dataclass
class PipelineConfig:
    """Pipeline runtime configuration."""

    dataset_name: str = "CERN/ColliderML-Release-1"
    dataset_release: str = "Release 1"
    channel: str = "ttbar"
    pileup: str = "pu0"
    split: str = "train"
    max_events: int = 20
    event_ids: Optional[List[int]] = None
    tables: List[str] = field(
        default_factory=lambda: ["particles", "tracker_hits", "calo_hits", "tracks"]
    )
    cache_dir: Path = field(
        default_factory=lambda: Path(
            os.environ.get("PARTICLE_TRACE_CACHE_DIR", "./.cache/colliderml")
        )
    )
    output_dir: Path = field(
        default_factory=lambda: Path(
            os.environ.get("PARTICLE_TRACE_OUTPUT_DIR", "./data/processed")
        )
    )
    fixtures_dir: Path = field(
        default_factory=lambda: Path(
            os.environ.get("PARTICLE_TRACE_FIXTURES_DIR", "./data/fixtures")
        )
    )

    # Cloudflare R2 settings
    r2_bucket: Optional[str] = field(
        default_factory=lambda: os.environ.get("R2_BUCKET_NAME")
    )
    r2_endpoint_url: Optional[str] = field(
        default_factory=lambda: os.environ.get("R2_ENDPOINT_URL")
    )
    r2_access_key_id: Optional[str] = field(
        default_factory=lambda: os.environ.get("R2_ACCESS_KEY_ID")
    )
    r2_secret_access_key: Optional[str] = field(
        default_factory=lambda: os.environ.get("R2_SECRET_ACCESS_KEY")
    )
    r2_prefix: str = field(
        default_factory=lambda: os.environ.get("R2_PREFIX", "colliderml-release-1")
    )

    @property
    def configuration_name(self) -> str:
        """Composite configuration identifier, e.g. 'ttbar_pu0'."""
        return f"{self.channel}_{self.pileup}"
