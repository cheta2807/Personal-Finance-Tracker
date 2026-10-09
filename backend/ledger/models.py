import uuid

from django.conf import settings
from django.db import models


class Transaction(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    description = models.CharField(max_length=100)
    amount = models.BigIntegerField()
    type = models.CharField(max_length=7, choices=[("income", "Income"), ("expense", "Expense")])
    category = models.CharField(max_length=20)
    date = models.DateField()

    class Meta:
        ordering = ["-date", "-id"]
        indexes = [models.Index(fields=["user", "date"])]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(amount__gt=0, amount__lte=100000000000),
                name="transaction_positive_amount",
            )
        ]


class Budget(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    month = models.DateField()
    amount = models.BigIntegerField()

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["user", "month"], name="user_month_budget"),
            models.CheckConstraint(
                condition=models.Q(amount__gt=0, amount__lte=100000000000),
                name="budget_positive_amount",
            ),
        ]
