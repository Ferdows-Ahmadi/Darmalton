import os
from datetime import timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.utils import timezone
from django.utils.text import slugify

from accounts.models import CustomerProfile, User
from catalog.models import (
    Category,
    DosageForm,
    InventoryBatch,
    Manufacturer,
    Medicine,
    Pharmacy,
    PharmacyBranch,
)
from commerce.models import CustomerAddress

MEDICINES = [
    (
        "Paracetamol",
        "پاراستامول",
        "Acetaminophen",
        "500 mg",
        "Tablet",
        "Pain Relief",
        "HealthPlus",
        False,
    ),
    ("Ibuprofen", "ایبوپروفین", "Ibuprofen", "400 mg", "Tablet", "Pain Relief", "MediCore", False),
    (
        "Amoxicillin",
        "آموکسی‌سیلین",
        "Amoxicillin",
        "500 mg",
        "Capsule",
        "Antibiotics",
        "PharmaTrust",
        True,
    ),
    (
        "Azithromycin",
        "آزیترومایسین",
        "Azithromycin",
        "250 mg",
        "Tablet",
        "Antibiotics",
        "PharmaTrust",
        True,
    ),
    ("Cetirizine", "سیتریزین", "Cetirizine HCl", "10 mg", "Tablet", "Allergy", "HealthPlus", False),
    ("Loratadine", "لوراتادین", "Loratadine", "10 mg", "Tablet", "Allergy", "MediCore", False),
    (
        "Omeprazole",
        "اومپرازول",
        "Omeprazole",
        "20 mg",
        "Capsule",
        "Digestive Health",
        "WellLife",
        False,
    ),
    ("Metformin", "متفورمین", "Metformin HCl", "500 mg", "Tablet", "Diabetes", "HealthPlus", True),
    ("Amlodipine", "املودیپین", "Amlodipine", "5 mg", "Tablet", "Heart Health", "WellLife", True),
    (
        "Losartan",
        "لوزارتان",
        "Losartan Potassium",
        "50 mg",
        "Tablet",
        "Heart Health",
        "MediCore",
        True,
    ),
    (
        "Salbutamol",
        "سالبوتامول",
        "Salbutamol",
        "100 mcg",
        "Inhaler",
        "Respiratory",
        "PharmaTrust",
        True,
    ),
    ("Vitamin C", "ویتامین سی", "Ascorbic Acid", "500 mg", "Tablet", "Vitamins", "WellLife", False),
    (
        "Vitamin D3",
        "ویتامین دی ۳",
        "Cholecalciferol",
        "1000 IU",
        "Capsule",
        "Vitamins",
        "HealthPlus",
        False,
    ),
    (
        "ORS",
        "محلول خوراکی جبران آب",
        "Oral Rehydration Salts",
        "20.5 g",
        "Sachet",
        "Digestive Health",
        "MediCore",
        False,
    ),
    (
        "Hydrocortisone",
        "هایدروکورتیزون",
        "Hydrocortisone",
        "1%",
        "Cream",
        "Skin Care",
        "PharmaTrust",
        False,
    ),
    ("Clotrimazole", "کلوتریمازول", "Clotrimazole", "1%", "Cream", "Skin Care", "WellLife", False),
    (
        "Dextromethorphan",
        "دکسترومتورفان",
        "Dextromethorphan",
        "15 mg/5 ml",
        "Syrup",
        "Respiratory",
        "HealthPlus",
        False,
    ),
    ("Iron Plus", "مکمل آهن", "Ferrous Sulfate", "200 mg", "Tablet", "Vitamins", "MediCore", False),
    (
        "Diclofenac Gel",
        "ژل دیکلوفناک",
        "Diclofenac Sodium",
        "1%",
        "Gel",
        "Pain Relief",
        "WellLife",
        False,
    ),
    (
        "Insulin Regular",
        "انسولین رگولر",
        "Human Insulin",
        "100 IU/ml",
        "Injection",
        "Diabetes",
        "PharmaTrust",
        True,
    ),
]

CATEGORY_DARI = {
    "Allergy": "حساسیت",
    "Antibiotics": "آنتی‌بیوتیک‌ها",
    "Diabetes": "دیابت",
    "Digestive Health": "سلامت گوارش",
    "Heart Health": "سلامت قلب",
    "Pain Relief": "تسکین درد",
    "Respiratory": "تنفسی",
    "Skin Care": "مراقبت پوست",
    "Vitamins": "ویتامین‌ها و مکمل‌ها",
}

DOSAGE_FORM_DARI = {
    "Capsule": "کپسول",
    "Cream": "کریم",
    "Gel": "ژل",
    "Inhaler": "اسپری تنفسی",
    "Injection": "تزریق",
    "Sachet": "ساشه",
    "Syrup": "شربت",
    "Tablet": "قرص",
}


