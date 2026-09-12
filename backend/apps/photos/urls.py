from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    PhotographerPhotoViewSet,
    PhotoHDDownloadView,
    PhotoUploadView,
    PublicGalleryPhotosView,
)

router = DefaultRouter()
router.register("photos", PhotographerPhotoViewSet, basename="photo")

urlpatterns = [
    path(
        "events/<uuid:event_id>/galleries/<uuid:gallery_id>/photos/upload/",
        PhotoUploadView.as_view(),
        name="photo-upload",
    ),
    path("photos/<uuid:photo_id>/download/", PhotoHDDownloadView.as_view(), name="photo-hd-download"),
    path(
        "public/events/<slug:event_slug>/galleries/<uuid:gallery_id>/photos/",
        PublicGalleryPhotosView.as_view(),
        name="public-gallery-photos",
    ),
    path("", include(router.urls)),
]
