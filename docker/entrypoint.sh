#!/bin/sh
set -e

# Default values (Railway will override PORT)
: "${PORT:=8080}"
: "${DATA_DIR:=/data}"

# Create data directory and set permissions
mkdir -p "$DATA_DIR"
chown -R pocketbase:pocketbase "$DATA_DIR"

# Start PocketBase as non-root user
exec su-exec pocketbase /usr/local/bin/pocketbase serve \
  --http=0.0.0.0:${PORT} \
  --dir="${DATA_DIR}"
