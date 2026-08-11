/**
 * Prova de COMPORTAMENTO do template, não de aparência.
 *
 *   node probe_page.mjs /caminho/index.html /pasta/onde/salvar/os/prints
 *
 * Sai com código 1 se qualquer verificação falhar.
 *
 * Por que isto existe: quase toda falha desta pilha é calada. Botão principal
 * com texto da mesma cor do fundo. CTA empurrado pra fora da primeira tela por
 * uma headline longa. Eixo de alinhamento pulando. Página dizendo "inscrição
 * confirmada" com a internet desligada. Um <em> apagado num passe de limpeza
 * que faz o botão parar de responder pra sempre. Nada disso aparece num
 * screenshot, e tudo isso foi achado por este arquivo.
 *
 * O bloco de SABOTAGENS é o mais valioso: cada caso é um gesto real de
 * redesign, e o critério é sempre o mesmo. Ou funciona, ou grita na tela.
 * Clique que não faz nada é reprovação.
 */
import { writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';

const FILE = process.argv[2];
const OUT = process.argv[3] || '/tmp';
const PORT = 9223;

// Usa um Chrome que já esteja escutando na porta; se não houver, sobe um.
// Em ambiente com sandbox de processo, subir daqui pode ser bloqueado. Nesse
// caso rode antes, num terminal separado:
//   google-chrome --headless=new --no-sandbox --allow-file-access-from-files \
//     --remote-debugging-port=9223 --user-data-dir=/tmp/cdp-probe about:blank
let chrome = { kill(){} };
try {
  await fetch(`http://127.0.0.1:${PORT}/json/version`);
} catch {
  chrome = spawn('google-chrome', [
    '--headless=new', `--remote-debugging-port=${PORT}`, '--no-first-run',
    '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
    '--allow-file-access-from-files', '--user-data-dir=/tmp/cdp-probe', 'about:blank',
  ], { stdio: 'ignore', detached: true });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function targets() {
  const r = await fetch(`http://127.0.0.1:${PORT}/json/list`);
  return r.json();
}

let ws, id = 0;
const pending = new Map();
const netLog = [];
const consoleLog = [];

function send(method, params = {}, sessionId) {
  const msgId = ++id;
  return new Promise((res, rej) => {
    pending.set(msgId, { res, rej });
    ws.send(JSON.stringify({ id: msgId, method, params, ...(sessionId ? { sessionId } : {}) }));
  });
}

let sessionId;
async function evaluate(expression) {
  const r = await send('Runtime.evaluate', {
    expression, awaitPromise: true, returnByValue: true, userGesture: true,
  }, sessionId);
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || 'eval error');
  return r.result?.value;
}

const results = [];
function check(name, pass, detail = '') {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  ::  ' + detail : ''}`);
}

(async () => {
  // espera o chrome subir
  for (let i = 0; i < 60; i++) {
    try { await targets(); break; } catch { await sleep(200); }
  }
  const list = await targets();
  const page = list.find(t => t.type === 'page');
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener('open', r));

  ws.addEventListener('message', ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) {
      const { res, rej } = pending.get(m.id);
      pending.delete(m.id);
      if (m.error) { rej(new Error(m.error.message)); } else { res(m.result); }
    } else if (m.method === 'Network.requestWillBeSent') {
      netLog.push(m.params.request.url);
    } else if (m.method === 'Runtime.consoleAPICalled' || m.method === 'Log.entryAdded') {
      consoleLog.push(JSON.stringify(m.params).slice(0, 300));
    } else if (m.method === 'Runtime.exceptionThrown') {
      consoleLog.push('EXCEPTION ' + JSON.stringify(m.params.exceptionDetails?.text || '').slice(0, 300));
    }
  });

  await send('Network.enable');
  await send('Runtime.enable');
  await send('Log.enable');
  await send('Page.enable');

  async function load() {
    netLog.length = 0;
    await send('Page.navigate', { url: 'file://' + FILE });
    await sleep(1400);
  }

  async function fill({ name = 'Maria Teste', email = 'maria@exemplo.com.br', phone = '(11) 98888-7777', consent = true, hp = '' } = {}) {
    return evaluate(`(() => {
      const f = document.getElementById('form-inscricao');
      f.elements.name.value = ${JSON.stringify(name)};
      f.elements.email.value = ${JSON.stringify(email)};
      f.elements.phone.value = ${JSON.stringify(phone)};
      f.elements.website.value = ${JSON.stringify(hp)};
      f.elements.consent.checked = ${consent};
      return true;
    })()`);
  }

  const submit = () => evaluate(`(async () => {
    document.getElementById('btn-inscrever').click();
    await new Promise(r => setTimeout(r, 700));
    const ok = document.getElementById('msg-ok'), er = document.getElementById('msg-err');
    return { ok: ok.hidden ? null : ok.textContent, err: er.hidden ? null : er.textContent };
  })()`);

  // ---------- 1. degrau 0 ----------
  await load();
  await fill();
  let r = await submit();
  check('degrau 0 · mostra sucesso', !!r.ok, (r.ok || '').slice(0, 60));
  check('degrau 0 · abre o payload', /"phone"/.test(r.ok || ''), '');
  check('degrau 0 · normaliza o telefone p/ 5511988887777',
    /5511988887777/.test(r.ok || ''), (r.ok || '').match(/"phone":\s*"[^"]*"/)?.[0] || 'não achou');
  check('degrau 0 · NÃO manda created_at', !/created_at/.test(r.ok || ''));
  check('degrau 0 · congela o consent_text', /"consent_text":\s*"C/.test(r.ok || ''));
  check('degrau 0 · nenhuma requisição de rede saiu',
    !netLog.some(u => !u.startsWith('file:') && !u.includes('fonts.g')), netLog.filter(u => !u.startsWith('file:')).join(' '));

  // ---------- 2. o teste da mentira ----------
  await load();
  await evaluate(`CONFIG.SUPABASE_URL = 'https://naoexiste-cdv-teste.supabase.co'; CONFIG.SUPABASE_KEY = 'lixo'; true`);
  await fill();
  r = await submit();
  await sleep(2500);
  r = await evaluate(`(() => { const ok=document.getElementById('msg-ok'), er=document.getElementById('msg-err');
    return { ok: ok.hidden?null:ok.textContent, err: er.hidden?null:er.textContent }; })()`);
  check('teste da mentira · NÃO diz confirmado', !/confirmada/i.test(r.ok || ''), (r.ok || '').slice(0, 70));
  check('teste da mentira · mostra erro', !!r.err, (r.err || '').slice(0, 90));

  // ---------- 3. consentimento desmarcado ----------
  await load();
  await fill({ consent: false });
  const netBefore = netLog.filter(u => !u.startsWith('file:') && !u.includes('fonts.g')).length;
  await submit();
  const netAfter = netLog.filter(u => !u.startsWith('file:') && !u.includes('fonts.g')).length;
  check('consentimento desmarcado · ZERO requisição', netBefore === netAfter, `${netBefore} -> ${netAfter}`);
  const invalid = await evaluate(`!document.getElementById('form-inscricao').elements.consent.validity.valid`);
  check('consentimento desmarcado · navegador barra antes', invalid === true);

  // ---------- 4. honeypot ----------
  await load();
  await fill({ hp: 'http://spam.example' });
  const nb = netLog.filter(u => !u.startsWith('file:') && !u.includes('fonts.g')).length;
  r = await submit();
  const na = netLog.filter(u => !u.startsWith('file:') && !u.includes('fonts.g')).length;
  check('honeypot · não dispara requisição', nb === na);
  check('honeypot · finge sucesso pro robô', !!r.ok);

  // ---------- 5. telefone inválido ----------
  await load();
  await fill({ phone: '999' });
  r = await submit();
  const perr = await evaluate(`(() => { const e=document.getElementById('err-phone'); return e.hidden?null:e.textContent; })()`);
  check('telefone curto · erro no campo, não no banco', !!perr, perr || '');

  // ---------- 6. duplo clique ----------
  await load();
  await evaluate(`CONFIG.WEBHOOK_URL='https://httpstat.us/200'; true`);
  await fill();
  const clicks = await evaluate(`(async () => {
    const b = document.getElementById('btn-inscrever');
    b.click(); const travou = b.disabled; b.click();
    return travou;
  })()`);
  check('duplo clique · botão trava no primeiro', clicks === true);

  // ---------- 7. contraste computado, varredura completa ----------
  // Medir cinco elementos escolhidos a dedo é medir onde eu já olhei. Esta
  // varredura passa em TODO elemento que tem texto próprio e resolve o fundo
  // subindo a árvore até achar um que não seja transparente.
  await load();
  const ruins = await evaluate(`(() => {
    function lin(c){c/=255;return c<=.03928?c/12.92:Math.pow((c+.055)/1.055,2.4);}
    function parse(s){const m=(s||'').match(/[\\d.]+/g);return m?m.map(Number):null;}
    function L(rgb){return .2126*lin(rgb[0])+.7152*lin(rgb[1])+.0722*lin(rgb[2]);}
    function ratio(a,b){const l1=L(a),l2=L(b);return (Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05);}
    function fundo(el){
      let n=el;
      while(n && n!==document.documentElement){
        const c=parse(getComputedStyle(n).backgroundColor);
        if(c && (c.length<4 || c[3]>0.5)) return c;
        n=n.parentElement;
      }
      return [255,255,255];
    }
    const out=[];
    for(const el of document.querySelectorAll('body *')){
      const temTexto=[...el.childNodes].some(n=>n.nodeType===3 && n.textContent.trim().length>1);
      if(!temTexto) continue;
      const cs=getComputedStyle(el);
      if(cs.visibility==='hidden'||cs.display==='none'||el.closest('[hidden]')) continue;
      const cor=parse(cs.color); if(!cor) continue;
      const px=parseFloat(cs.fontSize), peso=parseInt(cs.fontWeight)||400;
      const grande = px>=24 || (px>=18.66 && peso>=700);
      const r=ratio(cor,fundo(el));
      const piso = grande?3:4.5;
      if(r<piso) out.push({
        sel: el.tagName.toLowerCase()+(el.className?'.'+String(el.className).split(' ')[0]:''),
        r: r.toFixed(2), piso, px: Math.round(px),
        txt: el.textContent.trim().slice(0,34)
      });
    }
    return out;
  })()`);
  check('contraste · varredura completa da página', ruins.length === 0,
    ruins.map(x => `${x.sel} ${x.r}<${x.piso} "${x.txt}"`).join(' | ') || 'todos acima do piso');

  // placeholder tem regra própria e não tem nó de texto, então vai à parte
  const ph = await evaluate(`(() => {
    function lin(c){c/=255;return c<=.03928?c/12.92:Math.pow((c+.055)/1.055,2.4);}
    function P(s){const m=(s||'').match(/[\\d.]+/g);return m.map(Number);}
    function L(v){return .2126*lin(v[0])+.7152*lin(v[1])+.0722*lin(v[2]);}
    const i=document.querySelector('.f input');
    const cor=P(getComputedStyle(i,'::placeholder').color), bg=P(getComputedStyle(i).backgroundColor);
    const l1=L(cor),l2=L(bg);
    return +(((Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05)).toFixed(2));
  })()`);
  check('contraste · placeholder >= 4.5', ph >= 4.5, ph + ':1');

  // ---------- 6b. sabotagens: o que uma rodada de estética faz ----------
  // Cada caso abaixo é um gesto real de redesign. Nenhum deles pode produzir
  // "clique que não faz nada". Ou funciona, ou grita na tela.
  const fs = await import('node:fs');
  const path = await import('node:path');
  const base = fs.readFileSync(FILE, 'utf8');
  const SABOTAGENS = [
    ['tirou o <em> de erro do telefone', s => s.replace(/<em class="field-err"[^>]*><\/em>/, '')],
    ['renomeou o id do form', s => s.replace('id="form-inscricao"', 'id="inscricao-form"')],
    ['tirou o id do texto de consentimento', s => s.replace('id="consent-text"', 'class="consent-text"')],
    ['renomeou name="name" pra name="nome"', s => s.replace('name="name"', 'name="nome"')],
    ['tirou o required da caixinha de consentimento', s => s.replace('name="consent" required', 'name="consent"')],
  ];
  for (const [nome, sabota] of SABOTAGENS) {
   try {
    const alvo = path.resolve(OUT, 'sabotado.html');   // absoluto: file://./x não existe
    fs.writeFileSync(alvo, sabota(base));
    netLog.length = 0;
    const marcado = !/required/.test(nome);   // no caso do required, testamos desmarcado
    await send('Page.navigate', { url: 'file://' + alvo });
    await sleep(1200);
    const r2 = await evaluate(`(async () => {
      const f = document.getElementById('form-inscricao') || document.getElementById('inscricao-form') || document.querySelector('form');
      if (f) {
        for (const [k, v] of [['name','Maria'],['nome','Maria'],['email','m@e.com.br'],['phone','(11) 98888-7777']]) {
          if (f.elements[k]) f.elements[k].value = v;
        }
        if (f.elements.consent) f.elements.consent.checked = ${marcado};
      }
      const b = document.getElementById('btn-inscrever') || document.querySelector('button[type=submit]');
      if (b) b.click();
      await new Promise(r => setTimeout(r, 800));
      const ok = document.getElementById('msg-ok'), er = document.getElementById('msg-err');
      return {
        ok: ok && !ok.hidden ? ok.textContent.trim() : null,
        err: er && !er.hidden ? er.textContent.trim() : null,
        gritou: !!document.querySelector('[role=alert]:not([hidden])'),
        urlComPii: /name=|email=|nome=/.test(location.search),
      };
    })()`);
    const mudo = !r2.ok && !r2.err && !r2.gritou;
    check(`sabotagem · ${nome}: NÃO fica muda`, !mudo,
      mudo ? 'clique não produziu nada' : (r2.err || r2.ok || 'gritou na tela').slice(0, 70));
    check(`sabotagem · ${nome}: sem PII na URL`, !r2.urlComPii);
    if (/required/.test(nome)) {
      // Sem `required`, o navegador deixa passar. O código TEM que ler a caixinha
      // e recusar. Exigir prova POSITIVA: ou apareceu erro, ou o payload saiu com
      // consent_lgpd false. Ausência de payload não conta como passar.
      const recusou = /consentimento/i.test(r2.err || '');
      const semTrue = !/"consent_lgpd":\s*true/.test(r2.ok || '');
      check('sabotagem · sem required, o código LÊ a caixinha e recusa',
        recusou && semTrue, 'err=' + String(r2.err || '(nenhum)').slice(0, 60));
    }
   } catch (e) {
     // Navegou = o submit nativo escapou. Isso É o defeito, não um erro do teste.
     check(`sabotagem · ${nome}: NÃO navega sozinha`, false, String(e.message).slice(0, 70));
     pending.clear();
   }
  }
  await load();

  // ---------- 6c. telefone com DDD 55 (Santa Maria) ----------
  await load();
  await fill({ phone: '(55) 99123-4567' });
  const r55 = await submit();
  check('telefone · DDD 55 vira 5555991234567', /5555991234567/.test(r55.ok || ''),
    (r55.ok || r55.err || '').match(/"phone":\s*"[^"]*"/)?.[0] || (r55.err || '').slice(0, 60));

  // ---------- 7b. eixo de alinhamento ----------
  // Todo bloco de conteúdo tem que começar no mesmo x. `.wrap.narrow` centraliza
  // o bloco inteiro e move o texto pra direita, o que lê como erro de layout e
  // nenhum teste de contraste ou overflow acusa.
  await load();
  const eixos = await evaluate(`(() => {
    const xs = [...document.querySelectorAll('section > .wrap, header > .wrap')]
      .map(w => Math.round(w.getBoundingClientRect().left + parseFloat(getComputedStyle(w).paddingLeft)));
    return { xs, unicos: [...new Set(xs)] };
  })()`);
  check('alinhamento · todo bloco começa no mesmo eixo',
    eixos.unicos.length === 1, 'x = ' + eixos.unicos.join(', '));

  // ---------- 8. reduced motion ----------
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] }, sessionId);
  await load();
  const anims = await evaluate(`document.getAnimations().length`);
  check('prefers-reduced-motion · nenhuma animação', anims === 0, String(anims));
  await send('Emulation.setEmulatedMedia', { features: [] }, sessionId);

  // ---------- 9. screenshots ----------
  for (const [label, w, h] of [['desktop', 1440, 900], ['mobile', 390, 844]]) {
    await send('Emulation.setDeviceMetricsOverride', {
      width: w, height: h, deviceScaleFactor: 2, mobile: label === 'mobile',
    });
    await load();
    await sleep(900);
    const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    writeFileSync(`${OUT}/tpl-${label}.png`, Buffer.from(shot.data, 'base64'));
    // dobra: a data está visível sem rolar?
    const fold = await evaluate(`(() => {
      const el = document.querySelector('[data-evento="data"]');
      const r = el.getBoundingClientRect();
      return { visivel: r.top >= 0 && r.bottom <= innerHeight, top: Math.round(r.top), vh: innerHeight };
    })()`);
    check(`${label} · data visível na dobra`, fold.visivel, `top=${fold.top} vh=${fold.vh}`);
    // O gate que importa de verdade: o botão principal está na primeira tela?
    // Headline longa em português empurra o CTA pra fora e nada acusa.
    const cta = await evaluate(`(() => {
      const r = document.querySelector('.hero .btn').getBoundingClientRect();
      return { visivel: r.top >= 0 && r.bottom <= innerHeight, top: Math.round(r.top), vh: innerHeight };
    })()`);
    check(`${label} · CTA na primeira tela`, cta.visivel, `top=${cta.top} vh=${cta.vh}`);
    const linhas = await evaluate(`(() => {
      const h = document.querySelector('.hero h1');
      return Math.round(h.getBoundingClientRect().height / parseFloat(getComputedStyle(h).lineHeight));
    })()`);
    // Limiar diferente por breakpoint de propósito: no celular a coluna é
    // estreita e headline longa VAI quebrar mais. O que não pode é empurrar o
    // CTA pra fora, e isso o teste acima já cobre.
    const teto = label === 'mobile' ? 6 : 4;
    check(`${label} · headline em no máximo ${teto} linhas`, linhas <= teto, linhas + ' linhas');
    const overflow = await evaluate(`document.documentElement.scrollWidth > document.documentElement.clientWidth
      ? document.documentElement.scrollWidth + '>' + document.documentElement.clientWidth : ''`);
    check(`${label} · sem scroll horizontal`, overflow === '', overflow);
  }

  // ---------- 10. erro de console ----------
  const erros = consoleLog.filter(l => /EXCEPTION|"error"/.test(l) && !/naoexiste-cdv-teste/.test(l));
  check('nenhum erro de console (fora o da mentira, que é de propósito)', erros.length === 0, erros.slice(0, 2).join(' | '));

  console.log('\n' + '='.repeat(60));
  const fails = results.filter(r => !r.pass);
  console.log(`${results.length - fails.length}/${results.length} passaram`);
  if (fails.length) console.log('FALHAS:\n' + fails.map(f => '  - ' + f.name + ' :: ' + f.detail).join('\n'));

  chrome.kill();
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error('HARNESS ERROR', e); chrome.kill(); process.exit(2); });
