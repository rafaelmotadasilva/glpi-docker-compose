# Zabbix → GLPI Webhook

Script de webhook para o Zabbix que abre, atualiza e resolve chamados no GLPI automaticamente com base em eventos de monitoramento.

## Funcionalidades

- **PROBLEM** → Abre chamado no GLPI com detalhes do host e do problema
- **UPDATE/ACK** → Adiciona acompanhamento ao chamado existente
- **RECOVERY** → Adiciona solução e resolve o chamado automaticamente

O chamado é vinculado ao evento pelo tag `[ZABBIX:{event_id}]` no título, permitindo recuperação exata mesmo com múltiplos chamados abertos.

## Configuração no Zabbix

### 1. Criar o Media Type

Em **Administração → Media Types**, crie um novo tipo:

- **Tipo:** Webhook
- **Nome:** GLPI
- **Script:** cole o conteúdo de `glpi_webhook.js`

### 2. Parâmetros obrigatórios

| Parâmetro | Valor Zabbix |
|---|---|
| `glpi_url` | URL base do GLPI (ex: `http://glpi.empresa.local`) |
| `glpi_login` | Usuário GLPI com acesso à API REST |
| `glpi_password` | Senha do usuário |
| `glpi_requester_id` | ID numérico do solicitante padrão |
| `glpi_assignee_id` | ID numérico do técnico responsável padrão |
| `trigger_name` | `{EVENT.NAME}` ⚠️ usar EVENT, não TRIGGER |
| `event_id` | `{EVENT.ID}` |
| `event_value` | `{EVENT.VALUE}` |
| `event_update` | `{EVENT.UPDATE.STATUS}` |
| `event_update_message` | `{EVENT.UPDATE.MESSAGE}` |
| `event_date` | `{EVENT.DATE}` |
| `event_time` | `{EVENT.TIME}` |
| `host_name` | `{HOST.NAME}` |
| `host_ip` | `{HOST.IP}` |
| `host_groups` | `{TRIGGER.HOSTGROUP.NAME}` |
| `severity` | `{TRIGGER.SEVERITY}` |
| `severity_id` | `{TRIGGER.NSEVERITY}` |
| `trigger_id` | `{TRIGGER.ID}` |
| `zabbix_url` | URL do Zabbix (ex: `http://zabbix.empresa.local`) |

> **Por que `{EVENT.NAME}` e não `{TRIGGER.NAME}`?**
> O `{TRIGGER.NAME}` não resolve expressões macro como `{?last(/host/key)}`.
> O `{EVENT.NAME}` resolve, então o título do chamado exibe o valor real do item.

### 3. Habilitar API REST no GLPI

Em **Configuração → Geral → API**:
- Habilitar API REST: **Sim**
- Habilitar login com credenciais: **Sim**
- URL de acesso: anote para usar no parâmetro `glpi_url`

### 4. Criar usuário de API no GLPI

Crie um usuário técnico com perfil mínimo para abrir e resolver chamados.
Use o ID desse usuário em `glpi_requester_id` e `glpi_assignee_id`.

### 5. Vincular o Media Type a um usuário

Em **Administração → Usuários**, edite o usuário Zabbix que receberá as notificações,
adicione o media type **GLPI** com **Quando PROBLEM** e **Quando RECOVERY** habilitados.

### 6. Criar ação de alerta

Em **Configuração → Ações → Trigger actions**, crie uma ação que:
- Envie para o usuário configurado
- Use o Media Type GLPI

## Mapeamento de categorias

O webhook mapeia o grupo do host para categorias do GLPI:

| Grupo Zabbix (contém) | Categoria GLPI |
|---|---|
| `linux`, `server` | ID 298 |
| `access point`, `wifi` | ID 428 |
| padrão | ID 307 (Roteador/Switch) |

Ajuste os IDs de categoria no script conforme a estrutura do seu GLPI.

## Integração com Bacula

Para usar este webhook com alertas de backup do Bacula, consulte:
[bacula → zabbix-glpi-integration](https://github.com/rafaelmotadasilva/bacula/tree/main/zabbix-glpi-integration)
