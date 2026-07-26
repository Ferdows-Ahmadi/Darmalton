from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("catalog", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="category",
            name="name_dari",
            field=models.CharField(blank=True, max_length=120),
        ),
        migrations.AddField(
            model_name="dosageform",
            name="name_dari",
            field=models.CharField(blank=True, max_length=80),
        ),
        migrations.AddField(
            model_name="medicine",
            name="brand_name_dari",
            field=models.CharField(blank=True, max_length=180),
        ),
        migrations.AddField(
            model_name="medicine",
            name="description_dari",
            field=models.TextField(blank=True),
        ),
    ]
