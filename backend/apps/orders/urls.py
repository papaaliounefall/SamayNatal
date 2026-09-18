from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AdminOrderViewSet,
    ClientGalleryListView,
    CreateOrderView,
    DevConfirmPaymentView,
    PaymentWebhookView,
    PhotographerClientListView,
    PhotographerOrderViewSet,
)

router = DefaultRouter()
router.register("orders", PhotographerOrderViewSet, basename="order")
router.register("admin/orders", AdminOrderViewSet, basename="admin-order")

urlpatterns = [
    path("public/events/<slug:event_slug>/orders/", CreateOrderView.as_view(), name="create-order"),
    path("payments/webhook/<str:provider>/", PaymentWebhookView.as_view(), name="payment-webhook"),
    path("payments/dev-confirm/", DevConfirmPaymentView.as_view(), name="payment-dev-confirm"),
    path("clients/", PhotographerClientListView.as_view(), name="photographer-clients"),
    path("client/galleries/", ClientGalleryListView.as_view(), name="client-galleries"),
    path("", include(router.urls)),
]
