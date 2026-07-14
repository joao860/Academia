/* ==========================================================================
   ARENA — Camada de persistência local (protótipo "imersivo")
   Guarda o estado do sistema no localStorage do navegador para simular
   um backend real: o que for cadastrado em uma tela aparece nas outras.
   Isso é só para fins de demonstração do protótipo — não é um backend real.
   ========================================================================== */

const ARENA_NS = 'arena_proto_v1_';

function arenaLoad(key, fallback){
  try{
    const raw = localStorage.getItem(ARENA_NS + key);
    return raw !== null ? JSON.parse(raw) : fallback;
  }catch(e){
    return fallback;
  }
}

function arenaSave(key, value){
  try{
    localStorage.setItem(ARENA_NS + key, JSON.stringify(value));
    return true;
  }catch(e){
    return false;
  }
}

function arenaClearAll(){
  try{
    Object.keys(localStorage)
      .filter(k => k.startsWith(ARENA_NS))
      .forEach(k => localStorage.removeItem(k));
  }catch(e){}
}

/* Substitui o conteúdo de um array "const" (definido em mock-data.js) pelo
   conteúdo salvo, sem quebrar a referência que as outras telas já possuem. */
function arenaHydrateArray(arr, key){
  const saved = arenaLoad(key, null);
  if(saved && Array.isArray(saved)){
    arr.splice(0, arr.length, ...saved);
  }
  return arr;
}
