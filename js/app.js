/* ============================================================
   app.js — Exportação/backup, service worker e inicialização. Carregado POR ÚLTIMO — amarra tudo.
   Diário de Liberdade · gerado a partir do HTML único
   ============================================================ */

/* ===== EXPORT ===== */
function compartilharWhats(){
  const msg=encodeURIComponent('Estou usando o Diário de Liberdade do projeto "Rompendo o Silêncio" da Suelen. Se você também precisa, acesse: https://rompendoosilencio.com.br 💛');
  window.open('https://wa.me/?text='+msg,'_blank');
}
function compartilharDesabafo(){
  const texto=state.desabafo1||'';
  if(!texto.trim()){ showToast('Escreva sua carta primeiro 🌹'); return; }
  const msg=encodeURIComponent('Querida eu...\n\n'+texto.slice(0,500)+(texto.length>500?'...\n[continua]':''));
  window.open('https://wa.me/?text='+msg,'_blank');
}
/* ===== BACKUP COMPLETO (exportar / restaurar) =====
   Salva TODOS os dados do diário num arquivo .json que a pessoa
   guarda onde quiser. Protege contra perda se o navegador for limpo.
   NÃO inclui o PIN nem o PIN de pânico (segurança: o arquivo pode
   acabar acessível a outra pessoa). Áudios não entram no JSON por
   serem grandes — a pessoa é avisada. */
const BACKUP_KEYS=[STORE_KEY,HIST_KEY,PERM_KEY,ALERTA_KEY,COMP_KEY,RELATOS_KEY,VIC_KEY,JURIDICO_HIST_KEY,TL_KEY,OB_KEY,INST_KEY];

