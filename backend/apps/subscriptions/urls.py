from django.urls import path

from .views import MySubscriptionView, SubscriptionPlanListView

urlpatterns = [
    path("subscriptions/plans/", SubscriptionPlanListView.as_view(), name="subscription-plans"),
    path("subscriptions/me/", MySubscriptionView.as_view(), name="subscription-me"),
]
