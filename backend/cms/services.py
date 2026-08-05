from django.db import transaction
from django.utils import timezone

from .models import PublicationStatus


@transaction.atomic
def publish_content(*, instance, actor, publish_from=None, publish_until=None):
    instance = instance.__class__.objects.select_for_update().get(pk=instance.pk)
    instance.status = PublicationStatus.PUBLISHED
    instance.publish_from = publish_from or timezone.now()
    instance.publish_until = publish_until
    instance.published_by = actor
    instance.published_at = timezone.now()
    instance.updated_by = actor
    instance.full_clean()
    instance.save(
        update_fields=(
            "status",
            "publish_from",
            "publish_until",
            "published_by",
            "published_at",
            "updated_by",
            "updated_at",
        )
    )
    return instance


@transaction.atomic
def archive_content(*, instance, actor):
    instance = instance.__class__.objects.select_for_update().get(pk=instance.pk)
    instance.status = PublicationStatus.ARCHIVED
    instance.updated_by = actor
    instance.full_clean()
    instance.save(update_fields=("status", "updated_by", "updated_at"))
    return instance
