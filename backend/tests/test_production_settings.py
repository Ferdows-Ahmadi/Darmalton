import os
import subprocess
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
PRODUCTION_KEYS = {
    "DATABASE_URL",
    "DJANGO_ALLOWED_HOSTS",
    "DJANGO_CORS_ALLOWED_ORIGINS",
    "DJANGO_CSRF_TRUSTED_ORIGINS",
    "DJANGO_DEBUG",
    "DJANGO_PRODUCTION",
    "DJANGO_SECRET_KEY",
    "DJANGO_USE_SQLITE",
}


def production_check(**overrides):
    environment = {key: value for key, value in os.environ.items() if key not in PRODUCTION_KEYS}
    environment.update(
        {
            "DJANGO_PRODUCTION": "true",
            "DJANGO_DEBUG": "false",
            "DJANGO_USE_SQLITE": "false",
            "DJANGO_ALLOWED_HOSTS": "api.example.test",
            "DJANGO_CORS_ALLOWED_ORIGINS": "https://example.test",
            "DJANGO_CSRF_TRUSTED_ORIGINS": "https://example.test",
            "DATABASE_URL": "postgresql://user:password@db:5432/darmalton",
            "DJANGO_SECRET_KEY": "test-production-key-0123456789012345678901234567890123456789",
            **overrides,
        }
    )
    return subprocess.run(
        [sys.executable, "manage.py", "check", "--deploy"],
        cwd=BACKEND_DIR,
        env=environment,
        capture_output=True,
        text=True,
        check=False,
    )


def test_complete_production_settings_pass_deployment_checks():
    result = production_check()
    assert result.returncode == 0, result.stderr
    assert "System check identified no issues" in result.stdout


def test_production_settings_reject_missing_secret_and_sqlite():
    missing_secret = production_check(DJANGO_SECRET_KEY="")
    assert missing_secret.returncode != 0
    assert "DJANGO_SECRET_KEY must be" in missing_secret.stderr

    sqlite = production_check(DJANGO_USE_SQLITE="true")
    assert sqlite.returncode != 0
    assert "Production requires a PostgreSQL DATABASE_URL" in sqlite.stderr
