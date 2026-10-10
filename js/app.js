const API={
  channels:"https://iptv-org.github.io/api/channels.json",
  streams:"https://iptv-org.github.io/api/streams.json",
  logos:"https://iptv-org.github.io/api/logos.json",
  countries:"https://iptv-org.github.io/api/countries.json",
  languages:"https://iptv-org.github.io/api/languages.json",
  allPlaylist:"https://iptv-org.github.io/iptv/index.m3u"
};

const CACHE_KEY="btech-fast-catalog-v4";
const LIVE_SOURCE_TIMEOUT=3500;
const PLAY_TIMEOUT=5200;
const state={
  channels:[],filtered:[],page:1,pageSize:60,view:"all",
  favorites:new Set(JSON.parse(localStorage.getItem("btech-favorites")||"[]")),
  hls:null,current:null,cache:{countriesByCode:{},languagesByCode:{}}
};

const $=id=>document.getElementById(id);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
function toast(msg){const t=$("toast");t.textContent=msg;t.classList.add("show");clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove("show"),2200)}
function saveFav(){localStorage.setItem("btech-favorites",JSON.stringify([...state.favorites]));$("favStat").textContent=state.favorites.size}
function countryName(code){return state.cache.countriesByCode?.[code]?.name||code||"Unknown"}
function countryFlag(code){
  const c=String(code||"").toUpperCase().trim();
  if(!/^[A-Z]{2}$/.test(c)) return "🌐";
  return String.fromCodePoint(...[...c].map(ch=>127397+ch.charCodeAt(0)));
}
function langName(code){return state.cache.languagesByCode?.[code]?.name||code||"Unknown"}

/* Fast network/cache layer:
   - browser Cache API keeps catalog between visits
   - cached data is used immediately when available
   - no-cache/no-store is deliberately avoided
*/
async function fetchJSON(url,{timeout=5000}={}){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),timeout);
  try{
    const r=await fetch(url,{signal:controller.signal,cache:"force-cache"});
    if(!r.ok) throw new Error(`${r.status} ${r.statusText}`);
    return await r.json();
  }finally{clearTimeout(timer)}
}
async function getCachedJSON(url){
  if(!("caches" in window)) return null;
  try{
    const c=await caches.open("btech-api-v1"),r=await c.match(url);
    if(!r) return null;
    return r.json();
  }catch{return null}
}
async function cacheJSON(url,data){
  if(!("caches" in window)) return;
  try{
    const c=await caches.open("btech-api-v1");
    await c.put(url,new Response(JSON.stringify(data),{headers:{"Content-Type":"application/json"}}));
  }catch{}
}
async function fastJSON(url){
  const cached=await getCachedJSON(url);
  if(cached){
    // Refresh in background; cached result gives an instant UI.
    fetchJSON(url).then(data=>cacheJSON(url,data)).catch(()=>{});
    return cached;
  }
  const data=await fetchJSON(url);
  cacheJSON(url,data);
  return data;
}
function saveCatalogCache(){
  try{
    localStorage.setItem(CACHE_KEY,JSON.stringify({saved:Date.now(),channels:state.channels}));
  }catch{}
}
function loadCatalogCache(){
  try{
    const x=JSON.parse(localStorage.getItem(CACHE_KEY)||"null");
    if(x?.channels?.length){state.channels=x.channels;return true}
  }catch{}
  return false;
}

