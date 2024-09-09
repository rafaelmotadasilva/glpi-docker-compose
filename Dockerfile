FROM ubuntu/apache2

LABEL maintainer="Rafael Mota <devops.rafaelmota@gmail.com>"

# Definindo variável de ambiente para o fuso horário UTC
ENV TZ=UTC

# Atualização e instalação de pacotes

RUN apt-get update \
    && apt-get upgrade -y \
    && apt-get install -y wget \
                          php \
                          php-mysqli \
                          php-dom \
                          php-simplexml \
                          php-curl \
                          php-gd \
                          php-intl \
                          php-ldap \
                          php-zip \
                          php-bz2 \
                          php-mbstring

# Ativando o módulo mod_rewrite
RUN a2enmod rewrite

# Download do arquivo GLPI e extração para /var/www/
RUN cd /tmp \
    && wget https://github.com/glpi-project/glpi/releases/download/10.0.12/glpi-10.0.12.tgz \
    && tar -xvzf glpi-10.0.12.tgz \
    && cp -Rf glpi /var/www \
    && cp -Rf /var/www/glpi/config /etc/glpi \
    && cp -Rf /var/www/glpi/files /var/lib/glpi 

# Definição de permissões

RUN mkdir /var/log/glpi \
    && chmod -R 777 /etc/glpi /var/lib/glpi /var/log/glpi \
    && chown www-data. /var/www/glpi/marketplace

# Movimentação de arquivos de configuração
COPY php.ini /etc/php/8.3/apache2/
COPY 000-default.conf /etc/apache2/sites-available/
COPY downstream.php /var/www/glpi/inc/
COPY local_define.php /etc/glpi/

# Validação da configuração do Apache
RUN apache2ctl configtest

LABEL description="rafaelmotadasilva/glpi"
LABEL version="2.0.0"

EXPOSE 80 443

