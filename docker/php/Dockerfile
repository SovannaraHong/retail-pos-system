FROM php:8.5-fpm

# Install PHP extensions using the PHP extension installer.
# This avoids the previous docker-php-ext-install modules/* failure.
COPY --from=ghcr.io/mlocati/php-extension-installer:latest \
    /usr/bin/install-php-extensions \
    /usr/local/bin/

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        git \
        unzip \
    && install-php-extensions \
        pdo_mysql \
        bcmath \
        intl \
        opcache \
        zip \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY backend/ /var/www/html/

RUN mkdir -p \
    storage/framework/cache \
    storage/framework/sessions \
    storage/framework/views \
    storage/logs \
    bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache

EXPOSE 9000

CMD ["php-fpm"]