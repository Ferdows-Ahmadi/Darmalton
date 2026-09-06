import json

from django.core.management.base import BaseCommand, CommandError

from catalog.inventory_workbook import import_workbook
from catalog.models import PharmacyBranch


class Command(BaseCommand):
    help = "Import the source workbook as guarded local sample inventory."

    def add_arguments(self, parser):
        parser.add_argument("workbook")
        parser.add_argument("--branch", required=True)
        parser.add_argument("--dry-run", action="store_true")
        parser.add_argument("--manifest")
        parser.add_argument("--asset-root")

    def handle(self, *args, **options):
        try:
            branch = PharmacyBranch.objects.get(pk=options["branch"])
            report = import_workbook(
                options["workbook"],
                branch=branch,
                dry_run=options["dry_run"],
                manifest_path=options["manifest"],
                asset_root=options["asset_root"],
            )
        except Exception as exc:
            raise CommandError(str(exc)) from exc
        self.stdout.write(json.dumps(report, indent=2))
