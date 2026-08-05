from django.core.management.base import BaseCommand
from django.db.models import Exists, OuterRef

from catalog.models import Medicine, MedicineImage


class Command(BaseCommand):
    help = "List active medicines without a usable uploaded image."

    def handle(self, *args, **options):
        usable_images = MedicineImage.objects.filter(medicine=OuterRef("pk")).exclude(image="")
        medicines = (
            Medicine.objects.filter(status=Medicine.Status.ACTIVE)
            .annotate(has_usable_image=Exists(usable_images))
            .filter(has_usable_image=False)
            .order_by("sku", "brand_name")
        )
        self.stdout.write("id\tsku\tbrand_name\tbrand_name_dari")
        for medicine in medicines:
            self.stdout.write(
                f"{medicine.id}\t{medicine.sku}\t{medicine.brand_name}\t{medicine.brand_name_dari}"
            )
        self.stdout.write(f"Missing usable images: {medicines.count()}")