function mergeData(channels,streams,logos=[]){
  const logoMap=new Map();
  for(const l of logos||[]) if(l.channel&&l.url&&!logoMap.has(l.channel)) logoMap.set(l.channel,l.url);
  const streamMap=new Map();
  for(const s of streams||[]){
    if(!s.channel||!s.url) continue;
    if(!streamMap.has(s.channel))streamMap.set(s.channel,[]);
    streamMap.get(s.channel).push(s);
  }
  return channels.filter(c=>!c.closed).map(c=>{
    const ss=streamMap.get(c.id)||[],s=ss[0]||{};
    return {
      id:c.id,name:c.name,country:c.country||"",categories:c.categories||[],
      logo:logoMap.get(c.id)||"",quality:s.quality||"",stream:s.url||"",
      labels:s.labels||[],feed:s.feed||"",language:s.lang||c.language||""
    };
  }).filter(c=>c.stream);
}
function sideQuery(){return ($("sideSearch")?.value||"").trim().toLowerCase()}
function populateFilters(){
  const countries=[...new Set(state.channels.map(c=>c.country).filter(Boolean))].sort();
  const cats=[...new Set(state.channels.flatMap(c=>c.categories||[]).filter(Boolean))].sort();
  const langs=[...new Set(state.channels.map(c=>c.language).filter(Boolean))].sort();
  const add=(id,items,type)=>{
    const label=type==="country"?"countries":type==="category"?"categories":"languages";
    const el=$(id);
    el.innerHTML=`<option value="">All ${label}</option>`+items.map(x=>`<option value="${esc(x)}">${esc(type==="country"?countryName(x):type==="language"?langName(x):x)}</option>`).join("");
  };
  add("countryFilter",countries,"country");add("categoryFilter",cats,"category");add("languageFilter",langs,"language");
  $("countryCountLabel").textContent=countries.length.toLocaleString();
  $("categoryCountLabel").textContent=cats.length.toLocaleString();
  renderSidebarLists(countries,cats);
}
function renderSidebarLists(countries,cats){
  const q=sideQuery();
  const filteredCountries=countries.filter(x=>!q||countryName(x).toLowerCase().includes(q)||x.toLowerCase().includes(q));
  const filteredCats=cats.filter(x=>!q||x.toLowerCase().includes(q));
  $("countryList").innerHTML=filteredCountries.map(x=>`<button data-country="${esc(x)}" class="${$("countryFilter")?.value===x?"active":""}"><span class="country-label"><span class="country-flag" aria-hidden="true">${countryFlag(x)}</span><span>${esc(countryName(x))}</span></span><span>${state.channels.filter(c=>c.country===x).length}</span></button>`).join("");
  $("categoryList").innerHTML=filteredCats.map(x=>`<button data-category="${esc(x)}" class="${$("categoryFilter")?.value===x?"active":""}"><span>${esc(x)}</span><span>${state.channels.filter(c=>(c.categories||[]).includes(x)).length}</span></button>`).join("");
}
function qualityOK(q,target){
  if(!target)return true;const n=parseInt(q)||0;
  if(target==="4K")return /4k/i.test(q)||n>=2160;
  return n>=parseInt(target);
}
function applyFilters(){
  const q=$("search").value.trim().toLowerCase(),country=$("countryFilter").value,cat=$("categoryFilter").value,lang=$("languageFilter").value,quality=$("qualityFilter").value;
  state.filtered=state.channels.filter(c=>
    (!q||`${c.name} ${c.id} ${countryName(c.country)} ${(c.categories||[]).join(" ")} ${langName(c.language)}`.toLowerCase().includes(q))&&
    (!country||c.country===country)&&(!cat||(c.categories||[]).includes(cat))&&(!lang||c.language===lang)&&qualityOK(c.quality,quality)
  );
  if(state.view==="favorites")state.filtered=state.filtered.filter(c=>state.favorites.has(c.id));
  state.page=1;render();
}
function render(){
  const end=state.page*state.pageSize,items=state.filtered.slice(0,end);
  $("grid").innerHTML=items.map(card).join("");
  $("visibleStat").textContent=state.filtered.length.toLocaleString();
  $("resultText").textContent=`${state.filtered.length.toLocaleString()} channels`;
  $("empty").hidden=items.length!==0;
  $("loadMore").hidden=end>=state.filtered.length||items.length===0;
}
function card(c){
  const fav=state.favorites.has(c.id);
  const logo=c.logo?`<img loading="lazy" decoding="async" src="${esc(c.logo)}" alt="" onerror="this.remove()">`:"";
  const meta=[`${countryFlag(c.country)} ${countryName(c.country)}`,c.categories?.[0]||"General",c.quality||"Live"].filter(Boolean).join(" • ");
  return `<article class="channel" data-id="${esc(c.id)}">
    <div class="thumb">${logo}<span class="quality">${esc(c.quality||"LIVE")}</span><button class="star ${fav?"on":""}" data-fav="${esc(c.id)}" title="Favorite">${fav?"★":"☆"}</button></div>
    <div class="card-body"><div class="name" title="${esc(c.name)}">${esc(c.name)}</div><div class="meta">${esc(meta)}</div><span class="badge">${c.labels?.length?esc(c.labels[0]):"PUBLIC STREAM"}</span></div>
  </article>`;
}

