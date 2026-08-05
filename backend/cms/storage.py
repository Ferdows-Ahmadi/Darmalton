from django.conf import settings
from django.core.files.storage import FileSystemStorage
from django.utils.deconstruct import deconstructible
from django.utils.functional import cached_property


@deconstructible
class PrivateCmsStorage(FileSystemStorage):
    def __init__(self):
        super().__init__(base_url=None)

    @cached_property
    def base_location(self):
        return settings.PRIVATE_MEDIA_ROOT

    def url(self, name):
        raise ValueError("Private CMS files do not have direct URLs.")


private_cms_storage = PrivateCmsStorage()
