#!/bin/sh
set -e

# Asegurar permisos de escritura en los directorios mutables montados por volumen
mkdir -p /usr/share/nginx/html/assets/img/uploads /usr/share/nginx/html/data/leads
chmod -R a+rwX /usr/share/nginx/html/assets/img/uploads /usr/share/nginx/html/data 2>/dev/null || true
chown -R www-data:www-data /usr/share/nginx/html/assets/img/uploads /usr/share/nginx/html/data 2>/dev/null || true

exec "$@"