async function loadExtraMeta(){
  // Non-critical metadata is intentionally deferred so channels appear first.
  try{
    const [countries,languages]=await Promise.all([fastJSON(API.countries),fastJSON(API.languages)]);
    state.cache.countriesByCode=Object.fromEntries(countries.map(x=>[x.code,x]));
    state.cache.languagesByCode=Object.fromEntries(languages.map(x=>[x.code,x]));
    populateFilters();applyFilters();
  }catch{}
  // Logos are the heaviest visual request. Load them after the first paint.
  try{
    const logos=await fastJSON(API.logos);
    const map=new Map();
    for(const l of logos||[])if(l.channel&&l.url&&!map.has(l.channel))map.set(l.channel,l.url);
    let changed=false;
    for(const c of state.channels)if(!c.logo&&map.has(c.id)){c.logo=map.get(c.id);changed=true}
    if(changed){saveCatalogCache();render()}
  }catch{}
}
async function loadCatalog(){
  $("statusText").textContent="Loading fast catalog…";
  const cached=loadCatalogCache();
  if(cached){
    $("totalStat").textContent=state.channels.length.toLocaleString();
    $("countryStat").textContent=new Set(state.channels.map(c=>c.country)).size.toLocaleString();
    populateFilters();applyFilters();
    $("statusText").textContent=`${state.channels.length.toLocaleString()} streams ready`;
    // Update the cache without blocking the interface.
    Promise.all([fastJSON(API.channels),fastJSON(API.streams)]).then(([channels,streams])=>{
      const fresh=mergeData(channels,streams,state.channels.map(c=>c.logo?{channel:c.id,url:c.logo}:null).filter(Boolean));
      if(fresh.length){state.channels=fresh;saveCatalogCache();$("totalStat").textContent=fresh.length.toLocaleString();applyFilters()}
    }).catch(()=>{});
    loadExtraMeta();
    triggerLivePlayback();
    return;
  }
  try{
    // Only the two critical datasets block first render.
    const [channels,streams]=await Promise.all([fastJSON(API.channels),fastJSON(API.streams)]);
    state.channels=mergeData(channels,streams);
    saveCatalogCache();
    $("totalStat").textContent=state.channels.length.toLocaleString();
    $("countryStat").textContent=new Set(state.channels.map(c=>c.country)).size.toLocaleString();
    populateFilters();applyFilters();
    $("statusText").textContent=`${state.channels.length.toLocaleString()} streams ready`;
    loadExtraMeta();
    triggerLivePlayback();
  }catch(e){
    $("statusText").textContent="Catalog failed to load";
    toast("Catalog could not load. Check your internet connection or use the cached catalog.");
    console.error(e);
  }
}
let autoPlayStarted=false;

async function play(c,{auto=false}={}){
  if(!c?.stream)return false;
  state.current=c;
  $("nowTitle").textContent=c.name;
  $("nowMeta").textContent=`${countryName(c.country)} • ${c.categories?.join(", ")||"General"} • ${c.quality||"Live"}`;
    $("playerEmpty").style.display="none";

  const video=$("video");
  video.preload="auto";
  video.playsInline=true;

  // Browsers normally block autoplay with sound. Start automatic playback muted;
  // the normal player controls can be used to unmute after playback starts.
  if(auto)video.muted=true;

  if(state.hls){try{state.hls.destroy()}catch{}state.hls=null}
  video.pause();
  video.removeAttribute("src");
  video.load();

  const start=()=>video.play().then(()=>true).catch(()=>false);

  if(video.canPlayType("application/vnd.apple.mpegurl")){
    video.src=c.stream;
    return await start();
  }

  if(window.Hls&&Hls.isSupported()){
    state.hls=new Hls({
      enableWorker:true,
      lowLatencyMode:true,
      backBufferLength:15,
      maxBufferLength:10,
      maxMaxBufferLength:20,
      capLevelToPlayerSize:true,
      startLevel:-1,
      autoStartLoad:true,
      startFragPrefetch:true,
      manifestLoadingTimeOut:LIVE_SOURCE_TIMEOUT,
      levelLoadingTimeOut:LIVE_SOURCE_TIMEOUT,
      fragLoadingTimeOut:LIVE_SOURCE_TIMEOUT,
      manifestLoadingMaxRetry:0,
      fragLoadingMaxRetry:0,
      levelLoadingMaxRetry:0,
      maxLiveSyncPlaybackRate:1.5,
      liveSyncDurationCount:2,
      liveMaxLatencyDurationCount:4
    });
    state.hls.loadSource(c.stream);
    state.hls.attachMedia(video);
    return await new Promise(resolve=>{
      let settled=false;
      const done=v=>{if(!settled){settled=true;resolve(v)}};
      state.hls.once(Hls.Events.MANIFEST_PARSED,async()=>done(await start()));
      state.hls.once(Hls.Events.ERROR,(event,data)=>{
        if(data?.fatal)done(false);
      });
      setTimeout(()=>done(false),PLAY_TIMEOUT);
    });
  }

  toast("This browser does not support HLS playback.");
  return false;
}

