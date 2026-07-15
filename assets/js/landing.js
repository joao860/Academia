/* ==========================================================================
   ARENA — Landing Page Engine
   A landing page é "viva": cada seção é marcada com os estados em que
   deve aparecer. Trocar CAMPEONATO_ATUAL.estado re-renderiza a página
   inteira — igual aconteceria quando um admin publica, abre ou encerra
   um campeonato de verdade.

   Também é "imersiva": ao carregar, busca o campeonato ativo salvo no
   localStorage (via db.js/store.js). Enquanto nenhum admin publicou um
   campeonato, ela mostra um estado vazio em vez de quebrar — é assim
   que o sistema fica "zerado" pra uma demonstração ao vivo.
   ========================================================================== */

CAMPEONATO_ATUAL = arenaCampeonatoAtivo();
arenaHydrateArray(CATEGORIAS, 'categorias');
arenaHydrateArray(SPONSORS, 'sponsors');
arenaHydrateArray(FAQ, 'faq');
arenaHydrateArray(GALERIA, 'galeria');
arenaHydrateArray(HALL_DA_FAMA, 'hall');
arenaHydrateArray(BATERIAS, 'baterias');
arenaHydrateArray(RANKING_GERAL, 'ranking');

const ESTADOS_LABEL = {
  pre_inscricao: "Em breve",
  inscricoes_abertas: "Inscrições abertas",
  inscricoes_encerradas: "Inscrições encerradas",
  andamento: "Acontecendo agora",
  finalizado: "Finalizado",
};

function $(sel, ctx=document){ return ctx.querySelector(sel); }
function $all(sel, ctx=document){ return [...ctx.querySelectorAll(sel)]; }

function aplicarEstado(){
  if(!CAMPEONATO_ATUAL || !ARENA_ESTADOS_PUBLICOS.includes(CAMPEONATO_ATUAL.estado)){ mostrarEstadoVazio(); return; }
  mostrarEstadoVazio(false);

  const estado = CAMPEONATO_ATUAL.estado;
  $all('[data-states]').forEach(el=>{
    const allowed = el.dataset.states.split(' ');
    el.style.display = allowed.includes(estado) ? '' : 'none';
  });
  $all('.state-switch-btn').forEach(b=>b.classList.toggle('active', b.dataset.state===estado));
  const badge = $('#hero-status-badge');
  if(badge){
    badge.textContent = ESTADOS_LABEL[estado];
    badge.className = 'badge ' + (estado==='andamento' ? 'badge-live' : estado==='finalizado' ? 'badge-success' : 'badge-amber');
  }
  atualizarContador();
  preencherEstatico();
}

/* Quando ainda não existe nenhum campeonato publicado (sistema "zerado"),
   escondemos todo o conteúdo dinâmico e mostramos um aviso simples no
   lugar do herói, em vez de deixar a tela quebrada ou com dado falso. */
function mostrarEstadoVazio(vazio=true){
  const aviso = $('#landing-vazia');
  const heroConteudo = $('#hero-conteudo-real');
  const drawer = $('#state-drawer');
  if(aviso) aviso.style.display = vazio ? '' : 'none';
  if(heroConteudo) heroConteudo.style.display = vazio ? 'none' : '';
  if(drawer) drawer.style.display = vazio ? 'none' : '';
  if(vazio){
    $all('[data-states]').forEach(el=> el.style.display = 'none');
    const box = $('#countdown-box'); if(box) box.style.display='none';
  }
}

function setEstado(novo){
  if(!CAMPEONATO_ATUAL) return;
  CAMPEONATO_ATUAL.estado = novo;
  arenaSalvarCampeonatoAtivo(CAMPEONATO_ATUAL);
  aplicarEstado();
}

/* ---------------- countdown ---------------- */
function alvoContador(){
  const e = CAMPEONATO_ATUAL.estado;
  if(e==='pre_inscricao') return {data:CAMPEONATO_ATUAL.dataInicioInscricao, label:'até abrirem as inscrições'};
  if(e==='inscricoes_abertas') return {data:CAMPEONATO_ATUAL.dataFimInscricao, label:'até o fim das inscrições'};
  if(e==='inscricoes_encerradas') return {data:CAMPEONATO_ATUAL.dataInicioEvento, label:'até o início do campeonato'};
  if(e==='andamento') return {data:CAMPEONATO_ATUAL.dataFimEvento, label:'para a próxima bateria'};
  return null;
}
function atualizarContador(){
  const box = $('#countdown-box');
  if(!box) return;
  const alvo = alvoContador();
  if(!alvo || !alvo.data){ box.style.display='none'; return; }
  box.style.display='';
  let diff = new Date(alvo.data+'T09:00:00') - new Date();
  if(diff < 0) diff = 0;
  const d = Math.max(0,Math.floor(diff/86400000));
  const h = Math.max(0,Math.floor((diff/3600000)%24));
  const m = Math.max(0,Math.floor((diff/60000)%60));
  const s = Math.max(0,Math.floor((diff/1000)%60));
  $('#cd-d').textContent=String(d).padStart(2,'0');
  $('#cd-h').textContent=String(h).padStart(2,'0');
  $('#cd-m').textContent=String(m).padStart(2,'0');
  $('#cd-s').textContent=String(s).padStart(2,'0');
  $('#countdown-label').textContent = alvo.label;
}
setInterval(()=>{
  // tick cosmético só pros segundos parecerem "vivos" na demonstração
  const el = $('#cd-s');
  if(!el || !CAMPEONATO_ATUAL) return;
  let v = parseInt(el.textContent,10); v = (v-1+60)%60; el.textContent=String(v).padStart(2,'0');
}, 1000);

