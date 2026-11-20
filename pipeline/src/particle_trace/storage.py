"""Cloudflare R2 storage publishing and synchronization."""

import logging
from pathlib import Path
from typing import Any, Dict, List, Optional
from particle_trace.config import PipelineConfig

logger = logging.getLogger(__name__)


class R2StoragePublisher:
    """Publishes processed manifests and event bundles to Cloudflare R2 bucket."""

    def __init__(self, config: PipelineConfig):
        self.config = config
        self._client: Optional[Any] = None

    def _get_client(self) -> Any:
        """Lazily initialize boto3 S3 client configured for Cloudflare R2."""
        if self._client is not None:
            return self._client

        try:
            import boto3  # type: ignore
        except ImportError as e:
            raise RuntimeError(
                "boto3 is required for R2 publishing. Install with: pip install boto3"
            ) from e

        if not self.config.r2_endpoint_url or not self.config.r2_access_key_id or not self.config.r2_secret_access_key:
            raise ValueError(
                "Missing R2 configuration. Ensure R2_ENDPOINT_URL, R2_ACCESS_KEY_ID, "
                "and R2_SECRET_ACCESS_KEY environment variables are defined."
            )

        self._client = boto3.client(
            "s3",
            endpoint_url=self.config.r2_endpoint_url,
            aws_access_key_id=self.config.r2_access_key_id,
            aws_secret_access_key=self.config.r2_secret_access_key,
            region_name="auto",
        )
        return self._client

    def upload_file(self, local_path: Path, remote_key: str, content_type: str = "application/json") -> None:
        """Upload a single file to R2 with appropriate headers."""
        client = self._get_client()
        bucket = self.config.r2_bucket
        if not bucket:
            raise ValueError("R2_BUCKET_NAME is not set.")

        extra_args: Dict[str, Any] = {"ContentType": content_type}
        if local_path.suffix == ".gz":
            extra_args["ContentEncoding"] = "gzip"

        logger.info(f"Uploading {local_path} to s3://{bucket}/{remote_key}")
        client.upload_file(str(local_path), bucket, remote_key, ExtraArgs=extra_args)

    def publish_directory(self, local_dir: Path, prefix: Optional[str] = None) -> int:
        """Upload all files in directory to R2 under prefix."""
        target_prefix = prefix or self.config.r2_prefix
        uploaded = 0

        for file_path in local_dir.rglob("*"):
            if file_path.is_file():
                rel_path = file_path.relative_to(local_dir).as_posix()
                remote_key = f"{target_prefix}/{rel_path}".strip("/")
                content_type = "application/json"
                if file_path.name.endswith(".json") or file_path.name.endswith(".json.gz"):
                    content_type = "application/json"
                self.upload_file(file_path, remote_key, content_type)
                uploaded += 1

        return uploaded
