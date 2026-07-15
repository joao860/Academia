/* ==========================================================================
   ARENA — Camada de dados e autenticação (protótipo funcional)
   Constrói sobre o store.js (arenaLoad/arenaSave) as operações reais de:
   contas, login/sessão e equipes. Tudo em localStorage, tudo em JSON.

   Ao carregar pela primeira vez em um navegador, semeia (arenaSeed) só
   as duas contas de demonstração — 1 admin e 1 juiz — exatamente como
   o protótipo tinha "de fábrica". Todo o resto começa vazio: é isso que
   deixa o sistema "zerado" pra demonstração ao vivo.
   ========================================================================== */

function arenaUid(prefix){
  return prefix + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2,7);
}

/* ---------------- seed inicial (só as 2 contas de demonstração) ---------------- */
function arenaSeed(){
  if(arenaLoad('admins', null) === null){
    arenaSave('admins', [
      { id:'admin-1', nome:'Camila Duarte', email:'camila@crossbox.com', senha:'12345678', avatar:'CD' }
    ]);
  }
  if(arenaLoad('juizes', null) === null){
    arenaSave('juizes', [
      { id:'juiz-1', nome:'Rafael Nogueira', email:'rafael@crossbox.com', senha:'12345678', avatar:'RN', equipesIds:[] }
    ]);
  }
  const vazios = ['usuarios','equipes','categorias','exercicios_catalogo','provas','baterias',
                  'sponsors','faq','galeria','hall','ranking','campeonatos_arquivados','resultados_pendentes'];
  vazios.forEach(k=>{ if(arenaLoad(k, null) === null) arenaSave(k, []); });
  // 'campeonato' (o ativo) fica ausente até o admin publicar um — ver arenaCampeonatoAtivo()
}
arenaSeed();

/* ---------------- sessão ---------------- */
function arenaLogin(tipo, dados){ arenaSave('sessao', Object.assign({tipo:tipo}, dados)); }
function arenaLogout(){ arenaSave('sessao', null); }
function arenaSessao(){ return arenaLoad('sessao', null); }

/* Redireciona pra tela de login apropriada se não houver sessão do tipo certo.
   Chame no topo de qualquer página protegida. Retorna a sessão (ou null, já
   tendo redirecionado). */
function arenaExigirLogin(tipo, paginaLogin){
  const s = arenaSessao();
  if(!s || s.tipo !== tipo){ window.location.href = paginaLogin; return null; }
  return s;
}

/* ---------------- contas ---------------- */
function arenaIniciais(nome){
  return (nome||'').trim().split(/\s+/).map(p=>p[0]).slice(0,2).join('').toUpperCase() || '?';
}

function arenaCriarConta(nome, email, senha){
  const usuarios = arenaLoad('usuarios', []);
  if(usuarios.some(u=>u.email.toLowerCase()===email.trim().toLowerCase())){
    return {erro:'Já existe uma conta com este e-mail.'};
  }
  const user = {
    id:arenaUid('atleta'), nome:nome.trim(), email:email.trim(), senha,
    avatar:arenaIniciais(nome), criadoEm:new Date().toISOString().slice(0,10), historico:[]
  };
  usuarios.push(user);
  arenaSave('usuarios', usuarios);
  arenaLogin('atleta', {id:user.id, nome:user.nome, email:user.email, avatar:user.avatar});
  return {ok:true, user};
}

function arenaLoginAtleta(email, senha){
  const u = arenaLoad('usuarios', []).find(u=>u.email.toLowerCase()===email.trim().toLowerCase() && u.senha===senha);
  if(!u) return {erro:'E-mail ou senha inválidos.'};
  arenaLogin('atleta', {id:u.id, nome:u.nome, email:u.email, avatar:u.avatar});
  return {ok:true, user:u};
}

