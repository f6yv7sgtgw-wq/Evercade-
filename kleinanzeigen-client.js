(() => {
  'use strict';
  const VERSION='0.9.4', CONTRACT='generic-parser-module-v1', SOURCE='Kleinanzeigen';
  const WORKER='https://genericparser.f6yv7sgtgw.workers.dev', DAY=86400000, PAUSE=5000;
  const DAILY_KEY='evercade-ka-v094-daily', STATUS_KEY='evercade-ka-v094-status';
  const $=s=>document.querySelector(s), wait=ms=>new Promise(r=>setTimeout(r,ms));
  let busy=false;

  const persist=()=>{ if(typeof persistState==='function') persistState(); };
  function stored(){ try{return JSON.parse(localStorage.getItem(STATUS_KEY)||'null');}catch{return null;} }
  function setStatus({status='unavailable',accepted=0,candidatesExamined=0,note='',checkedAt=null}={}){
    if(typeof state==='undefined') return;
    state.background||={};
    state.background.sourceStatus=Array.isArray(state.background.sourceStatus)?state.background.sourceStatus:[];
    const previous=state.background.sourceStatus.find(x=>x?.name===SOURCE)||stored()||{};
    const next={name:SOURCE,status:status==='ok'?'ok':'unavailable',checkedAt,lastSuccessAt:status==='ok'?checkedAt:previous.lastSuccessAt||null,note:String(note||'').slice(0,300),accepted:Math.max(0,Number(accepted)||0),candidatesExamined:Math.max(0,Number(candidatesExamined)||0)};
    state.background.sourceStatus=[...state.background.sourceStatus.filter(x=>x?.name!==SOURCE),next].sort((a,b)=>String(a.name).localeCompare(String(b.name),'de'));
    localStorage.setItem(STATUS_KEY,JSON.stringify(next)); persist();
  }
  function ensureStatus(){ setStatus(stored()||{status:'unavailable',checkedAt:null,note:'Noch nicht geprüft'}); }
  function syncVersion(){
    document.querySelectorAll('.version-badge').forEach(n=>n.textContent=`Version ${VERSION}`);
    document.querySelectorAll('#alertsView .eyebrow').forEach(n=>{if(/^Version\s/i.test(n.textContent||''))n.textContent=`Version ${VERSION}`;});
    document.documentElement.dataset.evercadeVersion=VERSION;
  }
  function show(message,kind=''){
    const t=$('#genericParserStatus')||$('#liveSearchStatus'); if(!t)return;
    t.className=`live-search-status${kind==='error'?' is-error':kind==='loading'?' is-loading':''}`; t.textContent=message;
  }
  async function api(path,options={}){
    const response=await fetch(`${WORKER}${path}`,{method:options.method||'GET',headers:{accept:'application/json',...(options.body?{'content-type':'application/json'}:{})},body:options.body?JSON.stringify(options.body):undefined,cache:'no-store'});
    let body=null; try{body=await response.json();}catch{}
    if(!response.ok) throw new Error(body?.detail||body?.error||`GenericParser HTTP ${response.status}`); return body;
  }
  async function verify(){
    const version=await api('/api/version'); const contract=version?.module_contract||version?.api_contract;
    if(contract!==CONTRACT) throw new Error(`Nicht unterstützter Vertrag: ${contract||'unbekannt'}`);
    const caps=await api('/api/module/v1/capabilities');
    if(caps?.contract!==CONTRACT||!caps?.sources?.includes('kleinanzeigen')) throw new Error('Kleinanzeigen-Modul nicht verfügbar.');
    return version;
  }
  function requestFor(item,page){
    const limit=Number(state?.background?.priceLimits?.[item.key]);
    return {profile:{profile_id:`evercade:${item.key}`,display_name:`Evercade · ${item.title}`,query:`Evercade ${item.title}`,required_terms:[],excluded_terms:['nur Hülle','Leerhülle','Controller','Konsole'],model_patterns:[item.title],brands:['Evercade','Blaze'],max_price:Number.isFinite(limit)&&limit>0?limit:null,accept_bundles:false,accept_incomplete:false,include_review:true,include_rejected:false,sort_by:'date'},page,source:'auto',debug:{enabled:false}};
  }
  function normalize(x){
    const price=Number(x?.price); if(!x?.id||!x?.url||!Number.isFinite(price)||price<0)return null;
    return {id:`kleinanzeigen-${x.id}`,source:SOURCE,title:String(x.title||''),price,shipping:null,total:null,shippingKnown:false,condition:String(x.result_info?.condition||'Gebraucht'),availability:'in_stock',sellerType:'Privat',color:'Automatisch',url:String(x.url),confidence:Math.max(0,Math.min(100,Number(x.match?.score)||0)),verifiedAt:new Date().toISOString(),place:[x.postal_code,x.place].filter(Boolean).join(' '),trafficLight:x.traffic_light?.color||'yellow'};
  }
  async function searchItem(item,maxPackets=1){
    const offers=new Map(); let page=0,packets=0,candidatesExamined=0;
    while(packets<maxPackets){
      const result=await api('/api/module/v1/search',{method:'POST',body:requestFor(item,page)});
      if(result?.contract!==CONTRACT||result?.profile_id!==`evercade:${item.key}`) throw new Error('Inkonsistente GenericParser-Antwort.');
      candidatesExamined+=Number(result?.metrics?.candidates_examined||result?.counts?.parsed||(result.listings||[]).length)||0;
      for(const listing of result.listings||[]){const offer=normalize(listing);if(offer)offers.set(offer.id,offer);}
      packets++; const p=result.pagination||{}; if(p.complete||p.next_page==null)break;
      page=Number(p.next_page); if(!Number.isInteger(page)||page<0)throw new Error('Ungültige Pagination.'); await wait(PAUSE);
    }
    return {offers:[...offers.values()],packets,candidatesExamined};
  }
  function merge(item,offers){
    if(typeof state==='undefined')return; state.monitor||={observations:{},history:{}}; state.monitor.observations||={};
    const previous=state.monitor.observations[item.key]||{offers:[]}; const other=(previous.offers||[]).filter(o=>o?.source!==SOURCE);
    state.monitor.observations[item.key]={...previous,checkedAt:new Date().toISOString(),offers:[...other,...offers].slice(0,20),automaticSourcesAvailable:Math.max(10,Number(previous.automaticSourcesAvailable)||0),candidatesExamined:Math.max(Number(previous.candidatesExamined)||0,offers.length)}; persist();
  }
  function renderOffers(offers){
    const host=$('#liveDealResults'); if(!host)return; let target=$('#genericParserResults');
    if(!target){target=document.createElement('div');target.id='genericParserResults';target.className='live-deal-results';host.appendChild(target);}
    target.innerHTML=offers.length?offers.map(o=>`<article class="cartridge live-offer"><div class="deal-detail"><strong>${o.price.toFixed(2).replace('.',',')} € · Kleinanzeigen</strong><span>${o.title}</span><small>${o.place||'Ort nicht angegeben'} · Versand im Inserat prüfen</small></div><div class="card-actions"><a class="secondary-button link-button" href="${o.url}" target="_blank" rel="noopener">Anzeige öffnen</a></div></article>`).join(''):'<p class="empty">Keine passenden Kleinanzeigen-Treffer gefunden.</p>';
  }
  async function runInteractiveSearch(){
    if(busy)return; const key=$('#searchCatalogItem')?.value; const item=typeof catalogByKey!=='undefined'?catalogByKey.get(key):null; if(!item)return;
    busy=true; show('Kleinanzeigen wird über GenericParser 0.45 geprüft …','loading');
    try{const id=await verify();const result=await searchItem(item,4);merge(item,result.offers);setStatus({status:'ok',accepted:result.offers.length,candidatesExamined:result.candidatesExamined,checkedAt:new Date().toISOString()});renderOffers(result.offers);show(`${result.offers.length} Kleinanzeigen-Treffer · ${result.packets} Paket(e) · Worker ${id.version||'0.45.0'}.`);if(typeof renderAlerts==='function')renderAlerts();}
    catch(error){setStatus({status:'unavailable',note:error.message,checkedAt:new Date().toISOString()});show(`Kleinanzeigen-Suche fehlgeschlagen: ${error.message}`,'error');if(typeof renderAlerts==='function')renderAlerts();}
    finally{busy=false;}
  }
  function due(){const last=Number(localStorage.getItem(DAILY_KEY)||0);return !last||Date.now()-last>=DAY;}
  async function runDailyScan({force=false,silent=false}={}){
    if(busy||(!force&&!due())||typeof missingItems!=='function')return; const items=missingItems(); if(!Array.isArray(items)||!items.length)return;
    busy=true;let accepted=0,candidatesExamined=0;
    try{await verify();for(let i=0;i<items.length;i++){const item=items[i];if(!silent)show(`Kleinanzeigen ${i+1}/${items.length}: ${item.title}`,'loading');try{const r=await searchItem(item,1);accepted+=r.offers.length;candidatesExamined+=r.candidatesExamined;merge(item,r.offers);}catch(e){console.warn('Kleinanzeigen-Suche fehlgeschlagen',item.key,e);}if(i<items.length-1)await wait(PAUSE);}const checkedAt=new Date().toISOString();localStorage.setItem(DAILY_KEY,String(Date.now()));setStatus({status:'ok',accepted,candidatesExamined,checkedAt});if(!silent)show(`Kleinanzeigen-Prüfung abgeschlossen: ${accepted} passende Anzeigen.`);if(typeof render==='function')render();}
    catch(error){setStatus({status:'unavailable',note:error.message,checkedAt:new Date().toISOString()});if(!silent)show(`Kleinanzeigen-Prüfung fehlgeschlagen: ${error.message}`,'error');}
    finally{busy=false;}
  }
  function installHooks(){
    if(typeof applyBackgroundSnapshot==='function'&&!applyBackgroundSnapshot.__ka094){const original=applyBackgroundSnapshot;applyBackgroundSnapshot=function(...args){const result=original.apply(this,args);ensureStatus();return result;};applyBackgroundSnapshot.__ka094=true;}
    if(typeof runBackgroundScan==='function'&&!runBackgroundScan.__ka094){const original=runBackgroundScan;runBackgroundScan=async function(...args){const result=await original.apply(this,args);await runDailyScan({force:true,silent:false});return result;};runBackgroundScan.__ka094=true;}
  }
  function bind(){syncVersion();ensureStatus();installHooks();$('#searchDealsButton')?.addEventListener('click',()=>setTimeout(runInteractiveSearch,0));document.body.addEventListener('click',event=>{if(event.target.closest('[data-action="background-refresh"]'))setTimeout(()=>{ensureStatus();if(typeof renderAlerts==='function')renderAlerts();},750);});setTimeout(()=>runDailyScan({silent:true}),1500);}
  window.EvercadeKleinanzeigen={version:VERSION,workerUrl:WORKER,runInteractiveSearch,runDailyScan};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();