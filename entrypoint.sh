#!/bin/sh
set -e

# Ensure the data directory is writable by the app user.
# When Coolify (or any orchestrator) mounts a host volume,
# it may be owned by root, so we fix ownership here.
if [ "$(id -u)" = "0" ]; then
  chown -R app:app /data
  exec su-exec app "$@"
else
  exec "$@"
fi
