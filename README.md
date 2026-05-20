# GLPI com Docker Compose

Deploy completo do GLPI (Gestão Livre de Parque de Informática) usando Docker Compose, com imagem customizada via Dockerfile e banco MariaDB.

## Stack

- **GLPI** — imagem customizada com Apache e configurações pré-ajustadas
- **MariaDB 10.5** — banco de dados com volume persistente
- **Docker Compose** — orquestração dos serviços

## Estrutura

```
.
├── Dockerfile           # Imagem customizada do GLPI com Apache
├── docker-compose.yml   # Orquestração dos serviços
├── 000-default.conf     # VirtualHost Apache
├── php.ini              # Configurações PHP ajustadas para o GLPI
├── local_define.php     # Definições de caminhos do GLPI
└── downstream.php       # Configuração de banco de dados
```

## Pré-requisitos

- Docker
- Docker Compose

## Como usar

```bash
git clone https://github.com/rafaelmotadasilva/glpi-docker-compose.git
cd glpi-docker-compose

docker compose up -d --build
```

Aguarde os containers subirem e acesse:

```
http://localhost
```

## Configuração padrão

| Variável | Valor padrão |
|---|---|
| Banco de dados | glpi |
| Usuário DB | glpi |
| Senha DB | glpi_pwd |
| Porta | 80 |

> Altere as credenciais no `docker-compose.yml` antes de usar em produção.

## Volumes persistentes

| Volume | Conteúdo |
|---|---|
| `glpi` | Arquivos da aplicação |
| `config` | Configurações |
| `files` | Uploads e anexos |
| `log` | Logs da aplicação |
| `db` | Dados do MariaDB |

## Parar os containers

```bash
docker compose down
```

Para remover também os volumes:

```bash
docker compose down -v
```
