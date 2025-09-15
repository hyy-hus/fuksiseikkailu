FROM python:3.13-slim-bookworm

# Set working directory
WORKDIR /app

# Install build dependencies and libpq
RUN apt-get update && apt-get install -y --no-install-recommends wget ca-certificates gnupg \
 && echo "deb http://apt.postgresql.org/pub/repos/apt bookworm-pgdg main" > /etc/apt/sources.list.d/pgdg.list \
 && wget -qO- https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor > /etc/apt/trusted.gpg.d/pgdg.gpg \
 && apt-get update \
 && apt-get install -y --no-install-recommends postgresql-client-17 libpq5 libpq-dev build-essential \
 && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copy the application code
COPY . .

# Expose ports
EXPOSE 8000

# Run entrypoint
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]

# CMD ["sh", "-c", "while true; do sleep 1000; done"]