class Command(BaseCommand):
    help = "Create or refresh safe, idempotent Milestone 1 demonstration data."

    def handle(self, *args, **options):
        admin_email = os.getenv("DEMO_ADMIN_EMAIL", "admin@example.test")
        admin_password = os.getenv("DEMO_ADMIN_PASSWORD", "ChangeMe-Admin-123!")
        customer_email = os.getenv("DEMO_CUSTOMER_EMAIL", "customer@example.test")
        customer_password = os.getenv("DEMO_CUSTOMER_PASSWORD", "ChangeMe-Customer-123!")
        pharmacist_email = os.getenv(
            "DEMO_PHARMACIST_EMAIL", "pharmacist@example.test"
        )
        pharmacist_password = os.getenv(
            "DEMO_PHARMACIST_PASSWORD", "ChangeMe-Pharmacist-123!"
        )

        admin, _ = User.objects.get_or_create(
            email=admin_email,
            defaults={
                "first_name": "Demo",
                "last_name": "Administrator",
                "role": User.Role.ADMIN,
                "is_staff": True,
                "is_superuser": True,
            },
        )
        admin.role = User.Role.ADMIN
        admin.is_staff = True
        admin.is_superuser = True
        admin.set_password(admin_password)
        admin.save()

        pharmacist, _ = User.objects.get_or_create(
            email=pharmacist_email,
            defaults={
                "first_name": "Demo",
                "last_name": "Pharmacist",
                "role": User.Role.PHARMACIST,
                "is_staff": True,
            },
        )
        pharmacist.role = User.Role.PHARMACIST
        pharmacist.is_staff = True
        pharmacist.is_superuser = False
        pharmacist.set_password(pharmacist_password)
        pharmacist.save()

        customer, _ = User.objects.get_or_create(
            email=customer_email,
            defaults={"first_name": "امین", "last_name": "احمدی"},
        )
        customer.first_name = "امین"
        customer.last_name = "احمدی"
        customer.set_password(customer_password)
        customer.save()
        CustomerProfile.objects.get_or_create(user=customer)
        CustomerAddress.objects.update_or_create(
            user=customer,
            label="خانه",
            defaults={
                "recipient_name": "امین احمدی",
                "recipient_phone": "+93 700 123 456",
                "country_code": "AF",
                "province": "کابل",
                "city": "کابل",
                "district": "کارته چهار",
                "street_address": "سرک پنجم، کوچه گل سرخ، خانه ۱۲",
                "landmark": "مقابل مکتب نور",
                "is_default": True,
            },
        )

        pharmacy, _ = Pharmacy.objects.get_or_create(
            license_number="DEMO-PHARMACY-001",
            defaults={"name": "Darmalton Pharmacy", "legal_name": "Darmalton Pharmacy Demo"},
        )
        branch, _ = PharmacyBranch.objects.get_or_create(
            pharmacy=pharmacy,
            name="Central Branch",
            defaults={
                "phone": "+93-700-000-000",
                "address_text": "Demo Avenue, Kabul",
                "status": PharmacyBranch.Status.ACTIVE,
            },
        )

        categories = {}
        for name in sorted({row[5] for row in MEDICINES}):
            categories[name], _ = Category.objects.update_or_create(
                slug=slugify(name),
                defaults={"name": name, "name_dari": CATEGORY_DARI[name]},
            )
        manufacturers = {}
        for name in sorted({row[6] for row in MEDICINES}):
            manufacturers[name], _ = Manufacturer.objects.get_or_create(name=name)
        dosage_forms = {}
        for name in sorted({row[4] for row in MEDICINES}):
            dosage_forms[name], _ = DosageForm.objects.update_or_create(
                code=name.upper().replace(" ", "_"),
                defaults={"name": name, "name_dari": DOSAGE_FORM_DARI[name]},
            )

        today = timezone.localdate()
        for index, (
            brand,
            brand_dari,
            generic,
            strength,
            form,
            category,
            manufacturer,
            rx,
        ) in enumerate(MEDICINES, start=1):
            medicine, _ = Medicine.objects.update_or_create(
                sku=f"DEMO-{index:03}",
                defaults={
                    "brand_name": brand,
                    "brand_name_dari": brand_dari,
                    "generic_name": generic,
                    "strength": strength,
                    "pack_size": "1 retail pack",
                    "dosage_form": dosage_forms[form],
                    "category": categories[category],
                    "manufacturer": manufacturers[manufacturer],
                    "prescription_required": rx,
                    "description": (
                        f"{brand} is a demonstration catalogue item. "
                        "Its information does not replace advice from a doctor or pharmacist."
                    ),
                    "description_dari": (
                        "این یک محصول نمایشی کاتالوگ درملتون است. معلومات آن "
                        "جایگزین مشوره داکتر یا فارمسست نیست."
                    ),
                    "status": Medicine.Status.ACTIVE,
                },
            )
            InventoryBatch.objects.update_or_create(
                branch=branch,
                medicine=medicine,
                batch_number=f"ACTIVE-{index:03}",
                defaults={
                    "expiry_date": today + timedelta(days=180 + index),
                    "available_quantity": 15 + index,
                    "purchase_price": Decimal("40.00") + index,
                    "selling_price": Decimal("55.00") + index,
                    "is_active": True,
                },
            )
            if index == 1:
                InventoryBatch.objects.update_or_create(
                    branch=branch,
                    medicine=medicine,
                    batch_number="EXPIRED-DEMO",
                    defaults={
                        "expiry_date": today - timedelta(days=30),
                        "available_quantity": 100,
                        "purchase_price": Decimal("20.00"),
                        "selling_price": Decimal("30.00"),
                        "is_active": True,
                    },
                )
                InventoryBatch.objects.update_or_create(
                    branch=branch,
                    medicine=medicine,
                    batch_number="FEFO-DEMO",
                    defaults={
                        "expiry_date": today + timedelta(days=60),
                        "available_quantity": 2,
                        "purchase_price": Decimal("35.00"),
                        "selling_price": Decimal("56.00"),
                        "is_active": True,
                    },
                )

        self.stdout.write(self.style.SUCCESS("Demo data is ready."))
        self.stdout.write(f"Admin: {admin_email}")
        self.stdout.write(f"Customer: {customer_email}")
        self.stdout.write("Passwords come from DEMO_ADMIN_PASSWORD and DEMO_CUSTOMER_PASSWORD.")
