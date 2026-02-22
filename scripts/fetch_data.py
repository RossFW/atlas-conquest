"""
Atlas Conquest — Data Pipeline

Connects to AWS database, pulls game data, and writes
aggregated JSON files to site/data/ for the static frontend.

Usage:
    python scripts/fetch_data.py

Environment variables (set via GitHub Secrets in CI):
    AWS_ACCESS_KEY_ID
    AWS_SECRET_ACCESS_KEY
    AWS_DEFAULT_REGION
"""

import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

# Output directory for generated JSON
DATA_DIR = Path(__file__).resolve().parent.parent / "site" / "data"


def get_aws_client():
    """Create AWS client. Exact service TBD after exploring the database."""
    try:
        import boto3
    except ImportError:
        print("Error: boto3 is required. Install with: pip install boto3")
        sys.exit(1)

    # Region and credentials come from environment or AWS config
    # TODO: Set the correct service (dynamodb, rds, etc.) once we know the DB type
    return boto3


def write_json(filename, data):
    """Write data to a JSON file in the data directory."""
    path = DATA_DIR / filename
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w") as f:
        json.dump(data, f, indent=2, default=str)
    print(f"  Wrote {path}")


def fetch_and_process():
    """Main pipeline: fetch from AWS, transform, write JSON files."""

    print("Atlas Conquest Data Pipeline")
    print("=" * 40)

    # TODO: Implement actual data fetching once we have:
    #   1. AWS credentials configured
    #   2. Database type and schema explored
    #   3. Query logic written
    #
    # For now, write placeholder metadata.

    print("\n[1/5] Fetching match data...")
    # matches = fetch_matches()

    print("[2/5] Fetching card definitions...")
    # cards = fetch_cards()

    print("[3/5] Aggregating commander stats...")
    # commander_stats = aggregate_commander_stats(matches)

    print("[4/5] Aggregating card stats...")
    # card_stats = aggregate_card_stats(matches, cards)

    print("[5/5] Computing meta trends...")
    # trends = compute_trends(matches)

    # Write metadata
    write_json("metadata.json", {
        "last_updated": datetime.now(timezone.utc).isoformat(),
        "total_matches": 0,
        "total_players": 0,
        "data_version": "0.1.0",
    })

    print("\nDone. Data files written to site/data/")


if __name__ == "__main__":
    fetch_and_process()
