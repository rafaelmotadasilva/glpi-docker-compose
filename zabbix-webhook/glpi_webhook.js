// Zabbix → GLPI Webhook
// Cria chamado no PROBLEM, adiciona acompanhamento no UPDATE/ACK e resolve no RECOVERY.
//
// Parâmetros esperados (configurar no Media Type do Zabbix):
//   glpi_url, glpi_login, glpi_password, glpi_requester_id, glpi_assignee_id
//   trigger_name (use {EVENT.NAME} — suporta expressões macro), event_id, event_value
//   event_update, event_update_message, event_date, event_time
//   host_name, host_ip, host_groups, severity, severity_id, trigger_id, zabbix_url

var p        = JSON.parse(value);
var apiBase  = p.glpi_url + '/apirest.php';
var eventId  = p.event_id;
var eventVal = parseInt(p.event_value   || '1');   // 1=PROBLEM, 0=RECOVERY
var isUpd    = parseInt(p.event_update  || '0');   // 1=update/ack
var tag      = '[ZABBIX:' + eventId + ']';         // tag usada para localizar chamado existente

// ── Base64 (sem btoa nativo no Duktape) ──────────────────────────
function b64(s) {
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    var bytes = []; for (var i = 0; i < s.length; i++) bytes.push(s.charCodeAt(i));
    var out = '';
    for (var i = 0; i < bytes.length; i += 3) {
        var b0 = bytes[i], b1 = bytes[i+1] || 0, b2 = bytes[i+2] || 0;
        out += chars[b0 >> 2];
        out += chars[((b0 & 3) << 4) | (b1 >> 4)];
        out += i + 1 < bytes.length ? chars[((b1 & 15) << 2) | (b2 >> 6)] : '=';
        out += i + 2 < bytes.length ? chars[b2 & 63] : '=';
    }
    return out;
}

// ── HTTP helpers ──────────────────────────────────────────────────
function req(method, url, hdrs, body) {
    var r = new HttpRequest();
    for (var k in hdrs) r.addHeader(k + ': ' + hdrs[k]);
    var resp;
    if      (method === 'GET')  resp = r.get(url);
    else if (method === 'POST') resp = r.post(url, body || '{}');
    else if (method === 'PUT')  resp = r.put(url,  body || '{}');
    var code = r.getStatus();
    Zabbix.log(4, '[GLPI] ' + method + ' ' + url + ' → ' + code + ' | ' + resp.substring(0, 120));
    if (code >= 400) throw '[GLPI] ' + method + ' ' + url + ' falhou: ' + code + ' ' + resp;
    return JSON.parse(resp || '{}');
}

// ── 1. Autenticar na API do GLPI ─────────────────────────────────
var authHdr = 'Basic ' + b64(p.glpi_login + ':' + p.glpi_password);
var sess    = req('GET', apiBase + '/initSession', {
    'Authorization': authHdr,
    'Content-Type': 'application/json'
});
if (!sess.session_token) throw '[GLPI] Falha no login — verifique credenciais';
var sh = { 'Session-Token': sess.session_token, 'Content-Type': 'application/json' };

// ── 2. Mapear categoria pelo grupo do host ───────────────────────
var grps  = (p.host_groups || '').toLowerCase();
var catId = 307;  // padrão: Infra > Redes > Falha de Roteador/Switch
if      (grps.indexOf('linux')   > -1 || grps.indexOf('server')  > -1) catId = 298;
else if (grps.indexOf('access point') > -1 || grps.indexOf('wifi') > -1) catId = 428;

// Mapear severidade Zabbix → urgência GLPI (1-5)
var sevMap  = { '0': 1, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5 };
var urgency = sevMap[String(p.severity_id)] || 3;