async function probeLiveSource(c){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),1800);
  try{
    const r=await fetch(c.stream,{method:"GET",cache:"no-store",signal:controller.signal,headers:{Range:"bytes=0-2047"}});
    return r.ok||r.status===206;
  }catch{return false}
  finally{clearTimeout(timer)}
}

async function autoPlayFirstChannel(){
  if(autoPlayStarted || !activeAccess())return;
  const candidates=(state.filtered.length?state.filtered:state.channels).filter(c=>c.stream).slice(0,10);
  if(!candidates.length)return;
  autoPlayStarted=true;

  // Probe several sources concurrently. This avoids waiting on a dead stream.
  const checks=await Promise.all(candidates.map(async c=>({c,ok:await probeLiveSource(c)})));
  const live=checks.filter(x=>x.ok).map(x=>x.c);
  if(!live.length){autoPlayStarted=false;toast("Live source list loaded. No playable public stream responded.");return}

  // Only attach one source to the video at a time; try the fastest responding candidates.
  for(const c of live.slice(0,4)){
    if(await play(c,{auto:true})){
      toast(`▶ LIVE: ${c.name}`);
      return;
    }
  }
  autoPlayStarted=false;
  toast("Live sources loaded, but browser playback was blocked by the source.");
}

// If a catalog arrives after the page has rendered, start live playback immediately.
function triggerLivePlayback(){
  if(!autoPlayStarted && state.channels.some(c=>c.stream)){
    queueMicrotask(()=>autoPlayFirstChannel());
  }
}

function clearPlayer(){
  if(state.hls){state.hls.destroy();state.hls=null}
  $("video").pause();$("video").removeAttribute("src");$("video").load();
  $("playerEmpty").style.display="grid";$("nowTitle").textContent="Select a channel";
  $("nowMeta").textContent="No channel selected";state.current=null;
}
document.addEventListener("click",e=>{
  const fav=e.target.closest("[data-fav]");
  if(fav){e.stopPropagation();const id=fav.dataset.fav;state.favorites.has(id)?state.favorites.delete(id):state.favorites.add(id);saveFav();render();return}
  const cardEl=e.target.closest(".channel");
  if(cardEl){const c=state.channels.find(x=>x.id===cardEl.dataset.id);if(c)play(c)}
  const country=e.target.closest("[data-country]");if(country){$("countryFilter").value=country.dataset.country;document.querySelectorAll(".side-list button").forEach(x=>x.classList.remove("active"));country.classList.add("active");applyFilters();closeSidebar()}
  const cat=e.target.closest("[data-category]");if(cat){$("categoryFilter").value=cat.dataset.category;document.querySelectorAll(".side-list button").forEach(x=>x.classList.remove("active"));cat.classList.add("active");applyFilters();closeSidebar();return}
  const nav=e.target.closest(".nav");
  if(nav){document.querySelectorAll(".nav").forEach(x=>x.classList.remove("active"));nav.classList.add("active");state.view=nav.dataset.view;applyFilters()}
});
["search","countryFilter","categoryFilter","languageFilter","qualityFilter"].forEach(id=>$(id).addEventListener(id==="search"?"input":"change",applyFilters));
$("sideSearch")?.addEventListener("input",()=>renderSidebarLists([...new Set(state.channels.map(c=>c.country).filter(Boolean))].sort(),[...new Set(state.channels.flatMap(c=>c.categories||[]).filter(Boolean))].sort()));
function closeSidebar(){document.body.classList.remove("sidebar-open")}
$("mobileMenuBtn")?.addEventListener("click",()=>document.body.classList.toggle("sidebar-open"));
$("sidebarBackdrop")?.addEventListener("click",closeSidebar);
$("loadMore").onclick=()=>{state.page++;render()};
$("reloadBtn").onclick=async()=>{localStorage.removeItem(CACHE_KEY);try{if("caches"in window)await caches.delete("btech-api-v1")}catch{}location.reload()};
$("closePlayer").onclick=clearPlayer;
$("fullscreenBtn").onclick=()=>document.documentElement.requestFullscreen?.();

saveFav();