function arenaLoginAdmin(email, senha){
  const a = arenaLoad('admins', []).find(a=>a.email.toLowerCase()===email.trim().toLowerCase() && a.senha===senha);
  if(!a) return {erro:'E-mail ou senha inválidos.'};
  arenaLogin('admin', {id:a.id, nome:a.nome, email:a.email, avatar:a.avatar});
  return {ok:true, user:a};
}

function arenaLoginJuiz(email, senha){
  const j = arenaLoad('juizes', []).find(j=>j.email.toLowerCase()===email.trim().toLowerCase() && j.senha===senha);
  if(!j) return {erro:'E-mail ou senha inválidos.'};
  arenaLogin('juiz', {id:j.id, nome:j.nome, email:j.email, avatar:j.avatar});
  return {ok:true, user:j};
}

/* Retorna o registro completo e atualizado do usuário logado (não só o
   resumo salvo na sessão) — sempre use esta função pra ler dados atuais. */
function arenaUsuarioAtual(){
  const s = arenaSessao();
  if(!s) return null;
  if(s.tipo==='atleta') return arenaLoad('usuarios', []).find(u=>u.id===s.id) || null;
  if(s.tipo==='admin')  return arenaLoad('admins', []).find(u=>u.id===s.id) || null;
  if(s.tipo==='juiz')   return arenaLoad('juizes', []).find(u=>u.id===s.id) || null;
  return null;
}

function arenaAtualizarPerfil(campos){
  const s = arenaSessao(); if(!s || s.tipo!=='atleta') return;
  const usuarios = arenaLoad('usuarios', []);
  const u = usuarios.find(u=>u.id===s.id); if(!u) return;
  Object.assign(u, campos);
  arenaSave('usuarios', usuarios);
  arenaLogin('atleta', {id:u.id, nome:u.nome, email:u.email, avatar:u.avatar});
}

/* ---------------- equipes ---------------- */
function arenaGerarCodigoConvite(nomeEquipe){
  const base = (nomeEquipe||'EQUIPE').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Z]/g,'').slice(0,6) || 'EQUIPE';
  return base + '-' + Math.floor(1000 + Math.random()*9000);
}

function arenaCriarEquipe(nome, categoria, liderUser){
  const equipes = arenaLoad('equipes', []);
  const equipe = {
    id:arenaUid('equipe'), nome:nome.trim(), categoria, status:'montando',
    codigoConvite:arenaGerarCodigoConvite(nome), liderId:liderUser.id,
    membros:[{userId:liderUser.id, nome:liderUser.nome, avatar:liderUser.avatar, pago:false}]
  };
  equipes.push(equipe);
  arenaSave('equipes', equipes);
  return equipe;
}

function arenaEntrarEquipeComCodigo(codigo, user){
  const equipes = arenaLoad('equipes', []);
  const equipe = equipes.find(e=>e.codigoConvite === (codigo||'').trim().toUpperCase());
  if(!equipe) return {erro:'Código de convite não encontrado.'};
  if(equipe.membros.some(m=>m.userId===user.id)) return {erro:'Você já faz parte desta equipe.'};
  equipe.membros.push({userId:user.id, nome:user.nome, avatar:user.avatar, pago:false});
  arenaSave('equipes', equipes);
  return {ok:true, equipe};
}

function arenaMinhaEquipe(userId){
  return arenaLoad('equipes', []).find(e=>e.membros.some(m=>m.userId===userId)) || null;
}

function arenaMarcarPago(equipeId, userId){
  const equipes = arenaLoad('equipes', []);
  const eq = equipes.find(e=>e.id===equipeId); if(!eq) return null;
  const m = eq.membros.find(m=>m.userId===userId); if(m) m.pago = true;
  eq.status = eq.membros.every(m=>m.pago) ? 'confirmada' : 'aguardando_pagamento';
  arenaSave('equipes', equipes);
  return eq;
}

