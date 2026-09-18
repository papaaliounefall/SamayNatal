from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AdminPayoutViewSet,
    AdminPhotographerViewSet,
    MyPhotographerProfileView,
    MyWalletView,
    PhotographerPayoutViewSet,
    PhotographerRegisterView,
)

router = DefaultRouter()
router.register("admin/photographers", AdminPhotographerViewSet, basename="admin-photographer")
router.register("admin/payouts", AdminPayoutViewSet, basename="admin-payout")
router.register("payouts", PhotographerPayoutViewSet, basename="payout")

urlpatterns = [
    path("photographers/register/", PhotographerRegisterView.as_view(), name="photographer-register"),
    path("photographers/me/", MyPhotographerProfileView.as_view(), name="photographer-me"),
    path("photographers/me/wallet/", MyWalletView.as_view(), name="photographer-me-wallet"),
    path("", include(router.urls)),
]
