"""Prepare writable volume roots, then run Django as the unprivileged app user."""

from __future__ import annotations

import os
import sys

APP_UID = 10001
APP_GID = 10001
WRITABLE_ROOTS = ("/app/media", "/app/private_media")


def main() -> None:
    if os.geteuid() != 0:
        raise SystemExit("The production entrypoint must start as root to initialize volumes.")
    if len(sys.argv) < 2:
        raise SystemExit("No application command was supplied.")

    for path in WRITABLE_ROOTS:
        os.makedirs(path, mode=0o750, exist_ok=True)
        os.chown(path, APP_UID, APP_GID)
        os.chmod(path, 0o750)

    os.setgroups([])
    os.setgid(APP_GID)
    os.setuid(APP_UID)
    os.execvp(sys.argv[1], sys.argv[1:])


if __name__ == "__main__":
    main()
