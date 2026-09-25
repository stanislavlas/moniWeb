#!/usr/bin/with-contenv bashio

bashio::log.info "Starting Moni Web..."

# Ensure nginx runtime directories exist
mkdir -p /run/nginx /var/log/nginx

exec nginx -g "daemon off;"
