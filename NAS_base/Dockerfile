# ── Stage 1: Composer create-project + contrib modules ───────────────────────
FROM composer:2 AS composer

WORKDIR /app

RUN composer create-project drupal/recommended-project . \
    --no-interaction \
    --no-install \
 && composer config process-timeout 0 \
 && composer config minimum-stability beta \
 && composer config prefer-stable true \
 && composer require \
    drupal/maestro:^4 \
    drupal/webform:^6.3 \
    drush/drush:^13 \
    drupal/module_filter \
    drupal/admin_toolbar \
    drupal/key \
    drupal/ai \
    drupal/webform_rest \
    drupal/views_data_export \
    drupal/restui \
    drupal/jsonapi_extras \
    drupal/simple_oauth \
    --no-interaction \
 && composer install \
    --no-dev \
    --optimize-autoloader \
    --no-interaction \
    --prefer-dist

# ── Stage 2: Runtime ──────────────────────────────────────────────────────────
FROM php:8.4-apache AS runner

# PHP extensions required by Drupal 11
RUN apt-get update && apt-get install -y \
    libpng-dev \
    libjpeg-dev \
    libwebp-dev \
    libfreetype6-dev \
    libzip-dev \
    libxml2-dev \
    libonig-dev \
    libpq-dev \
    curl \
    git \
    unzip \
    mariadb-client \
 && docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp \
 && docker-php-ext-install -j$(nproc) \
    gd \
    opcache \
    pdo \
    pdo_mysql \
    mbstring \
    zip \
    xml \
    bcmath \
    exif \
 && rm -rf /var/lib/apt/lists/*

# Enable Apache mod_rewrite (required by Drupal)
RUN a2enmod rewrite

# Configure Apache docroot to point at Drupal web/
ENV APACHE_DOCUMENT_ROOT=/var/www/html/web
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' \
    /etc/apache2/sites-available/*.conf \
    /etc/apache2/apache2.conf \
    /etc/apache2/conf-available/*.conf

WORKDIR /var/www/html

# Copy full Drupal project from build stage
COPY --from=composer /app ./

# Drupal needs a writable files directory and default settings
RUN mkdir -p web/sites/default/files \
 && cp web/sites/default/default.settings.php web/sites/default/settings.php \
 && chown -R www-data:www-data web/sites/default/files web/sites/default/settings.php

EXPOSE 80

HEALTHCHECK --interval=10s --timeout=5s --retries=10 --start-period=30s \
  CMD curl -f http://localhost/ || exit 1
