from __future__ import annotations

from pathlib import Path

COMPOSE_FILE = Path(__file__).resolve().parents[2] / "docker-compose.production.yml"


def test_www_router_uses_tls_and_permanent_path_preserving_redirect() -> None:
    compose = COMPOSE_FILE.read_text(encoding="utf-8")

    assert "traefik.http.routers.darmalton-www.entrypoints: websecure" in compose
    assert 'traefik.http.routers.darmalton-www.tls: "true"' in compose
    assert "traefik.http.routers.darmalton-www.tls.certresolver:" in compose
    assert "traefik.http.routers.darmalton-www.middlewares: darmalton-www-redirect" in compose
    assert "redirectregex.regex:" in compose
    assert "(.*)" in compose
    assert "redirectregex.replacement:" in compose
    assert "$${1}" in compose
    assert 'redirectregex.permanent: "true"' in compose


def test_production_services_do_not_publish_host_ports() -> None:
    compose = COMPOSE_FILE.read_text(encoding="utf-8")

    assert "\n    ports:" not in compose
