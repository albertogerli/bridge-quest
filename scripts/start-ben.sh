#!/bin/bash
# Start BEN (Bridge Engine Neural) - Native macOS (Apple Silicon)
# REST API on port 8085

BEN_DIR="$HOME/Desktop/Personale/Bridge/ben/src"
PYTHON="$HOME/miniconda3/envs/BEN/bin/python"
LOG_FILE="/tmp/ben-all.log"

# Check python exists
if [ ! -f "$PYTHON" ]; then
  echo "ERROR: BEN conda environment not found at $PYTHON"
  echo "Create it with: CONDA_SUBDIR=osx-arm64 conda create -n BEN python=3.12"
  echo "Then: pip install tensorflow numpy flask gevent requests colorama"
  exit 1
fi

# Check BEN source exists
if [ ! -f "$BEN_DIR/gameapi.py" ]; then
  echo "ERROR: BEN source not found at $BEN_DIR"
  exit 1
fi

# Kill any existing BEN process
if pgrep -f "gameapi.py" > /dev/null 2>&1; then
  echo "Stopping existing BEN process..."
  pkill -f "gameapi.py"
  sleep 2
fi

echo "Starting BEN Bridge Engine (native arm64)..."
echo "REST API will be available at http://localhost:8085"
echo "Log: $LOG_FILE"
echo ""

cd "$BEN_DIR"
"$PYTHON" gameapi.py > "$LOG_FILE" 2>&1 &
BEN_PID=$!
echo "BEN PID: $BEN_PID"

# Wait for server to be ready
echo -n "Waiting for BEN to start"
for i in $(seq 1 30); do
  sleep 1
  echo -n "."
  if curl -s "http://localhost:8085/" > /dev/null 2>&1; then
    echo ""
    echo "BEN is ready! API: http://localhost:8085/"
    echo "To stop: kill $BEN_PID"
    exit 0
  fi
done

echo ""
echo "WARNING: BEN did not start within 30 seconds."
echo "Check log: tail -f $LOG_FILE"
exit 1
