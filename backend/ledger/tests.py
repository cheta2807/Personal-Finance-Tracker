import json

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import Client, TestCase

from .models import Budget, Transaction


class FinanceTests(TestCase):
    def setUp(self):
        cache.clear()
        self.a = get_user_model().objects.create_user(
            username="alice", password="valid-passphrase-49"
        )
        self.b = get_user_model().objects.create_user(
            username="bob", password="other-passphrase-52"
        )
        self.client.force_login(self.a)
        self.record = {
            "description": "Lunch",
            "type": "expense",
            "category": "Food",
            "amount": 1250,
            "date": "2026-10-09",
        }

    def send(self, path, data, method="post", client=None):
        return getattr(client or self.client, method)(
            "/api/" + path + "/", data=json.dumps(data), content_type="application/json"
        )

    def test_requires_authentication(self):
        self.client.logout()
        self.assertEqual(self.client.get("/api/data/").status_code, 401)
        self.assertEqual(self.send("transactions", self.record).status_code, 401)

    def test_crud_and_account_isolation(self):
        result = self.send("transactions", self.record)
        self.assertEqual(result.status_code, 201)
        pk = result.json()["id"]
        self.assertEqual(
            self.send("transactions/" + pk, {**self.record, "amount": 2000}, "put").status_code,
            200,
        )
        self.assertEqual(self.client.get("/api/data/").json()["transactions"][0]["amount"], 2000)
        self.client.force_login(self.b)
        self.assertEqual(self.client.get("/api/data/").json()["transactions"], [])
        self.assertEqual(self.send("transactions/" + pk, self.record, "put").status_code, 404)
        self.assertEqual(self.send("transactions/" + pk, {}, "delete").status_code, 404)
        self.client.force_login(self.a)
        self.assertEqual(self.send("transactions/" + pk, {}, "delete").status_code, 200)

    def test_money_and_date_validation(self):
        for patch in [
            {"amount": -1},
            {"amount": 0},
            {"amount": 1.2},
            {"amount": True},
            {"amount": 100000000001},
            {"date": "2026-02-30"},
            {"type": "anything"},
            {"description": " "},
        ]:
            self.assertEqual(self.send("transactions", {**self.record, **patch}).status_code, 400)
        self.assertEqual(Transaction.objects.count(), 0)

    def test_monthly_budgets_are_scoped_and_upserted(self):
        for amount in [10000, 20000]:
            self.assertEqual(
                self.send("budget", {"month": "2026-10", "amount": amount}, "put").status_code,
                200,
            )
        self.assertEqual(Budget.objects.count(), 1)
        self.assertEqual(self.client.get("/api/data/").json()["budgets"], {"2026-10": 20000})
        self.client.force_login(self.b)
        self.assertEqual(self.client.get("/api/data/").json()["budgets"], {})

    def test_invalid_import_is_atomic_and_other_user_data_survives(self):
        self.send("transactions", self.record)
        Transaction.objects.create(user=self.b, **self.record)
        invalid = {
            "version": 1,
            "transactions": [self.record, {**self.record, "amount": -1}],
            "budgets": {},
        }
        self.assertEqual(self.send("import", invalid).status_code, 400)
        self.assertEqual(Transaction.objects.filter(user=self.a).count(), 1)
        valid = {
            "version": 1,
            "transactions": [{**self.record, "amount": 99}],
            "budgets": {"2026-10": 30000},
        }
        self.assertEqual(self.send("import", valid).status_code, 200)
        self.assertEqual(Transaction.objects.get(user=self.a).amount, 99)
        self.assertEqual(Transaction.objects.get(user=self.b).amount, 1250)

    def test_auth_and_csrf_protection(self):
        c = Client(enforce_csrf_checks=True)
        self.assertEqual(
            self.send(
                "login",
                {"username": "alice", "password": "valid-passphrase-49"},
                client=c,
            ).status_code,
            403,
        )
        token = c.get("/api/session/").json()["csrfToken"]
        result = c.post(
            "/api/login/",
            json.dumps({"username": "alice", "password": "valid-passphrase-49"}),
            content_type="application/json",
            HTTP_X_CSRFTOKEN=token,
        )
        self.assertEqual(result.status_code, 200)
        self.assertEqual(result.json()["user"]["username"], "alice")
        self.assertEqual(self.send("transactions", self.record, client=c).status_code, 403)
        self.assertEqual(
            c.post(
                "/api/transactions/",
                json.dumps(self.record),
                content_type="application/json",
                HTTP_X_CSRFTOKEN=result.json()["csrfToken"],
            ).status_code,
            201,
        )

    def test_registration_normalizes_usernames_and_hashes_passwords(self):
        self.client.logout()
        values = {
            "username": "NewPerson",
            "name": "New Person",
            "password": "New-strong-passphrase-88",
        }
        result = self.send("register", values)
        self.assertEqual(result.status_code, 201)
        user = get_user_model().objects.get(username="newperson")
        self.assertNotEqual(user.password, values["password"])
        self.assertTrue(user.check_password(values["password"]))
        self.client.logout()
        self.assertEqual(self.send("register", values).status_code, 409)

    def test_weak_passwords_rejected_and_login_limited(self):
        self.client.logout()
        self.assertEqual(
            self.send(
                "register",
                {"username": "newperson", "name": "N", "password": "password"},
            ).status_code,
            400,
        )
        for _ in range(20):
            self.send("login", {"username": "alice", "password": "incorrect"})
        self.assertEqual(
            self.send("login", {"username": "alice", "password": "incorrect"}).status_code,
            429,
        )

    def test_health_reaches_mysql(self):
        result = self.client.get("/api/health/")
        self.assertEqual(result.status_code, 200)
        self.assertEqual(result.json()["database"], "mysql")
