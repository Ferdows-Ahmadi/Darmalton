FROM python:3.13.7-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

RUN addgroup --system --gid 10001 darmalton \
    && adduser --system --uid 10001 --ingroup darmalton --home /app darmalton

COPY requirements.txt /tmp/requirements.txt
RUN pip install --upgrade pip && pip install -r /tmp/requirements.txt

COPY . /app/
RUN mkdir -p /app/media /app/private_media /app/staticfiles \
    && python manage.py collectstatic --noinput \
    && chown -R darmalton:darmalton /app/media /app/private_media /app/staticfiles

EXPOSE 8000

ENTRYPOINT ["python", "/app/production_entrypoint.py"]
CMD ["gunicorn", "pharmacy.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3", "--timeout", "60", "--access-logfile", "-", "--error-logfile", "-"]
