FROM php:8.3-fpm-alpine

# Nginx (estático) + supervisord para manejar nginx y php-fpm en el mismo contenedor
RUN apk add --no-cache nginx supervisor \
    && cp "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini" \
    && printf '[www]\nclear_env = no\n' > /usr/local/etc/php-fpm.d/zz-env.conf \
    && sed -i 's/^;error_log = log\/php-fpm.log/error_log = \/proc\/self\/fd\/2/' /usr/local/etc/php-fpm.conf

COPY docker/nginx-php.conf /etc/nginx/nginx.conf
COPY docker/supervisord.conf /etc/supervisord.conf

COPY sitio/ /usr/share/nginx/html/
RUN chmod -R a+rX /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1

CMD ["supervisord", "-c", "/etc/supervisord.conf"]