function exportarBackup(){
  try{
    const dados={};
    BACKUP_KEYS.forEach(k=>{ const v=localStorage.getItem(k); if(v!==null) dados[k]=v; });
    const pacote={
      _app:'Diario de Liberdade',
      _versao:25,
      _data:new Date().toISOString(),
      dados
    };
    const temAudio=!!localStorage.getItem(AUDIO_KEY);
    const blob=new Blob([JSON.stringify(pacote,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    const stamp=new Date().toISOString().slice(0,10);
    a.href=url; a.download='backup-diario-'+stamp+'.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    showToast('💾 Backup salvo! Guarde o arquivo num lugar seguro.'+(temAudio?' (áudios não entram no backup)':''));
  }catch(e){
    showToast('Não consegui gerar o backup. Tente de novo.');
  }
}

function importarBackup(input){
  const file=input.files&&input.files[0];
  if(!file) return;
  const reader=new FileReader();
  reader.onload=function(ev){
    let pacote;
    try{ pacote=JSON.parse(ev.target.result); }
    catch(e){ showToast('Esse arquivo não é um backup válido.'); input.value=''; return; }
    if(!pacote || pacote._app!=='Diario de Liberdade' || !pacote.dados){
      showToast('Esse arquivo não parece ser um backup do diário.'); input.value=''; return;
    }
    const dataBk = pacote._data ? new Date(pacote._data).toLocaleDateString('pt-BR') : 'data desconhecida';
    const ok=confirm('Restaurar o backup de '+dataBk+'?\n\nIsto vai substituir o que está salvo agora neste aparelho pelo conteúdo do arquivo. Seu PIN atual é mantido.');
    if(!ok){ input.value=''; return; }
    try{
      Object.keys(pacote.dados).forEach(k=>{
        if(BACKUP_KEYS.indexOf(k)!==-1) localStorage.setItem(k, pacote.dados[k]);
      });
      input.value='';
      showToast('✅ Backup restaurado! Recarregando…');
      setTimeout(()=>location.reload(),1200);
    }catch(e){
      showToast('Algo deu errado ao restaurar. Nada foi alterado.'); input.value='';
    }
  };
  reader.onerror=function(){ showToast('Não consegui ler o arquivo.'); input.value=''; };
  reader.readAsText(file);
}

function exportarDiario(){
  const btn=document.querySelector('[onclick="exportarDiario()"]');
  if(btn) btn.classList.add('loading');
  setTimeout(()=>{
    const hoje=new Date((state.date||getToday())+'T12:00:00');
    const dataFmt=hoje.toLocaleDateString('pt-BR');
    const secoes=[
      ['PERCEPÇÃO',''],['O que me incomoda',state.p_incomoda||''],['Há quanto tempo',state.p_tempo||''],
      ['EMOÇÕES',''],['O que a dor diz',state.e_dor||''],['Intensidade',state.escala?state.escala+'/10':''],
      ['REFLEXÃO',''],['Quem eu era',state.r1||''],['O que precisaria acreditar',state.r2||''],['Medo',state.r3||''],['Sem o medo',state.r4||''],['Uma coisa por mim',state.r5||''],
      ['DESABAFO',''],['Carta para mim',state.desabafo1||''],['Carta para ele',state.desabafo2||''],['Promessa',state.desabafo3||''],
      ['CONTRATO',''],['Direito 1',state.dir1||''],['Direito 2',state.dir2||''],['Direito 3',state.dir3||''],['Carta 1 ano',state.carta||''],
      ['JURÍDICO',''],
      ['Relação com agressor',state.jc1||''],['Tempo de ocorrência',state.jc2||''],['Frequência',state.jc3||''],
      ['Tipo de violência', (()=>{const t=[];document.querySelectorAll('#tipo-violencia-grid .tipo-btn.on').forEach(b=>t.push(b.textContent.trim()));return t.join(', ');})()],
      ['O que aconteceu',state.j2||''],['Local',state.jc4||''],['Data/período',state.jc5||''],
      ['Impacto na vítima',state.jc6||''],['Testemunhas',state.j3t||''],['Evidências',state.j3||''],
      ['Risco atual',state.jc_risco||''],['Detalhe do risco',state.jc7||''],['Medida protetiva',state.j4||''],['Depoimento',state.j5||''],
    ];
    let txt='MEU DIÁRIO DE LIBERDADE\n'+dataFmt+'\n'+'═'.repeat(40)+'\n\n';
    secoes.forEach(([t,c])=>{ if(!c) txt+='\n── '+t+' ──\n'; else if(c.trim()) txt+=t+':\n'+c.trim()+'\n\n'; });
    // Relatos datados
    if(relatosList.length){
      txt+='\n── RELATOS DATADOS ──\n';
      relatosList.forEach(r=>{ txt+='['+r.data+']\n'+r.texto+'\n\n'; });
    }
    // Gravações de áudio (sem transcrição salva em relatos)
    try{
      const audRaw = localStorage.getItem('diario_audios');
      if(audRaw){
        const audios = JSON.parse(audRaw);
        const audiosSemRelato = audios.filter(a => !a.transcricao);
        if(audiosSemRelato.length){
          txt+='\n── GRAVAÇÕES DE ÁUDIO (sem transcrição) ──\n';
          audiosSemRelato.forEach(a=>{ txt+='['+a.data+'] Duração: '+Math.floor(a.durSecs/60)+'m'+String(a.durSecs%60).padStart(2,'0')+'s\n'; });
          txt+='\n';
        }
      }
    }catch(e){}
    // Conquistas
    if(conquistasList.length){
      txt+='\n── CONQUISTAS ──\n';
      conquistasList.forEach(c=>{ txt+='['+c.data+'] '+c.texto+'\n'; });
      txt+='\n';
    }
    const blob=new Blob([txt],{type:'text/plain;charset=utf-8'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url; a.download='diario-liberdade-'+dataFmt.replace(/\//g,'-')+'.txt'; a.click();
    URL.revokeObjectURL(url);
    if(btn) btn.classList.remove('loading');
    showToast('✓ Diário salvo!');
  },300);
}
function exportarDesabafo(){
  const texto=state.desabafo1||'';
  if(!texto.trim()){ showToast('Escreva sua carta primeiro 🌹'); return; }
  const blob=new Blob(['Querida eu...\n\n'+texto],{type:'text/plain;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url; a.download='minha-carta-desabafo.txt'; a.click();
  URL.revokeObjectURL(url);
  showToast('🌹 Carta salva!');
}


/* ===== SERVICE WORKER INLINE (arquivo único) ===== */
(function(){
  // Registra o service worker a partir do arquivo real sw.js.
  // Funciona em https:// (Vercel) e localhost; ignorado em file://.
  if(!('serviceWorker' in navigator)) return;
  if(location.protocol === 'file:') {
    console.log('[SW] Ignorado em file:// — abra via servidor ou instale como app');
    return;
  }
  navigator.serviceWorker.register('./sw.js', {scope:'./'})
    .then(()=>console.log('[SW] App offline pronto ✓'))
    .catch(err=>console.warn('[SW] Não registrado:',err));
})();

function injectManifest(){
  /* O manifest agora é um arquivo real (manifest.json), linkado direto no
     index.html. Não precisa mais gerar em memória — esta função fica como
     no-op para não quebrar a chamada existente. */
}


/* ===== INIT ===== */
window.addEventListener("beforeunload", function(){ clearTimeout(_autoSaveTimer); saveState(); saveEntries(); saveExtras(); saveConquistas(); });
document.addEventListener("visibilitychange", function(){ if(document.visibilityState==="hidden") saveState(); });
loadState();
// Modo sigilo — se ativo, mostra disfarce e para aqui
const _sigiloAtivou = initSigilo();
if(!_sigiloAtivou) {
  // Tela institucional — primeira abertura (só se não sigilo)
  initInstitutional();
}
// Iniciar navegação por fases após carregar estado
setTimeout(initPhaseNav, 50);
// Botões de ligar — inicializar após estado carregado
setTimeout(initBotoesLigar, 100);
// CVV: mostrar quando usuária acessa fases 2 ou 3 (seções mais sensíveis)
// Isso garante que o CVV aparece quando necessário mas não na tela inicial
function checkCVVVisibility(phaseIdx){
  const bar = document.getElementById('cvv-bar');
  if(!bar) return;
  // Mostra CVV nas fases 2 (Minha voz) e 3 (Meu poder) e seções secundárias
  if(phaseIdx >= 2){
    bar.style.display = '';
  } else {
    bar.style.display = 'none';
  }
}
loadExtras();
loadConquistas();
initPin();
applyTheme();
initDate();
restoreChecks();
restoreMoods();
restoreGatilhos();
restoreCorpo();
restoreEscala();
restorePerigos();
restoreAlertas();
restoreComps();
restoreTipos();
restoreRisco();
initFields();
initRelatoData();
updateProgress();
injectManifest();
resetInactivityTimer();

// ─── ESTADO INICIAL DE EXIBIÇÃO ────────────────────────────────────────────
// Define a visibilidade de ML / full-app imediatamente no carregamento
// (tudo fica coberto pela tela de PIN; este bloco apenas pré-posiciona).
// A decisão com navegação real acontece em initOnboarding(), chamada após o PIN.
(function setInitialDisplay(){
  const today       = (new Date()).toISOString().slice(0,10);
  const mlDoneToday = (localStorage.getItem('diario_ml_date') === today);
  const ml  = document.getElementById('modo-leve-card');
  const app = document.getElementById('full-app');

  if(mlDoneToday){
    // Modo Leve já feito hoje → prepara para mostrar full-app após PIN
    if(ml)  ml.style.display = 'none';
    if(app) app.style.display = '';
    document.body.classList.remove('ml-active');
  } else {
    // Modo Leve pendente → mantém ML em tela cheia, full-app oculto
    if(ml)  ml.style.display  = '';
    if(app) app.style.display = 'none';
    document.body.classList.add('ml-active');
  }
})();

// Dismiss splash após carregamento completo
(function dismissSplash(){
  const splash = document.getElementById('app-splash');
  if(!splash) return;
  const dismiss = () => {
    splash.classList.add('fade-out');
    setTimeout(()=>splash.classList.add('gone'), 520);
    // show onboarding after pin if first time
    setTimeout(initOnboarding, 600);
  };
  if(document.fonts && document.fonts.ready){
    document.fonts.ready.then(()=>setTimeout(dismiss, 350));
  } else {
    setTimeout(dismiss, 600);
  }
})();


/* ─── INIT das novas features (movido do security.js) ───
   Roda por último, quando todos os módulos já carregaram.
   O typeof protege contra erro caso alguma função mude de lugar. */
setTimeout(function(){
  if(typeof mostrarAfirmacao === 'function') mostrarAfirmacao();
  if(typeof loadTimeline === 'function') loadTimeline();
  if(typeof atualizarVisibilidadeBtnAjuda === 'function') atualizarVisibilidadeBtnAjuda();
}, 100);
