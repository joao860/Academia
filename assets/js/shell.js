/* ==========================================================================
   ARENA — App Shell (sidebar/topbar) shared by athlete, judge and admin areas
   ========================================================================== */

function renderSidebar(role, activeId){
  const usuario = (typeof arenaUsuarioAtual === 'function') ? arenaUsuarioAtual() : null;
  const equipe = (role==='atleta' && usuario && typeof arenaMinhaEquipe==='function') ? arenaMinhaEquipe(usuario.id) : null;

  const configs = {
    atleta:{
      brand:'Crossbox', base:'',
      groups:[
        {label:'Minha conta', links:[
          {id:'dashboard', icon:'⌂', label:'Visão geral', href:'atleta-dashboard.html'},
          {id:'equipe', icon:'👥', label:'Minha equipe', href:'equipe.html'},
          {id:'pagamentos', icon:'💳', label:'Pagamentos', href:'pagamentos.html'},
          {id:'historico', icon:'🕒', label:'Histórico', href:'historico.html'},
          {id:'perfil', icon:'⚙', label:'Meu perfil', href:'perfil.html'},
        ]},
      ],
      user:{
        name: usuario ? usuario.nome : 'Visitante',
        sub: equipe ? (equipe.categoria+' · '+equipe.nome) : 'Nenhuma equipe ainda',
        avatar: usuario ? usuario.avatar : '?'
      },
      exit:{label:'Voltar ao site', href:'index.html'}
    },
    juiz:{
      brand:'Crossbox · Juiz', base:'',
      groups:[
        {label:'Bateria atual', links:[
          {id:'painel', icon:'⏱', label:'Painel de pontuação', href:'juiz-dashboard.html'},
          {id:'equipes', icon:'👥', label:'Minhas equipes', href:'juiz-equipes.html'},
        ]},
      ],
      user:{name: usuario ? usuario.nome : 'Juiz', sub:'Juiz · Crossbox', avatar: usuario ? usuario.avatar : '?'},
      exit:{label:'Voltar ao site', href:'../index.html'}
    },
    admin:{
      brand:'Crossbox · Admin', base:'',
      groups:[
        {label:'Geral', links:[
          {id:'dashboard', icon:'▦', label:'Dashboard', href:'dashboard.html'},
          {id:'campeonatos', icon:'🏆', label:'Campeonatos', href:'campeonatos.html'},
        ]},
        {label:'Configuração do campeonato', links:[
          {id:'categorias', icon:'🏷', label:'Categorias', href:'categorias.html'},
          {id:'exercicios', icon:'🏋', label:'Exercícios', href:'exercicios.html'},
          {id:'provas', icon:'🧩', label:'Provas', href:'provas.html'},
          {id:'baterias', icon:'📅', label:'Baterias', href:'baterias.html'},
        ]},
        {label:'Pessoas', links:[
          {id:'equipes', icon:'👥', label:'Equipes', href:'equipes.html'},
          {id:'atletas', icon:'🧍', label:'Atletas', href:'atletas.html'},
          {id:'juizes', icon:'⏱', label:'Juízes', href:'juizes.html'},
        ]},
        {label:'Resultados', links:[
          {id:'resultados', icon:'✅', label:'Aprovar resultados', href:'resultados.html'},
          {id:'ranking', icon:'📊', label:'Ranking', href:'ranking.html'},
        ]},
        {label:'Landing page', links:[
          {id:'landing', icon:'🖥', label:'Editor da página', href:'landing-editor.html'},
          {id:'patrocinadores', icon:'⭐', label:'Patrocinadores', href:'patrocinadores.html'},
          {id:'galeria', icon:'🖼', label:'Galeria', href:'galeria.html'},
          {id:'faq', icon:'❓', label:'FAQ', href:'faq.html'},
        ]},
        {label:'Sistema', links:[
          {id:'configuracoes', icon:'⚙', label:'Configurações', href:'configuracoes.html'},
        ]},
      ],
      user:{name: usuario ? usuario.nome : 'Admin', sub:'Administradora · Crossbox', avatar: usuario ? usuario.avatar : '?'},
      exit:{label:'Voltar ao site', href:'../index.html'}
    }
  };
  const cfg = configs[role];
  const html = `
    <div class="sidebar-brand"><span class="brand-mark">C</span> ${cfg.brand}</div>
    <div style="flex:1;overflow-y:auto;overflow-x:hidden">
      ${cfg.groups.map(g=>`
        <div class="sidebar-section-label">${g.label}</div>
        ${g.links.map(l=>`<a href="${l.href}" class="side-link ${l.id===activeId?'active':''}"><span class="ic">${l.icon}</span>${l.label}</a>`).join('')}
      `).join('')}
    </div>
    <div class="sidebar-foot">
      <a href="#" onclick="arenaLogout(); window.location.href='${cfg.exit.href}'; return false;" class="side-link"><span class="ic">←</span>Sair</a>
      <div class="sidebar-user">
        <div class="avatar" style="width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-weight:700;font-size:12.5px;background:var(--surface-hi);color:var(--chalk)">${cfg.user.avatar}</div>
        <div style="min-width:0">
          <div style="font-size:13.5px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${cfg.user.name}</div>
          <div class="text-faint" style="font-size:11.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${cfg.user.sub}</div>
        </div>
      </div>
    </div>
  `;
  document.querySelectorAll('.sidebar').forEach(el=>el.innerHTML = html);
  ensureMobileNav();
}

/* Injeta (uma única vez) o botão hambúrguer dentro da topbar e o backdrop
   escuro usado para fechar o menu lateral no mobile — assim nenhuma página
   precisa ter esse botão escrito manualmente no HTML. */
function ensureMobileNav(){
  document.querySelectorAll('.topbar').forEach(tb=>{
    if(tb.querySelector('.sidebar-burger')) return;
    const btn = document.createElement('button');
    btn.className = 'sidebar-burger';
    btn.setAttribute('aria-label','Abrir menu');
    btn.innerHTML = '<span></span><span></span><span></span>';
    btn.onclick = toggleSidebar;
    tb.prepend(btn);
  });
  if(!document.querySelector('.sidebar-backdrop')){
    const bd = document.createElement('div');
    bd.className = 'sidebar-backdrop';
    bd.onclick = closeSidebar;
    document.body.appendChild(bd);
  }
}

function toggleSidebar(){
  document.querySelector('.sidebar').classList.toggle('open');
  const bd = document.querySelector('.sidebar-backdrop');
  if(bd) bd.classList.toggle('open');
}
function closeSidebar(){
  document.querySelector('.sidebar').classList.remove('open');
  const bd = document.querySelector('.sidebar-backdrop');
  if(bd) bd.classList.remove('open');
}

function renderTopbar(title, subtitle){
  document.querySelectorAll('.topbar-title').forEach(el=>el.textContent=title);
  document.querySelectorAll('.topbar-subtitle').forEach(el=>el.textContent=subtitle||'');
}