// ── 3. Localizar chamado aberto pelo tag do evento ───────────────
function findTicket() {
    var url = apiBase + '/search/Ticket' +
        '?criteria[0][field]=1&criteria[0][searchtype]=contains&criteria[0][value]=' +
        encodeURIComponent(tag) + '&range=0-1';
    var r = new HttpRequest();
    r.addHeader('Session-Token: ' + sess.session_token);
    r.addHeader('Content-Type: application/json');
    var resp = JSON.parse(r.get(url) || '{}');
    if (resp && resp.totalcount > 0 && resp.data && resp.data[0]) return resp.data[0]['2'];
    return null;
}

var result = '';

// ── 4. RECOVERY → Resolver chamado ──────────────────────────────
if (eventVal === 0) {
    var tid = findTicket();
    if (tid) {
        var solContent =
            '<p><b>Problema resolvido automaticamente — Zabbix recuperou.</b></p>' +
            '<p><b>Host:</b> ' + p.host_name + ' (' + p.host_ip + ')</p>' +
            '<p><b>Horário:</b> ' + p.event_date + ' ' + p.event_time + '</p>';
        req('POST', apiBase + '/ITILSolution', sh, JSON.stringify({
            input: { itemtype: 'Ticket', items_id: tid, content: solContent, solutiontypes_id: 0 }
        }));
        req('PUT', apiBase + '/Ticket/' + tid, sh, JSON.stringify({ input: { status: 5 } }));
        result = 'Chamado #' + tid + ' resolvido';
    } else {
        result = 'Recuperação: nenhum chamado aberto encontrado para ' + tag;
    }

// ── 5. UPDATE/ACK → Adicionar acompanhamento ────────────────────
} else if (isUpd === 1) {
    var tid = findTicket();
    if (tid) {
        var msg = p.event_update_message || '(sem mensagem)';
        var fc  = '<p><b>Atualização Zabbix:</b> ' + msg + '</p>' +
                  '<p><em>' + p.event_date + ' ' + p.event_time + '</em></p>';
        req('POST', apiBase + '/ITILFollowup', sh, JSON.stringify({
            input: { itemtype: 'Ticket', items_id: tid, content: fc, is_private: 0 }
        }));
        result = 'Acompanhamento adicionado ao chamado #' + tid;
    } else {
        result = 'Update: chamado não encontrado para ' + tag;
    }

// ── 6. PROBLEM → Criar chamado ──────────────────────────────────
} else {
    var name    = tag + ' ' + p.trigger_name + ' — ' + p.host_name;
    var evtUrl  = p.zabbix_url + '/tr_events.php?triggerid=' + p.trigger_id + '&eventid=' + eventId;
    var content =
        '<p><b>Host:</b> ' + p.host_name + ' (' + p.host_ip + ')</p>' +
        '<p><b>Problema:</b> ' + p.trigger_name + '</p>' +
        '<p><b>Severidade:</b> ' + p.severity + '</p>' +
        '<p><b>Grupos:</b> ' + p.host_groups + '</p>' +
        '<p><b>Data/Hora:</b> ' + p.event_date + ' ' + p.event_time + '</p>' +
        '<p><b>Zabbix:</b> <a href="' + evtUrl + '">' + evtUrl + '</a></p>' +
        '<hr/><p><em>Chamado criado automaticamente pelo Zabbix. ID do evento: ' + eventId + '</em></p>';

    var t = req('POST', apiBase + '/Ticket', sh, JSON.stringify({ input: {
        name:                  name.substring(0, 255),
        content:               content,
        type:                  1,
        status:                2,
        urgency:               urgency,
        impact:                urgency,
        priority:              urgency,
        itilcategories_id:     catId,
        entities_id:           0,
        _users_id_requester:   parseInt(p.glpi_requester_id),
        _users_id_assign:      parseInt(p.glpi_assignee_id)
    }}));
    result = 'Chamado #' + t.id + ' criado: ' + name.substring(0, 60);
}

// ── 7. Encerrar sessão ───────────────────────────────────────────
try {
    var kr = new HttpRequest();
    kr.addHeader('Session-Token: ' + sess.session_token);
    kr.get(apiBase + '/killSession');
} catch (e) {}

return result;