/* ---------------- static content fill ---------------- */
function preencherEstatico(){
  if(!CAMPEONATO_ATUAL) return;
  $('#camp-nome-hero').textContent = CAMPEONATO_ATUAL.nome || '';
  $all('.js-academia-nome').forEach(el=>el.textContent = ACADEMIA.nome);
  $('#camp-local').textContent = CAMPEONATO_ATUAL.local || '';
  if(CAMPEONATO_ATUAL.dataInicioEvento && CAMPEONATO_ATUAL.dataFimEvento){
    $('#camp-data').textContent = fmtPeriodo(CAMPEONATO_ATUAL.dataInicioEvento, CAMPEONATO_ATUAL.dataFimEvento);
  }
  $('#camp-descricao').textContent = CAMPEONATO_ATUAL.descricao || '';
  $('#stat-equipes').textContent = CAMPEONATO_ATUAL.equipesConfirmadas || 0;
  $('#stat-atletas').textContent = CAMPEONATO_ATUAL.atletasInscritos || 0;
  $('#stat-vagas').textContent = Math.max(0, (CAMPEONATO_ATUAL.vagasTotais||0) - (CAMPEONATO_ATUAL.atletasInscritos||0));

  // categorias
  const catWrap = $('#categorias-grid');
  if(catWrap){
    catWrap.innerHTML = CATEGORIAS.length ? CATEGORIAS.map(c=>`
      <div class="card reveal in" style="border-top:3px solid ${c.cor||'var(--flame)'}">
        <div class="flex items-center justify-between" style="margin-bottom:10px">
          <h3 style="font-family:var(--font-display);font-size:20px;text-transform:uppercase;color:${c.cor||'var(--flame)'}">${c.nome}</h3>
          <span class="mono text-faint" style="font-size:12px">${c.inscritos||0} inscritos</span>
        </div>
        <p class="text-dim" style="font-size:14px;margin-bottom:14px">${c.descricao||''}</p>
        <span class="text-faint mono" style="font-size:12px">${c.minAtletas===c.maxAtletas ? c.maxAtletas+' atletas por equipe' : c.minAtletas+'–'+c.maxAtletas+' atletas'}</span>
      </div>`).join('') : '<p class="text-faint" style="grid-column:1/-1">Categorias em breve.</p>';
  }

  // patrocinadores
  const spWrap = $('#sponsors-grid');
  if(spWrap){
    spWrap.innerHTML = SPONSORS.length ? SPONSORS.map(s=>`
      <div class="card" style="text-align:center;padding:20px 12px;">
        <div style="font-family:var(--font-display);font-size:18px;text-transform:uppercase;letter-spacing:.03em;color:var(--chalk)">${s.nome}</div>
        <span class="badge badge-muted" style="margin-top:10px">${s.tier}</span>
      </div>`).join('') : '<p class="text-faint" style="grid-column:1/-1;text-align:center">Nenhum patrocinador cadastrado ainda.</p>';
  }

  // faq
  const faqWrap = $('#faq-list');
  if(faqWrap){
    faqWrap.innerHTML = FAQ.length ? FAQ.map((f,i)=>`
      <div class="faq-item card" data-open="false">
        <button class="faq-q" onclick="toggleFaq(this)">
          <span>${f.p}</span>
          <span class="faq-icon">+</span>
        </button>
        <div class="faq-a"><p class="text-dim">${f.r}</p></div>
      </div>`).join('') : '<p class="text-faint">Nenhuma pergunta cadastrada ainda.</p>';
  }

  // galeria
  const galWrap = $('#galeria-grid');
  if(galWrap){
    galWrap.innerHTML = GALERIA.length ? GALERIA.map((g,i)=>{
      const item = typeof g === 'object' && g !== null ? g : {legenda:g};
      const legenda = item.legenda || 'Foto da galeria';
      const src = item.src || '';
      return `
        <div class="skeleton-img" style="aspect-ratio:${i%3===0?'4/5':'1/1'};display:flex;align-items:flex-end;padding:14px;position:relative;overflow:hidden;background:var(--panel-2)">
          ${src ? `<img src="${src}" alt="${legenda}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">` : ''}
          <div style="position:relative;z-index:1;background:rgba(5,10,20,.65);padding:8px 10px;border-radius:999px;max-width:100%">
            <span class="mono text-faint" style="font-size:11px">${legenda}</span>
          </div>
        </div>`;
    }).join('') : '<p class="text-faint" style="grid-column:1/-1">Galeria em breve.</p>';
  }

  // hall da fama
  const hallSection = $('#hall-fama');
  const hallWrap = $('#hall-grid');
  if(hallWrap){
    if(HALL_DA_FAMA.length){
      if(hallSection) hallSection.style.display='';
      hallWrap.innerHTML = HALL_DA_FAMA.map(h=>`
        <div class="card" style="text-align:center">
          <div style="font-size:34px;margin-bottom:8px">${h.foto}</div>
          <div class="mono text-faint" style="font-size:12px">${h.ano} · ${h.categoria}</div>
          <div style="font-family:var(--font-display);font-size:20px;text-transform:uppercase;margin-top:4px">${h.campeao}</div>
        </div>`).join('');
    } else if(hallSection){
      hallSection.style.display='none';
    }
  }

  // ranking ao vivo
  const liveWrap = $('#ranking-live-body');
  if(liveWrap){
    liveWrap.innerHTML = RANKING_GERAL.slice(0,5).map(r=>`
      <tr>
        <td><span class="rank-num ${r.pos<=3?'top':''}">${r.pos}º</span></td>
        <td>${r.equipe}</td>
        <td><span class="badge badge-muted">${r.categoria}</span></td>
        <td class="mono">${r.pontos} pts</td>
      </tr>`).join('') || `<tr><td colspan="4" class="text-faint">Nenhum resultado aprovado ainda.</td></tr>`;
  }

  // pódio + ranking final
  const pod = RANKING_GERAL.slice(0,3);
  if($('#podium-1')) $('#podium-1').innerHTML = podiumCard(pod[0],1);
  if($('#podium-2')) $('#podium-2').innerHTML = podiumCard(pod[1],2);
  if($('#podium-3')) $('#podium-3').innerHTML = podiumCard(pod[2],3);
  const fullWrap = $('#ranking-final-body');
  if(fullWrap){
    fullWrap.innerHTML = RANKING_GERAL.map(r=>`
      <tr>
        <td><span class="rank-num ${r.pos<=3?'top':''}">${r.pos}º</span></td>
        <td>${r.equipe}</td>
        <td><span class="badge badge-muted">${r.categoria}</span></td>
        <td class="mono">${r.pontos} pts</td>
      </tr>`).join('');
  }

  // próximas baterias
  const batWrap = $('#baterias-list');
  if(batWrap){
    batWrap.innerHTML = BATERIAS.length ? BATERIAS.map(b=>`
      <div class="card flex items-center justify-between" style="margin-bottom:12px">
        <div class="flex items-center gap-16">
          <div class="mono" style="font-size:22px;font-weight:700;color:var(--flame-hi);min-width:64px">${b.horario}</div>
          <div>
            <div style="font-weight:700">${b.prova}</div>
            <div class="text-faint" style="font-size:12.5px">${b.arena} · ${b.categoria} · ${b.data}</div>
          </div>
        </div>
        <span class="badge badge-muted">${(b.equipes||[]).length} equipes</span>
      </div>`).join('') : '<p class="text-faint">Nenhuma bateria agendada ainda.</p>';
  }
}