/* ---------------- CRUD genérico (categorias, provas, baterias, patrocinadores, faq, galeria, hall, ranking) ---------------- */
function arenaListar(chave){ return arenaLoad(chave, []); }
function arenaAdicionar(chave, item, idPrefix){
  const lista = arenaListar(chave);
  const novo = Object.assign({id:arenaUid(idPrefix||chave)}, item);
  lista.push(novo);
  arenaSave(chave, lista);
  return novo;
}
function arenaRemover(chave, id){
  arenaSave(chave, arenaListar(chave).filter(i=>i.id!==id));
}
function arenaAtualizar(chave, id, campos){
  const lista = arenaListar(chave);
  const item = lista.find(i=>i.id===id);
  if(item){ Object.assign(item, campos); arenaSave(chave, lista); }
  return item;
}

/* ---------------- catálogo de exercícios (da ACADEMIA, não do campeonato) ---------------- */
function arenaCatalogoExercicios(){ return arenaLoad('exercicios_catalogo', []); }
function arenaAdicionarExercicio(ex){ return arenaAdicionar('exercicios_catalogo', ex, 'ex'); }
function arenaRemoverExercicio(id){ arenaRemover('exercicios_catalogo', id); }

/* ---------------- campeonato em edição / publicação ---------------- */
/* Salva o rascunho do campeonato que o admin está montando no assistente.
   Enquanto o estado não for um dos estados públicos, a landing page
   trata como "nenhum campeonato publicado". */
const ARENA_ESTADOS_PUBLICOS = ['pre_inscricao','inscricoes_abertas','inscricoes_encerradas','andamento','finalizado'];

function arenaSalvarRascunhoCampeonato(campos){
  const atual = arenaLoad('campeonato', {}) || {};
  const novo = Object.assign({}, atual, campos, {estado: atual.estado || 'rascunho'});
  arenaSave('campeonato', novo);
  return novo;
}
function arenaPublicarCampeonato(){
  const atual = arenaLoad('campeonato', null);
  if(!atual) return {erro:'Nenhum campeonato em edição.'};
  atual.estado = 'inscricoes_abertas';
  arenaSave('campeonato', atual);
  return {ok:true, campeonato:atual};
}

/* Arquiva o campeonato ativo (com uma "foto" de categorias/provas/
   patrocinadores no momento do arquivamento) e limpa os dados do
   campeonato pra começar um novo do zero. Contas, juízes e o catálogo
   de exercícios da academia NÃO são apagados — são permanentes. */
function arenaArquivarCampeonatoAtual(){
  const atual = arenaLoad('campeonato', null);
  if(!atual) return {erro:'Nenhum campeonato ativo para arquivar.'};
  const arquivados = arenaLoad('campeonatos_arquivados', []);
  arquivados.push({
    id: arenaUid('arquivo'),
    campeonato: atual,
    categorias: arenaLoad('categorias', []),
    provas: arenaLoad('provas', []),
    baterias: arenaLoad('baterias', []),
    sponsors: arenaLoad('sponsors', []),
    faq: arenaLoad('faq', []),
    equipes: arenaLoad('equipes', []),
    ranking: arenaLoad('ranking', []),
    arquivadoEm: new Date().toISOString().slice(0,10)
  });
  arenaSave('campeonatos_arquivados', arquivados);
  // zera o que é específico deste campeonato
  ['categorias','provas','baterias','sponsors','faq','galeria','ranking','equipes','resultados_pendentes'].forEach(k=>arenaSave(k, []));
  arenaSave('campeonato', null);
  return {ok:true};
}

/* Duplica um campeonato arquivado: traz categorias, provas, patrocinadores
   e regulamento de volta como um novo rascunho editável — só datas e nome
   ficam em branco pro admin ajustar. */
