/* ============================================================
   core.js — Variáveis globais, chaves de armazenamento e hash de PIN. Carregado PRIMEIRO — todos os outros dependem daqui.
   Aurora · seu espaço seguro
   ============================================================ */

const STORE_KEY='diario_liberdade_v2';
const HIST_KEY='diario_liberdade_hist';
const PIN_KEY='diario_pin';
/* ===== HASH DE PIN (SHA-256 + salt) =====
   O PIN nunca é guardado em texto puro. Guardamos só o hash.
   Migração automática: PINs antigos (4 dígitos puros) são
   re-hasheados de forma transparente na primeira entrada certa. */
const _PIN_SALT='diario_liberdade::v25::salt';
async function hashPin(pin){
  try{
    const data=new TextEncoder().encode(_PIN_SALT+'|'+pin);
    const buf=await crypto.subtle.digest('SHA-256',data);
    return 'h$'+Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
  }catch(e){
    // Fallback se crypto.subtle indisponível (contexto não seguro): mantém comparação direta
    return pin;
  }
}
// true se o valor guardado é um hash nosso
function _isHashed(v){ return typeof v==='string' && v.indexOf('h$')===0; }
// Compara um PIN digitado contra um valor guardado (hash OU texto puro legado).
// Se bater contra texto puro legado, migra para hash silenciosamente.
async function pinMatches(pinDigitado, storedKey){
  const stored=localStorage.getItem(storedKey);
  if(!stored || stored==='none') return false;
  if(_isHashed(stored)){
    return (await hashPin(pinDigitado))===stored;
  }
  // legado em texto puro
  if(pinDigitado===stored){
    try{ localStorage.setItem(storedKey, await hashPin(pinDigitado)); }catch(e){}
    return true;
  }
  return false;
}
const PERM_KEY='diario_permanente';   // dados que nunca zeram
const state={};
let allEntries={};
let quickState={moods:[],escala:0};
let calViewDate=new Date();

/* ═══ CHAVES PERMANENTES — nunca zeram à meia-noite ══════════
   Rede de apoio, contrato pessoal, jurídico, tema, fase atual  */
const PERM_KEYS = new Set([
  // rede de apoio
  'ap1_nome','ap1_tel','ap1_rel',
  'ap2_nome','ap2_tel','ap2_rel',
  'ap3_nome','ap3_tel','ap3_rel',
  'prof1_nome','prof1_tel',
  'prof2_nome','prof2_tel',
  // contrato pessoal
  'nome','assinatura','revisitar','dir1','dir2','dir3','carta',
  // jurídico — coleta de evidências
  'jc1','jc2','jc3','jc4','jc5','jc6','jc7',
  'j1','j2','j3','j3t','j4','j5',
  'tv1','tv2','tv3','tv4','tv5','tv6','tv7','tv8',
  'jc_risco',
  // preferências do app
  'theme','currentPhase','currentRoom',
  // checklist de segurança
  'ck1','ck2','ck3','ck4','ck5','ck6','ck7','ck8','ck9','ck10',
  'ck11','ck12','ck13','ck14','ck15','ck16','ck17','ck18','ck19','ck20',
  'ck21','ck22','ck23','ck24','ck25','ck26','ck27',
]);
/* ════════════════════════════════════════════════════════════ */
