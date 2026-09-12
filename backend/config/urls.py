from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView


def health(request):
    return JsonResponse({"status": "ok"})


urlpatterns = [
    path("admin/", admin.site.urls),
    path("health/", health, name="health"),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/auth/", include("apps.accounts.urls")),
    path("api/", include("apps.photographers.urls")),
    path("api/", include("apps.events.urls")),
    path("api/", include("apps.photos.urls")),
    path("api/", include("apps.orders.urls")),
    path("api/", include("apps.subscriptions.urls")),
    path("api/", include("apps.moderation.urls")),
]

if settings.DEBUG and getattr(settings, "MEDIA_URL", None):
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
