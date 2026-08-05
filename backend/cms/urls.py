from rest_framework.routers import DefaultRouter

from .views import (
    AnnouncementViewSet,
    ContentPageViewSet,
    FeaturedMedicineViewSet,
    PromotionalBannerViewSet,
)

router = DefaultRouter()
router.register("cms/banners", PromotionalBannerViewSet, basename="cms-banner")
router.register("cms/announcements", AnnouncementViewSet, basename="cms-announcement")
router.register("cms/pages", ContentPageViewSet, basename="cms-page")
router.register(
    "cms/featured-medicines",
    FeaturedMedicineViewSet,
    basename="cms-featured-medicine",
)

urlpatterns = router.urls
