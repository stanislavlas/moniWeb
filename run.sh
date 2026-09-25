#!/usr/bin/with-contenv bashio

bashio::log.info "Starting Moni Web..."

exec nginx -g "daemon off;"
