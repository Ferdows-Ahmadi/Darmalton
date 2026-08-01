"""Development-only UDP responder for bounded mobile LAN discovery."""

import json
import os
import socket

DISCOVERY_PORT = 53535
DISCOVERY_REQUEST = b"DARMALTON_DISCOVER_V1"


def main():
    api_host = os.environ.get("DARMALTON_DEV_API_HOST", "").strip()
    if not api_host:
        raise RuntimeError("DARMALTON_DEV_API_HOST is required")

    response = json.dumps(
        {
            "service": "darmalton-dev",
            "version": 1,
            "api_base_url": f"http://{api_host}:8000/api/v1",
        }
    ).encode("utf-8")

    with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as server:
        server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        server.bind(("0.0.0.0", DISCOVERY_PORT))
        print(
            f"Darmalton discovery listening on UDP {DISCOVERY_PORT}; advertising {api_host}",
            flush=True,
        )
        while True:
            payload, address = server.recvfrom(1024)
            if payload.strip() == DISCOVERY_REQUEST:
                server.sendto(response, address)


if __name__ == "__main__":
    main()
