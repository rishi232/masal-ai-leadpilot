"""
Unit & Integration tests for LeadPilot AI backend.
"""
import os
import unittest
from fastapi.testclient import TestClient

# Ensure test DB is used
os.environ["DATABASE_URL"] = "sqlite:///./test_leadpilot.db"
os.environ["GEMINI_API_KEY"] = "your_key_here"  # Unconfigured key to test 502 handling

from main import app
from database import Base, engine


class TestLeadPilotBackend(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=engine)
        cls.client = TestClient(app)

    @classmethod
    def tearDownClass(cls):
        Base.metadata.drop_all(bind=engine)
        if os.path.exists("./test_leadpilot.db"):
            try:
                os.remove("./test_leadpilot.db")
            except Exception:
                pass

    def test_01_health_check(self):
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok"})

    def test_02_create_lead_validation_error(self):
        # Missing required fields
        response = self.client.post("/leads", json={"name": "Only Name"})
        self.assertEqual(response.status_code, 422)

    def test_03_create_lead_success(self):
        payload = {
            "name": "Rahul Sharma",
            "location": "Noida Sector 62",
            "property_requirement": "3 BHK Apartment near Metro",
            "budget": "INR 80 Lakhs",
            "buying_timeline": "Within 30 days",
            "customer_message": "Need a ready-to-move 3BHK flat within 1 km of the metro station for family."
        }
        response = self.client.post("/leads", json=payload)
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertEqual(data["name"], "Rahul Sharma")
        self.assertEqual(data["budget"], "INR 80 Lakhs")
        self.assertIsNone(data["analysis"])
        self.assertIsNone(data["score"])
        self.assertIsNone(data["priority"])
        self.assertIn("id", data)
        self.__class__.created_lead_id = data["id"]

    def test_04_get_single_lead(self):
        lead_id = self.__class__.created_lead_id
        response = self.client.get(f"/leads/{lead_id}")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["id"], lead_id)
        self.assertEqual(data["name"], "Rahul Sharma")

    def test_05_get_lead_not_found(self):
        response = self.client.get("/leads/999999")
        self.assertEqual(response.status_code, 404)

    def test_06_list_leads_and_sorting(self):
        # Create second lead
        payload2 = {
            "name": "Priya Verma",
            "location": "Gurgaon Golf Course Road",
            "property_requirement": "4 BHK Luxury Villa",
            "budget": "INR 3.5 Crore",
            "buying_timeline": "Immediately",
            "customer_message": "Looking for immediate possession luxury villa with private lawn."
        }
        res2 = self.client.post("/leads", json=payload2)
        self.assertEqual(res2.status_code, 201)

        response = self.client.get("/leads")
        self.assertEqual(response.status_code, 200)
        leads = response.json()
        self.assertGreaterEqual(len(leads), 2)

    def test_07_analyze_lead_unconfigured_key_returns_502(self):
        lead_id = self.__class__.created_lead_id
        response = self.client.post(f"/leads/{lead_id}/analyze")
        # Should gracefully return 502 with detail
        self.assertEqual(response.status_code, 502)
        self.assertIn("detail", response.json())
        self.assertIn("GEMINI_API_KEY", response.json()["detail"])

    def test_08_chat_lead_unconfigured_key_returns_502(self):
        lead_id = self.__class__.created_lead_id
        response = self.client.post(
            f"/leads/{lead_id}/chat",
            json={"question": "What should I emphasize on the call?"}
        )
        self.assertEqual(response.status_code, 502)
        self.assertIn("detail", response.json())

    def test_09_delete_lead(self):
        lead_id = self.__class__.created_lead_id
        del_resp = self.client.delete(f"/leads/{lead_id}")
        self.assertEqual(del_resp.status_code, 200)

        get_resp = self.client.get(f"/leads/{lead_id}")
        self.assertEqual(get_resp.status_code, 404)


if __name__ == "__main__":
    unittest.main()