/* BTECH 5-minute demo + paid package access */
const ACCESS_KEY="btech-access-v1";
const TRIAL_MS=5*60*1000;
const PACKAGE_SIZES=[...Array.from({length:20},(_,i)=>(i+1)*500),10068];
let accessTimer=null;
function getAccess(){try{return JSON.parse(localStorage.getItem(ACCESS_KEY)||"null")}catch{return null}}
function saveAccess(x){localStorage.setItem(ACCESS_KEY,JSON.stringify(x))}
function packageOptions(){
  const el=$("packageSize");
  el.innerHTML=PACKAGE_SIZES.map(n=>`<option value="${n}">${n.toLocaleString()} channels</option>`).join("");
  updatePaymentSummary();
}
function activeAccess(){
  const a=getAccess();
  if(!a)return false;
  if(a.type==="paid")return Date.now()<a.expiresAt;
  if(a.type==="trial")return Date.now()<a.expiresAt;
  return false;
}
function allowedChannelCount(){
  const a=getAccess();
  if(a?.type==="paid" && Date.now()<a.expiresAt)return a.channels;
  if(a?.type==="trial" && Date.now()<a.expiresAt)return 500;
  return 0;
}
function applyPackageLimit(){
  const limit=allowedChannelCount();
  if(!limit){state.filtered=[];render();return}
  // Trial and paid plans both limit what is displayed in the dashboard.
  const base=state.channels;
  if(state.filtered.length>limit)state.filtered=state.filtered.slice(0,limit);
  else if(state.filtered.length===0 && base.length)state.filtered=base.slice(0,limit);
  render();
}
const originalRender=render;
render=function(){
  const a=getAccess(),limit=allowedChannelCount();
  if(!limit){$("grid").innerHTML="";$('visibleStat').textContent="0";$('resultText').textContent="Package required";$('loadMore').hidden=true;$('empty').hidden=false;return}
  const end=Math.min(state.page*state.pageSize,limit),items=state.filtered.slice(0,end);
  $("grid").innerHTML=items.map(card).join("");
  $("visibleStat").textContent=Math.min(state.filtered.length,limit).toLocaleString();
  $("resultText").textContent=`${Math.min(state.filtered.length,limit).toLocaleString()} channels`;
  $("empty").hidden=items.length!==0;
  $("loadMore").hidden=end>=Math.min(state.filtered.length,limit)||items.length===0;
};
const originalApplyFilters=applyFilters;
applyFilters=function(){
  const q=$("search").value.trim().toLowerCase(),country=$("countryFilter").value,cat=$("categoryFilter").value,lang=$("languageFilter").value,quality=$("qualityFilter").value;
  state.filtered=state.channels.filter(c=>(!q||`${c.name} ${c.id} ${countryName(c.country)} ${(c.categories||[]).join(" ")} ${langName(c.language)}`.toLowerCase().includes(q))&&(!country||c.country===country)&&(!cat||(c.categories||[]).includes(cat))&&(!lang||c.language===lang)&&qualityOK(c.quality,quality));
  if(state.view==="favorites")state.filtered=state.filtered.filter(c=>state.favorites.has(c.id));
  const limit=allowedChannelCount(); if(limit)state.filtered=state.filtered.slice(0,limit);
  state.page=1;render();
};
function showGate(mode){
  const gate=$("accessGate"),form=$("packageForm"),timer=$("trialTimer"),actions=$("accessActions"),title=$("accessTitle"),msg=$("accessMessage");
  gate.classList.add("show");
  if(mode==="trial"){
    title.textContent="5-Minute Demo Trial";msg.textContent="Start your free demo. You can browse up to 500 channels during the 5-minute trial.";form.hidden=true;timer.hidden=false;
    actions.innerHTML='<button id="startTrialBtn" class="access-btn">Start 5-Minute Trial</button>';
    $("startTrialBtn").onclick=startTrial;
  }else{
    title.textContent="Choose Your ORBITECH-TV WORLD Package";msg.textContent="Select 500 to 10,068 channels, choose 7 or 30 days, then select a demo payment gateway. Payment will continue to the selected-package confirmation screen.";form.hidden=false;timer.hidden=true;
    actions.innerHTML='<button id="proceedPaymentBtn" class="access-btn">Proceed to Demo Payment</button>';
    $("proceedPaymentBtn").onclick=proceedPayment;
    packageOptions();
  }
}
function hideGate(){ $("accessGate").classList.remove("show") }
function startTrial(){
  const a={type:"trial",startedAt:Date.now(),expiresAt:Date.now()+TRIAL_MS,channels:500};saveAccess(a);hideGate();startAccessClock();applyFilters();toast("5-minute ORBITECH-TV WORLD demo trial started.");
}
function updatePaymentSummary(){
  const p=$("paymentSummary"),size=$("packageSize"),duration=$("duration"),gateway=$("gateway");
  if(!p||!size||!duration||!gateway)return;
  p.innerHTML=`<strong>Selected Package:</strong> ${Number(size.value||500).toLocaleString()} Channels &nbsp;•&nbsp; <strong>Period:</strong> ${duration.value} Days &nbsp;•&nbsp; <strong>Gateway:</strong> ${gateway.options[gateway.selectedIndex].text}`;
}
function proceedPayment(){
  const channels=Number($("packageSize").value),gateway=$("gateway").value,duration=Number($("duration").value);
  const gatewayName=$("gateway").options[$("gateway").selectedIndex].text.replace(/\s+—\s+Demo/i,"");
  const confirmed=confirm(`ORBITECH-TV WORLD DEMO PAYMENT\n\nPackage: ${channels.toLocaleString()} Channels\nPeriod: ${duration} Days\nGateway: ${gatewayName}\n\nContinue to the demo payment confirmation?`);
  if(!confirmed)return;
  const now=Date.now(),a={type:"paid",channels,gateway,gatewayName,durationDays:duration,startedAt:now,expiresAt:now+duration*24*60*60*1000};
  saveAccess(a);localStorage.setItem("orbit-user-package",String(channels));localStorage.setItem("orbit-user-duration",String(duration));localStorage.setItem("orbit-user-gateway",gatewayName);
  hideGate();startAccessClock();applyFilters();toast(`${channels.toLocaleString()} channels selected • ${duration} days • ${gatewayName} Demo`);
}
["packageSize","duration","gateway"].forEach(id=>{const el=$(id);if(el)el.addEventListener("change",updatePaymentSummary);});
function startAccessClock(){
  clearInterval(accessTimer);const tick=()=>{
    const a=getAccess();if(!a)return;
    const remaining=Math.max(0,a.expiresAt-Date.now());
    if(a.type==="trial"){
      const sec=Math.ceil(remaining/1000),m=String(Math.floor(sec/60)).padStart(2,"0"),s=String(sec%60).padStart(2,"0");
      $("planStatus").textContent=`TRIAL ${m}:${s}`;
      if(remaining<=0){clearInterval(accessTimer);localStorage.removeItem(ACCESS_KEY);$("planStatus").textContent="PACKAGE REQUIRED";showGate("package");applyFilters();toast("Demo trial ended. Select a package to continue.");}
    }else{
      const days=Math.ceil(remaining/86400000);$("planStatus").textContent=`${a.channels.toLocaleString()} CH • ${days}D LEFT`;
      if(remaining<=0){clearInterval(accessTimer);localStorage.removeItem(ACCESS_KEY);$("planStatus").textContent="PACKAGE EXPIRED";showGate("package");applyFilters();}
    }
  };tick();accessTimer=setInterval(tick,1000);
}
function initAccess(){
  const params=new URLSearchParams(location.search);
  const selectedPackage=Number(params.get("package"));
  const selectedDays=Number(params.get("days"));
  const selectedGateway=params.get("gateway");
  if(selectedPackage>=500 && selectedPackage<=10068){
    showGate("package");
    if($("packageSize"))$("packageSize").value=String(PACKAGE_SIZES.includes(selectedPackage)?selectedPackage:10068);
    if($("duration"))$("duration").value=(selectedDays===7||selectedDays===30)?String(selectedDays):"30";
    if($("gateway") && selectedGateway){const opt=[...$("gateway").options].find(o=>o.text.startsWith(selectedGateway));if(opt)$("gateway").value=opt.value;}
    updatePaymentSummary();
    return true;
  }
  const a=getAccess();
  if(a && activeAccess()){
    startAccessClock();
    applyFilters();
    triggerLivePlayback();
    return true;
  }

  // Automatically start the built-in demo on a fresh visit so the channel
  // catalog can load and play without requiring an extra button click.
  const trial={type:"trial",startedAt:Date.now(),expiresAt:Date.now()+TRIAL_MS,channels:500};
  saveAccess(trial);
  startAccessClock();
  applyFilters();
  triggerLivePlayback();
  toast("5-minute ORBITECH-TV WORLD demo started automatically.");
  return true;
}

// Re-run access after catalog is available.
const _loadCatalog=loadCatalog;
loadCatalog=async function(){await _loadCatalog();initAccess()};

loadCatalog();