function arenaDuplicarCampeonatoArquivado(arquivoId){
  const arquivados = arenaLoad('campeonatos_arquivados', []);
  const alvo = arquivados.find(a=>a.id===arquivoId);
  if(!alvo) return {erro:'Campeonato arquivado não encontrado.'};
  arenaSave('categorias', JSON.parse(JSON.stringify(alvo.categorias||[])).map(c=>Object.assign({}, c, {inscritos:0})));
  arenaSave('provas', JSON.parse(JSON.stringify(alvo.provas||[])));
  arenaSave('sponsors', JSON.parse(JSON.stringify(alvo.sponsors||[])));
  arenaSave('faq', JSON.parse(JSON.stringify(alvo.faq||[])));
  arenaSave('baterias', []); // baterias têm horários específicos da edição anterior — não faz sentido copiar
  arenaSave('equipes', []);  // equipes são novas a cada edição
  const base = alvo.campeonato || {};
  arenaSave('campeonato', {
    nome: base.nome ? base.nome + ' (nova edição)' : 'Novo campeonato',
    descricao: base.descricao || '', local: base.local || '', tipo: base.tipo || '',
    regulamento: base.regulamento || '', precoInscricaoIndividual: base.precoInscricaoIndividual || 0,
    precoInscricaoEquipe: base.precoInscricaoEquipe || 0,
    dataInicioInscricao:'', dataFimInscricao:'', dataInicioEvento:'', dataFimEvento:'',
    estado:'rascunho'
  });
  return {ok:true};
}

/* ---------------- modelos de prova prontos ---------------- */
const ARENA_MODELOS_PROVA = [
  { nome:'Sprint Challenge', timecap:'12:00', pontuacao:'menor-tempo',
    blocos:[{nome:'Burpee', img:'🤸', detalhe:'100 repetições'},{nome:'Corrida', img:'🏃', detalhe:'400 metros'},{nome:'Wall Ball', img:'🥎', detalhe:'50 repetições'}] },
  { nome:'AMRAP 15', timecap:'15:00', pontuacao:'maior-reps',
    blocos:[{nome:'Toes to Bar', img:'🤾', detalhe:'10 repetições'},{nome:'Wall Ball', img:'🥎', detalhe:'15 repetições'},{nome:'Double Under', img:'➰', detalhe:'20 repetições'}] },
  { nome:'1RM Deadlift', timecap:'—', pontuacao:'maior-carga',
    blocos:[{nome:'Deadlift', img:'🏋️', detalhe:'3 tentativas'}] },
];

/* ---------------- geração automática de baterias ---------------- */
/* Distribui 1 bateria por categoria/prova, em blocos de 40min a partir das
   08:00, alternando entre "Arena 1" e "Arena 2". É um ponto de partida —
   o admin pode editar horários manualmente depois. */
function arenaGerarBateriasAutomaticamente(){
  const categorias = arenaLoad('categorias', []);
  const provas = arenaLoad('provas', []);
  if(!categorias.length || !provas.length) return {erro:'Cadastre ao menos 1 categoria e 1 prova antes de gerar as baterias.'};
  const geradas = [];
  let minutos = 8*60;
  provas.forEach(prova=>{
    const catsProva = prova.cats || prova.categorias || categorias.map(c=>c.nome);
    catsProva.forEach((catNome, i)=>{
      const bateria = {
        nome:'Bateria ' + String.fromCharCode(65+geradas.length),
        prova: prova.nome, categoria: catNome,
        arena: (geradas.length%2===0) ? 'Arena 1' : 'Arena 2',
        horario: String(Math.floor(minutos/60)).padStart(2,'0')+':'+String(minutos%60).padStart(2,'0'),
        data:'', equipes:[], juiz:'', status:'agendada'
      };
      geradas.push(bateria);
      minutos += 40;
    });
  });
  const existentes = arenaLoad('baterias', []);
  geradas.forEach(b=> existentes.push(Object.assign({id:arenaUid('bateria')}, b)));
  arenaSave('baterias', existentes);
  return {ok:true, geradas:geradas.length};
}

/* ---------------- SEED DE EXEMPLO (rodar manualmente no console, F12) ----------------
   Isto NÃO roda sozinho. É uma função disponível pra você popular o
   sistema com dados de exemplo quando quiser testar ou apresentar sem
   digitar tudo na mão. Abra o console do navegador (F12) em qualquer
   página do site e rode:  arenaSeedExemplo()
   Pra limpar tudo de novo depois: arenaResetTudo() */