function podiumCard(r,pos){
  if(!r) return '<div class="text-faint" style="padding:20px">Aguardando resultados</div>';
  const medal = pos===1?'🥇':pos===2?'🥈':'🥉';
  return `<div class="podium-medal">${medal}</div>
    <div class="podium-place">${pos}º Lugar</div>
    <div class="podium-team">${r.equipe}</div>
    <div class="mono text-faint" style="font-size:13px">${r.pontos} pts · ${r.categoria}</div>`;
}

function toggleFaq(btn){
  const item = btn.closest('.faq-item');
  const open = item.dataset.open === 'true';
  item.dataset.open = (!open).toString();
  btn.querySelector('.faq-icon').textContent = open ? '+' : '−';
}

function fmtPeriodo(ini,fim){
  const o = {day:'2-digit',month:'short'};
  const di = new Date(ini+'T12:00:00'), df = new Date(fim+'T12:00:00');
  return di.toLocaleDateString('pt-BR',o) + ' – ' + df.toLocaleDateString('pt-BR',{...o,year:'numeric'});
}

/* reveal-on-scroll */
function initReveal(){
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{ if(e.isIntersecting) e.target.classList.add('in'); });
  }, {threshold:.12});
  $all('.reveal').forEach(el=>io.observe(el));
}

document.addEventListener('DOMContentLoaded', ()=>{
  aplicarEstado();
  initReveal();
  const y = $('#footer-year'); if(y) y.textContent = new Date().getFullYear();
});