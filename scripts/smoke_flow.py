import json
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "backend"))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "pharmacy.settings")
os.environ.setdefault("DJANGO_USE_SQLITE", "true")

import django  # noqa: E402

django.setup()

from accounts.models import User  # noqa: E402
from commerce.models import Order  # noqa: E402
from commerce.services import transition_order_status  # noqa: E402

BASE = os.getenv("SMOKE_API_BASE", "http://127.0.0.1:8000/api/v1")


def request(path, method="GET", data=None, token=None):
    body = json.dumps(data).encode() if data is not None else None
    headers = {"Accept": "application/json"}
    if body:
        headers["Content-Type"] = "application/json"
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(f"{BASE}/{path.lstrip('/')}", data=body, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=20) as response:
            return json.loads(response.read() or b"{}")
    except urllib.error.HTTPError as error:
        raise RuntimeError(f"{method} {path} failed: {error.code} {error.read().decode()}") from error


def main():
    suffix = str(int(time.time()))
    email = f"smoke-{suffix}@example.test"
    password = "Smoke-Only-Password-123!"
    registered = request(
        "auth/register/",
        "POST",
        {
            "email": email,
            "password": password,
            "first_name": "Smoke",
            "last_name": "Customer",
        },
    )
    token = registered["access"]
    medicines = request("medicines/?search=Paracetamol")
    medicine = medicines["results"][0]
    request("cart/items/", "POST", {"medicine_id": medicine["id"], "quantity": 1}, token)
    address = request(
        "addresses/",
        "POST",
        {
            "label": "Home",
            "recipient_name": "Smoke Customer",
            "recipient_phone": "+93-700-000-001",
            "country_code": "AF",
            "province": "Kabul",
            "city": "Kabul",
            "district": "",
            "street_address": "Smoke Test Street",
            "landmark": "",
            "is_default": True,
        },
        token,
    )
    order_payload = request("orders/", "POST", {"address_id": address["id"]}, token)
    order = Order.objects.get(pk=order_payload["id"])
    admin = User.objects.get(email=os.getenv("DEMO_ADMIN_EMAIL", "admin@example.test"))
    transition_order_status(
        order=order,
        new_status=Order.Status.CONFIRMED,
        actor=admin,
        note="Integrated smoke test",
    )
    refreshed = request(f"orders/{order.id}/", token=token)
    assert refreshed["status"] == "CONFIRMED"
    assert refreshed["status_history"][-1]["to_status"] == "CONFIRMED"
    print(json.dumps({
        "registration": "pass",
        "catalogue": "pass",
        "cart": "pass",
        "address": "pass",
        "checkout": "pass",
        "admin_transition": "pass",
        "customer_status_refresh": "pass",
        "order_number": refreshed["order_number"],
    }, indent=2))


if __name__ == "__main__":
    main()
