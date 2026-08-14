from __future__ import annotations

from pathlib import Path

import pytest

import production_entrypoint


def test_entrypoint_initializes_volume_roots_and_drops_privileges(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    calls: list[tuple[object, ...]] = []
    monkeypatch.setattr(production_entrypoint.os, "geteuid", lambda: 0, raising=False)
    monkeypatch.setattr(
        production_entrypoint.os,
        "makedirs",
        lambda path, **options: calls.append(("makedirs", path, options)),
    )
    monkeypatch.setattr(
        production_entrypoint.os,
        "chown",
        lambda path, uid, gid: calls.append(("chown", path, uid, gid)),
        raising=False,
    )
    monkeypatch.setattr(
        production_entrypoint.os,
        "chmod",
        lambda path, mode: calls.append(("chmod", path, mode)),
    )
    monkeypatch.setattr(
        production_entrypoint.os,
        "setgroups",
        lambda groups: calls.append(("setgroups", groups)),
        raising=False,
    )
    monkeypatch.setattr(
        production_entrypoint.os,
        "setgid",
        lambda gid: calls.append(("setgid", gid)),
        raising=False,
    )
    monkeypatch.setattr(
        production_entrypoint.os,
        "setuid",
        lambda uid: calls.append(("setuid", uid)),
        raising=False,
    )
    monkeypatch.setattr(
        production_entrypoint.os,
        "execvp",
        lambda command, args: calls.append(("execvp", command, args)),
    )
    monkeypatch.setattr(
        production_entrypoint.sys,
        "argv",
        [str(Path("production_entrypoint.py")), "gunicorn", "pharmacy.wsgi"],
    )

    production_entrypoint.main()

    for path in production_entrypoint.WRITABLE_ROOTS:
        assert ("makedirs", path, {"mode": 0o750, "exist_ok": True}) in calls
        assert ("chown", path, 10001, 10001) in calls
        assert ("chmod", path, 0o750) in calls
    assert calls[-4:] == [
        ("setgroups", []),
        ("setgid", 10001),
        ("setuid", 10001),
        ("execvp", "gunicorn", ["gunicorn", "pharmacy.wsgi"]),
    ]


def test_entrypoint_refuses_to_initialize_volumes_without_root(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(production_entrypoint.os, "geteuid", lambda: 10001, raising=False)

    with pytest.raises(SystemExit, match="must start as root"):
        production_entrypoint.main()
