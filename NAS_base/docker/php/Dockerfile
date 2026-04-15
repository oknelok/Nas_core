# NAS Stack — PHP 8.4-FPM image with Drupal 11 dependencies
FROM php:8.4-fpm

# System deps
RUN apt-get update && apt-get install -y \
    git \
    curl \
    unzip \
    vim \
    libpng-dev \
    libjpeg-dev \
    libwebp-dev \
    libfreetype6-dev \
    libzip-dev \
    libxml2-dev \
    libonig-dev \
    mariadb-client \
    && rm -rf /var/lib/apt/lists/*

# PHP extensions required by Drupal 11
RUN docker-php-ext-configure gd \
        --with-freetype \
        --with-jpeg \
        --with-webp \
    && docker-php-ext-install -j$(nproc) \
        gd \
        pdo \
        pdo_mysql \
        mbstring \
        xml \
        zip \
        opcache

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Drush Launcher
RUN curl -fsSL https://github.com/drush-ops/drush-launcher/releases/latest/download/drush.phar \
        -o /usr/local/bin/drush \
    && chmod +x /usr/local/bin/drush

WORKDIR /var/www/html

# php.ini tuning for Drupal
COPY docker/php/php.ini /usr/local/etc/php/conf.d/nas-drupal.ini

EXPOSE 9000
CMD ["php-fpm"]
