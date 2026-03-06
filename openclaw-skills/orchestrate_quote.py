"""
OpenClaw Skill: orchestrate_quote
Coordinates the full quoting pipeline after file parsing:
  1. Parse customer file
  2. Post parsed data to EW-WebView API (creates orders)
  3. Trigger DAT rate enrichment
  4. Notify review team

This skill is the main orchestrator called by OpenClaw when a file arrives.
"""

import json
import os
import sys

try:
    import requests
except ImportError:
    os.system("pip install requests")
    import requests

from parse_shipment_file import parse_file, post_to_ew_api

EW_API_BASE = os.environ.get("EW_API_BASE_URL", "http://localhost:5001/api")
AGENT_API_KEY = os.environ.get("AGENT_WEBHOOK_API_KEY", "")
AUTH_TOKEN = os.environ.get("EW_AUTH_TOKEN", "")


def get_headers():
    headers = {"Content-Type": "application/json"}
    if AGENT_API_KEY:
        headers["X-Agent-Api-Key"] = AGENT_API_KEY
    if AUTH_TOKEN:
        headers["Authorization"] = f"Bearer {AUTH_TOKEN}"
    return headers


def enrich_with_dat(order_ids: list[int]) -> dict:
    """Call EW-WebView to enrich orders with DAT rates."""
    resp = requests.post(
        f"{EW_API_BASE}/agent/enrich-quotes",
        json={"orderIds": order_ids},
        headers=get_headers(),
        timeout=60,
    )
    resp.raise_for_status()
    return resp.json()


def distribute_quote(review_task_id: str) -> dict:
    """Trigger quote distribution via WeCom."""
    resp = requests.post(
        f"{EW_API_BASE}/agent/distribute-quote",
        json={"reviewTaskId": review_task_id},
        headers=get_headers(),
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()


def orchestrate(file_path: str, wecom_chat_id: str = None, auto_enrich: bool = True):
    """
    Full pipeline:
      1. Parse file -> structured items
      2. Post to EW API -> create orders + review task
      3. Optionally enrich with DAT rates
      4. Return summary
    """
    print(f"[orchestrate] Parsing file: {file_path}")
    items = parse_file(file_path)

    if not items:
        return {"success": False, "message": "No shipment items found in file"}

    print(f"[orchestrate] Found {len(items)} items, posting to EW API...")
    result = post_to_ew_api(
        items,
        source_file=os.path.basename(file_path),
        wecom_chat_id=wecom_chat_id,
    )

    order_ids = result.get("data", {}).get("orderIds", [])
    review_task_id = result.get("data", {}).get("reviewTaskId")
    print(f"[orchestrate] Created {len(order_ids)} orders, review task: {review_task_id}")

    dat_results = None
    if auto_enrich and order_ids:
        try:
            print("[orchestrate] Enriching with DAT rates...")
            dat_results = enrich_with_dat(order_ids)
            print(f"[orchestrate] DAT enrichment complete")
        except Exception as e:
            print(f"[orchestrate] DAT enrichment failed: {e}")
            dat_results = {"error": str(e)}

    return {
        "success": True,
        "itemCount": len(items),
        "orderIds": order_ids,
        "reviewTaskId": review_task_id,
        "datResults": dat_results,
        "message": f"Parsed {len(items)} items, created {len(order_ids)} orders. "
                   f"Review task: {review_task_id}. "
                   f"{'DAT rates enriched.' if dat_results and not dat_results.get('error') else 'DAT enrichment pending.'}"
    }


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python orchestrate_quote.py <file_path> [wecom_chat_id]")
        sys.exit(1)

    file_path = sys.argv[1]
    chat_id = sys.argv[2] if len(sys.argv) > 2 else None

    result = orchestrate(file_path, wecom_chat_id=chat_id)
    print(json.dumps(result, indent=2, ensure_ascii=False))
