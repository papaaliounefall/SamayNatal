from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import CreateOrderView, DevConfirmPaymentView, PaymentWebhookView, PhotographerOrderViewSet

router = DefaultRouter()
router.register("orders", PhotographerOrderViewSet, basename="order")

urlpatterns = [
    path("public/events/<slug:event_slug>/orders/", CreateOrderView.as_view(), name="create-order"),
    path("payments/webhook/<str:provider>/", PaymentWebhookView.as_view(), name="payment-webhook"),
    path("payments/dev-confirm/", DevConfirmPaymentView.as_view(), name="payment-dev-confirm"),
    path("", include(router.urls)),
]
