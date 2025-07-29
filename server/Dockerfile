FROM python:3.13-slim-bullseye

# Set working directory
WORKDIR /app

# Install build dependencies and libpq
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       build-essential libpq-dev musl-dev postgresql-client \
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

CMD ["sh", "-c", "while true; do sleep 1000; done"]
