import json
import re
from datetime import date
from functools import wraps

from django.contrib.auth import authenticate, get_user_model, login, logout
from django.contrib.auth.password_validation import validate_password
from django.core.cache import cache
from django.core.exceptions import RequestDataTooBig, ValidationError
from django.db import DatabaseError, IntegrityError, connection, transaction
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.views.decorators.http import require_http_methods

from .models import Budget, Transaction

CATEGORIES = [
    "Housing",
    "Food",
    "Transport",
    "Shopping",
    "Health",
    "Entertainment",
    "Salary",
    "Other",
]
MAX_RECORDS = 10000


def error(message, status=400):
    return JsonResponse({"error": message}, status=status)


def csrf_failure(request, reason=""):
    return error("Session expired. Refresh the page and try again.", 403)


def endpoint(methods, authenticated=True):
    def decorate(fn):
        @wraps(fn)
        @require_http_methods(methods)
        def wrapped(request, *args, **kwargs):
            if authenticated and not request.user.is_authenticated:
                return error("Please sign in.", 401)
            try:
                return fn(request, *args, **kwargs)
            except (
                ValueError,
                TypeError,
                KeyError,
                ValidationError,
                RequestDataTooBig,
            ) as exc:
                return error(
                    "; ".join(exc.messages) if isinstance(exc, ValidationError) else str(exc)
                )

        return wrapped

    return decorate


def body(request):
    try:
        value = json.loads(request.body)
    except (json.JSONDecodeError, UnicodeDecodeError):
        raise ValueError("Send valid JSON.")
    if not isinstance(value, dict):
        raise ValueError("Expected a JSON object.")
    return value


def amount(value):
    if type(value) is not int or not 0 < value <= 100000000000:
        raise ValueError("Amount must be positive integer paise, at most ₹1,00,00,00,000.00.")
    return value


def month(value):
    if not isinstance(value, str) or not re.fullmatch(r"\d{4}-(0[1-9]|1[0-2])", value):
        raise ValueError("Use a valid YYYY-MM month.")
    return date.fromisoformat(value + "-01")


def transaction_values(value):
    if not isinstance(value, dict):
        raise ValueError("Invalid transaction.")
    description = value.get("description")
    if not isinstance(description, str) or not 1 <= len(description.strip()) <= 100:
        raise ValueError("Description must be 1–100 characters.")
    if value.get("type") not in ["income", "expense"] or value.get("category") not in CATEGORIES:
        raise ValueError("Invalid transaction type or category.")
    day = value.get("date")
    if not isinstance(day, str) or not re.fullmatch(r"\d{4}-\d{2}-\d{2}", day):
        raise ValueError("Use a valid YYYY-MM-DD date.")
    return {
        "description": description.strip(),
        "amount": amount(value.get("amount")),
        "type": value["type"],
        "category": value["category"],
        "date": date.fromisoformat(day),
    }


def serialize(t):
    return {
        "id": str(t.id),
        "description": t.description,
        "amount": t.amount,
        "type": t.type,
        "category": t.category,
        "date": t.date.isoformat(),
    }


def state(user):
    return {
        "version": 1,
        "transactions": [serialize(t) for t in Transaction.objects.filter(user=user)],
        "budgets": {b.month.strftime("%Y-%m"): b.amount for b in Budget.objects.filter(user=user)},
    }


def account(user):
    return {"username": user.username, "name": user.first_name or user.username}


def throttle(request):
    # One Gunicorn worker in the bundled deployment. Use shared Redis cache and
    # an edge rate limiter before scaling to multiple workers/instances.
    key = "auth:" + request.META.get("REMOTE_ADDR", "unknown")
    cache.add(key, 0, 300)
    try:
        count = cache.incr(key)
    except ValueError:
        cache.set(key, 1, 300)
        count = 1
    return count > 20


@endpoint(["GET"], False)
def session(request):
    return JsonResponse(
        {
            "user": account(request.user) if request.user.is_authenticated else None,
            "csrfToken": get_token(request),
        }
    )


