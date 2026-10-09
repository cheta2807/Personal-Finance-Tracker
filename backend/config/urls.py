from django.urls import path
from django.views.generic import TemplateView
from ledger import views

urlpatterns = [
    path("", TemplateView.as_view(template_name="index.html")),
    path("api/session/", views.session),
    path("api/register/", views.register),
    path("api/login/", views.sign_in),
    path("api/logout/", views.sign_out),
    path("api/data/", views.data),
    path("api/transactions/", views.transactions),
    path("api/transactions/<uuid:pk>/", views.transaction_detail),
    path("api/budget/", views.budget),
    path("api/import/", views.import_backup),
    path("api/health/", views.health),
]
