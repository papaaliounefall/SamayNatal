from django.test import TestCase
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.core.models import Notification


class ReportNotificationTests(TestCase):
    def test_creating_a_report_notifies_admins(self):
        admin = User.objects.create_superuser(email="mod-admin@test.com", password="AdminPass123!")
        client = APIClient()
        response = client.post(
            "/api/reports/",
            {
                "target_type": "EVENT",
                "target_id": "11111111-1111-1111-1111-111111111111",
                "target_label": "Mariage suspect",
                "reporter_email": "visiteur@test.com",
                "reason": "SPAM",
                "details": "Ceci ressemble à une arnaque.",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertTrue(
            Notification.objects.filter(recipient=admin, title__icontains="signalement").exists()
        )
