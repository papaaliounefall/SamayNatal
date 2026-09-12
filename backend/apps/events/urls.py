from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import EventViewSet, GalleryViewSet, PublicEventDetailView, UnlockEventView

router = DefaultRouter()
router.register("events", EventViewSet, basename="event")
router.register("galleries", GalleryViewSet, basename="gallery")

urlpatterns = [
    path("public/events/<slug:slug>/", PublicEventDetailView.as_view(), name="public-event-detail"),
    path("public/events/<slug:slug>/unlock/", UnlockEventView.as_view(), name="public-event-unlock"),
    path("", include(router.urls)),
]
