"""
OpenClaw Skill: distribute_quotes
After a review task is approved, generates the quote message and sends it
back to the customer via WeCom.

This skill can be triggered:
  1. Automatically after review approval (via webhook)
  2. Manually by an operator
  3. Scheduled for batch distribution
"""

import json
import os
import sys

try:
    import requests
except ImportError:
    os.system("pip install requests")
    import requests

EW_API_BASE = os.environ.get("EW_API_BASE_URL", "http://localhost:5001/api")
AUTH_TOKEN = os.environ.get("EW_AUTH_TOKEN", "")


def get_headers():
    headers = {"Content-Type": "application/json"}
    if AUTH_TOKEN:
        headers["Authorization"] = f"Bearer {AUTH_TOKEN}"
    return headers


def get_pending_reviews() -> list[dict]:
    """Fetch all approved-but-not-yet-distributed review tasks."""
    resp = requests.get(
        f"{EW_API_BASE}/agent/reviews",
        params={"status": "approved"},
        headers=get_headers(),
        timeout=15,
    )
    resp.raise_for_status()
    return resp.json().get("data", [])


def distribute(review_task_id: str) -> dict:
    """Send quote to WeCom for a specific review task."""
    resp = requests.post(
        f"{EW_API_BASE}/agent/distribute-quote",
        json={"reviewTaskId": review_task_id},
        headers=get_headers(),
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()


def distribute_all_approved():
    """Find all approved tasks and distribute them."""
    tasks = get_pending_reviews()
    results = []

    for task in tasks:
        task_id = task.get("id")
        if not task_id:
            continue

        try:
            result = distribute(task_id)
            results.append({
                "taskId": task_id,
                "success": True,
                "orderCount": result.get("data", {}).get("orderCount", 0)
            })
            print(f"[distribute] Task {task_id}: distributed {result.get('data', {}).get('orderCount', 0)} quotes")
        except Exception as e:
            results.append({
                "taskId": task_id,
                "success": False,
                "error": str(e)
            })
            print(f"[distribute] Task {task_id}: failed - {e}")

    return {
        "totalTasks": len(tasks),
        "distributed": sum(1 for r in results if r["success"]),
        "failed": sum(1 for r in results if not r["success"]),
        "details": results,
    }


if __name__ == "__main__":
    if len(sys.argv) > 1:
        task_id = sys.argv[1]
        result = distribute(task_id)
        print(json.dumps(result, indent=2, ensure_ascii=False))
    else:
        print("[distribute] Distributing all approved review tasks...")
        result = distribute_all_approved()
        print(json.dumps(result, indent=2, ensure_ascii=False))
