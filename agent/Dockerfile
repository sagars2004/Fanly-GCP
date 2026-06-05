FROM python:3.11-slim

# Install system utilities and Node.js (required for running npx `@elastic/mcp-server-elasticsearch`)
RUN apt-get update && apt-get install -y \
    curl \
    gnupg \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements first for Docker layer caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy agent codebase
COPY . /app/agent

# Add app to PYTHONPATH to resolve imports
ENV PYTHONPATH=/app
EXPOSE 8080

CMD ["uvicorn", "agent.api.main:app", "--host", "0.0.0.0", "--port", "8080"]
