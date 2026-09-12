from django.shortcuts import get_object_or_404
from rest_framework import permissions
from rest_framework.generics import ListAPIView
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.permissions import IsApprovedPhotographer
from apps.photographers.models import PhotographerProfile

from .models import Subscription, SubscriptionPlan
from .serializers import SubscriptionPlanSerializer, SubscriptionSerializer
from .services import change_plan


class SubscriptionPlanListView(ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = SubscriptionPlanSerializer
    queryset = SubscriptionPlan.objects.filter(is_active=True)


class MySubscriptionView(APIView):
    permission_classes = [IsApprovedPhotographer]

    def get(self, request):
        profile = get_object_or_404(PhotographerProfile, user=request.user)
        subscription = getattr(profile, "subscription", None)
        return Response(SubscriptionSerializer(subscription).data if subscription else None)

    def post(self, request):
        profile = get_object_or_404(PhotographerProfile, user=request.user)
        serializer = SubscriptionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        subscription = change_plan(
            profile=profile, plan=serializer.validated_data["plan"], actor=request.user, request=request
        )
        return Response(SubscriptionSerializer(subscription).data)
