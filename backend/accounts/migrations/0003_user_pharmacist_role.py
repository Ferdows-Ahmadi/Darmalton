from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("accounts", "0002_socialidentity")]

    operations = [
        migrations.AlterField(
            model_name="user",
            name="role",
            field=models.CharField(
                choices=[
                    ("CUSTOMER", "Customer"),
                    ("PHARMACIST", "Pharmacist"),
                    ("STAFF", "Staff"),
                    ("ADMIN", "Administrator"),
                ],
                default="CUSTOMER",
                max_length=16,
            ),
        ),
    ]