@endpoint(["POST"], False)
def register(request):
    if throttle(request):
        return error("Too many attempts. Try again in five minutes.", 429)
    values = body(request)
    username = values.get("username", "")
    password = values.get("password", "")
    name = values.get("name", "")
    if not isinstance(username, str) or not re.fullmatch(r"[a-zA-Z0-9_]{3,30}", username):
        raise ValueError("Username must be 3–30 letters, numbers, or underscores.")
    if not isinstance(name, str) or not 1 <= len(name.strip()) <= 60:
        raise ValueError("Enter a name, up to 60 characters.")
    if not isinstance(password, str) or len(password) > 128:
        raise ValueError("Invalid password.")
    User = get_user_model()
    user = User(username=username.lower(), first_name=name.strip())
    validate_password(password, user)
    user.set_password(password)
    try:
        user.save()
    except IntegrityError:
        return error("This username is unavailable.", 409)
    login(request, user)
    return JsonResponse({"user": account(user), "csrfToken": get_token(request)}, status=201)


@endpoint(["POST"], False)
def sign_in(request):
    if throttle(request):
        return error("Too many attempts. Try again in five minutes.", 429)
    values = body(request)
    username = values.get("username")
    password = values.get("password")
    if (
        not isinstance(username, str)
        or not isinstance(password, str)
        or len(username) > 30
        or len(password) > 128
    ):
        return error("Invalid username or password.", 401)
    user = authenticate(request, username=username.lower(), password=password)
    if user is None:
        return error("Invalid username or password.", 401)
    login(request, user)
    return JsonResponse({"user": account(user), "csrfToken": get_token(request)})


@endpoint(["POST"])
def sign_out(request):
    logout(request)
    return JsonResponse({"ok": True, "csrfToken": get_token(request)})


@endpoint(["GET"])
def data(request):
    return JsonResponse(state(request.user))


@endpoint(["POST"])
def transactions(request):
    values = transaction_values(body(request))
    with transaction.atomic():
        get_user_model().objects.select_for_update().get(pk=request.user.pk)
        if Transaction.objects.filter(user=request.user).count() >= MAX_RECORDS:
            raise ValueError("Transaction limit reached (10,000).")
        entry = Transaction.objects.create(user=request.user, **values)
    return JsonResponse(serialize(entry), status=201)


@endpoint(["PUT", "DELETE"])
def transaction_detail(request, pk):
    try:
        entry = Transaction.objects.get(pk=pk, user=request.user)
    except Transaction.DoesNotExist:
        return error("Transaction not found.", 404)
    if request.method == "DELETE":
        entry.delete()
        return JsonResponse({"ok": True})
    for k, v in transaction_values(body(request)).items():
        setattr(entry, k, v)
    entry.save()
    return JsonResponse(serialize(entry))


@endpoint(["PUT"])
def budget(request):
    values = body(request)
    Budget.objects.update_or_create(
        user=request.user,
        month=month(values.get("month")),
        defaults={"amount": amount(values.get("amount"))},
    )
    return JsonResponse({"ok": True})


@endpoint(["POST"])
def import_backup(request):
    values = body(request)
    records = values.get("transactions")
    budgets = values.get("budgets")
    if (
        values.get("version") != 1
        or not isinstance(records, list)
        or len(records) > MAX_RECORDS
        or not isinstance(budgets, dict)
        or len(budgets) > 1200
    ):
        raise ValueError("Invalid backup format or too many records.")
    entries = [Transaction(user=request.user, **transaction_values(t)) for t in records]
    limits = [
        Budget(user=request.user, month=month(m), amount=amount(n)) for m, n in budgets.items()
    ]
    with transaction.atomic():
        get_user_model().objects.select_for_update().get(pk=request.user.pk)
        Transaction.objects.filter(user=request.user).delete()
        Budget.objects.filter(user=request.user).delete()
        Transaction.objects.bulk_create(entries)
        Budget.objects.bulk_create(limits)
    return JsonResponse(state(request.user))


@endpoint(["GET"], False)
def health(request):
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
    except DatabaseError:
        return error("Database unavailable.", 503)
    return JsonResponse({"status": "ok", "database": "mysql"})
