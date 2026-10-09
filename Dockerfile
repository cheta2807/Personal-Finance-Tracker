FROM node:24-bookworm-slim AS frontend
WORKDIR /build/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
ENV VITE_DEMO_ONLY=false
RUN npm run build

FROM python:3.12-slim-bookworm
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends gcc pkg-config default-libmysqlclient-dev && rm -rf /var/lib/apt/lists/*
COPY backend/requirements.lock ./backend/requirements.lock
RUN pip install --no-cache-dir -r backend/requirements.lock
COPY backend/ ./backend/
COPY --from=frontend /build/frontend/dist ./frontend/dist
RUN DJANGO_SECRET_KEY=collectstatic-build-placeholder python backend/manage.py collectstatic --noinput && useradd --create-home mintbook && chmod -R a+rX /app
USER mintbook
WORKDIR /app/backend
EXPOSE 8000
CMD ["sh", "-c", "python manage.py migrate --noinput && gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 1 --threads 4 --access-logfile -"]
