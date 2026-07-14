/* ==========================================================================
   ARENA — Configuração do produto (não é dado de cliente)
   Este arquivo só guarda o que é parte do PRODUTO em si — presets do
   motor de pontuação, métricas disponíveis, identidade da plataforma.
   Tudo que é dado de uma academia/campeonato específico (categorias,
   equipes, provas, patrocinadores, contas...) agora vive no
   localStorage, gerenciado por db.js / store.js, e começa vazio.
   ========================================================================== */

const ACADEMIA = {
  nome: "Crossbox",
  cidade: "Campo Grande, MS",
  logoLetter: "C",
  instagram: "@crossbox.oficial"
};

const METRICAS = ["Repetições","Tempo","Peso (kg)","Calorias","Distância (m)","Altura (cm)"];

const PONTUACAO_PRESETS = [
  { id:"menor-tempo", nome:"Menor tempo vence", desc:"Quem completar no menor tempo fica em 1º." },
  { id:"maior-reps", nome:"Maior quantidade de repetições vence", desc:"Ideal para AMRAPs." },
  { id:"maior-carga", nome:"Maior carga vence", desc:"Usado em provas de força máxima." },
  { id:"maior-distancia", nome:"Maior distância vence", desc:"Provas de cardio / remo / corrida." },
  { id:"maior-calorias", nome:"Maior quantidade de calorias", desc:"Bike / remo por tempo fixo." },
  { id:"colocacao", nome:"Pontuação por colocação", desc:"1º=100pts, 2º=95pts... segue tabela padrão." },
  { id:"tempo-penalidade", nome:"Tempo + Penalidade", desc:"Tempo final com acréscimo por não-conformidade." },
  { id:"reps-penalidade", nome:"Repetições + Penalidade", desc:"Reps com desconto por falha técnica." },
  { id:"peso-tempo", nome:"Peso + Tempo", desc:"Combina carga levantada com tempo de execução." },
];

/* Catálogo de exercícios "de fábrica" que toda academia nova recebe —
   isto é só um ponto de partida (o admin pode adicionar/remover o quanto
   quiser depois); não é dado fictício de demonstração. */
const EXERCICIOS_PADRAO = [
  { id:"ex-burpee", nome:"Burpee", tipo:"Ginástico", metricas:["Repetições"], img:"🤸" },
  { id:"ex-deadlift", nome:"Deadlift", tipo:"Levantamento", metricas:["Peso (kg)","Repetições"], img:"🏋️" },
  { id:"ex-wallball", nome:"Wall Ball", tipo:"Funcional", metricas:["Repetições","Peso (kg)"], img:"🥎" },
  { id:"ex-run", nome:"Corrida", tipo:"Cardio", metricas:["Distância (m)","Tempo"], img:"🏃" },
  { id:"ex-row", nome:"Remo", tipo:"Cardio", metricas:["Distância (m)","Calorias"], img:"🚣" },
  { id:"ex-bike", nome:"Bike Erg", tipo:"Cardio", metricas:["Calorias","Distância (m)"], img:"🚴" },
  { id:"ex-t2b", nome:"Toes to Bar", tipo:"Ginástico", metricas:["Repetições"], img:"🤾" },
  { id:"ex-pullup", nome:"Pull Up", tipo:"Ginástico", metricas:["Repetições"], img:"💪" },
  { id:"ex-muscleup", nome:"Muscle Up", tipo:"Ginástico", metricas:["Repetições"], img:"🔝" },
  { id:"ex-du", nome:"Double Under", tipo:"Ginástico", metricas:["Repetições","Tempo"], img:"➰" },
  { id:"ex-thruster", nome:"Thruster", tipo:"Levantamento", metricas:["Peso (kg)","Repetições"], img:"🏋️‍♀️" },
  { id:"ex-boxjump", nome:"Box Jump", tipo:"Funcional", metricas:["Repetições","Altura (cm)"], img:"📦" },
];

/* ==========================================================================
   Compatibilidade temporária
   As telas de gestão do admin (categorias, exercícios, provas, baterias,
   equipes, juízes, ranking...) ainda serão conectadas ao banco real nas
   próximas sub-etapas. Até lá, estas constantes ficam vazias para que
   essas páginas continuem funcionando (mostrando "nenhum item ainda")
   em vez de quebrar com dado inexistente.
   ========================================================================== */
const CATEGORIAS = [];
const EXERCICIOS = [];
const PROVAS = [];
const BATERIAS = [];
const EQUIPES = [];
const SPONSORS = [];
const FAQ = [];
const GALERIA = [];
const HALL_DA_FAMA = [];
const RANKING_GERAL = [];
const CAMPEONATOS_PASSADOS = [];
const JUIZES = [];
let CAMPEONATO_ATUAL = null;
const ADMIN_STATS = { campeonatosAtivos:0, equipesConfirmadas:0, atletasInscritos:0, receitaTotal:0, receitaPendente:0, resultadosPendentes:0 };