function arenaSeedExemplo(){
  arenaSave('categorias', [
    { id:arenaUid('cat'), nome:'RX', cor:'#196913', descricao:'Nível avançado, cargas e movimentos completos.', minAtletas:3, maxAtletas:3, inscritos:0 },
    { id:arenaUid('cat'), nome:'Scale', cor:'#1D6FD1', descricao:'Nível intermediário, cargas reduzidas.', minAtletas:3, maxAtletas:3, inscritos:0 },
    { id:arenaUid('cat'), nome:'Elite Individual', cor:'#D97706', descricao:'Competição individual, nível avançado.', minAtletas:1, maxAtletas:1, inscritos:0 },
  ]);
  arenaSave('sponsors', [
    { id:arenaUid('sp'), nome:'NutriMax', tier:'Ouro' },
    { id:arenaUid('sp'), nome:'IronGrip', tier:'Prata' },
  ]);
  arenaSave('faq', [
    { id:arenaUid('faq'), p:'Posso me inscrever sem equipe?', r:'Sim, na categoria Elite Individual.' },
    { id:arenaUid('faq'), p:'Como funciona o convite de equipe?', r:'O líder recebe um código e compartilha com os colegas.' },
  ]);
  arenaSave('provas', [
    { id:arenaUid('prova'), nome:'Sprint Challenge', timecap:'12:00', pontuacao:'menor-tempo', cats:['RX','Scale'], arena:'Arena 1',
      blocos:[{nome:'Burpee', img:'🤸', detalhe:'100 repetições'},{nome:'Corrida', img:'🏃', detalhe:'400 metros'}] }
  ]);
  arenaSalvarRascunhoCampeonato({
    nome:'Arena Games 2026', descricao:'O maior campeonato de CrossFit do Centro-Oeste.',
    local:'Arena Crossbox — Campo Grande, MS', tipo:'Individual e Equipes',
    dataInicioInscricao:'2026-07-01', dataFimInscricao:'2026-08-10',
    dataInicioEvento:'2026-08-20', dataFimEvento:'2026-08-21',
    precoInscricaoIndividual:180, precoInscricaoEquipe:480,
    equipesConfirmadas:0, atletasInscritos:0, vagasTotais:200,
    estado:'inscricoes_abertas'
  });
  console.log('Dados de exemplo carregados. Recarregue a página (F5) pra ver.');
}
function arenaResetTudo(){
  Object.keys(localStorage).filter(k=>k.startsWith(ARENA_NS)).forEach(k=>localStorage.removeItem(k));
  console.log('Sistema zerado. Recarregue a página (F5).');
  arenaSeed();
}

/* ---------------- resultados (enviados por juízes, aguardando aprovação) ---------------- */
function arenaEnviarResultado(dados){
  const pendentes = arenaLoad('resultados_pendentes', []);
  const registro = Object.assign({id:arenaUid('resultado'), status:'pendente', enviadoEm:new Date().toISOString()}, dados);
  pendentes.push(registro);
  arenaSave('resultados_pendentes', pendentes);
  return registro;
}

function arenaMarcarPagoIndividual(userId){
  const usuarios = arenaLoad('usuarios', []);
  const u = usuarios.find(u=>u.id===userId);
  if(u && u.inscricaoIndividual){ u.inscricaoIndividual.pago = true; arenaSave('usuarios', usuarios); }
  return u;
}

/* ---------------- campeonato ativo ---------------- */
/* Só existe 1 campeonato ativo por vez (regra do MVP). Enquanto o admin
   não publicar nenhum, isto retorna null — e as telas devem mostrar um
   estado vazio, não quebrar. */
function arenaCampeonatoAtivo(){
  return arenaLoad('campeonato', null);
}
function arenaSalvarCampeonatoAtivo(camp){
  arenaSave('campeonato', camp);
}