#!/bin/bash
# Start BEN (Bridge Engine Neural) Docker container
# Exposes: REST API on port 8085, Web UI on port 8080, WebSocket on port 4443

echo "Starting BEN Bridge Engine..."
echo "REST API will be available at http://localhost:8085"
echo "Web UI will be available at http://localhost:8080"
echo ""

docker run --rm \
  --name ben-bridge \
  -p 8085:8085 \
  -p 8080:8080 \
  -p 4443:4443 \
  ghcr.io/lorserker/ben

echo ""
echo "BEN stopped."
