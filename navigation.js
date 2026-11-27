function showView(view){
  for(const id of ['goPlayer','goMaterials']){const el=$(id),active=id===(view==='materials'?'goMaterials':'goPlayer');el.classList.toggle('active',active);if(active)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current')}
  // Both columns remain visible: never hide the player, transcript or lesson list.
  const target=view==='materials' ? $('materialsSection') : $('playerSection');
  if(window.matchMedia('(max-width: 850px)').matches){
    target.scrollIntoView({behavior:'smooth',block:'start'});
  }else if(view==='materials'){
    $('search').focus({preventScroll:true});
  }else{
    $('playerSection').scrollIntoView({behavior:'smooth',block:'start'});
  }
}
$('goPlayer').onclick=()=>showView('player');
$('goMaterials').onclick=()=>showView('materials');
$('chooseMaterial').onclick=()=>showView('materials');
$('backToPlayer').onclick=()=>showView('player');

(function(){
 const info=document.getElementById('driveInfo'),chip=document.getElementById('cloudState');
 if(!info||!chip)return;
 function refreshCloudChip(){
  const text=info.textContent||'';
  const connected=!!(typeof accessToken!=='undefined'&&accessToken&&(!tokenExpiresAt||Date.now()<tokenExpiresAt-30000));
  chip.textContent=connected?'已連線':(/正在|同步中|授權中/.test(text)?'處理中':'未連線');
  chip.classList.toggle('connected',connected);
  chip.title=text;
 }
 new MutationObserver(refreshCloudChip).observe(info,{childList:true,characterData:true,subtree:true});
 refreshCloudChip();
})();

// Completion progress bar (derived from #count / #done rendered by app.js).
(function(){
 const count=document.getElementById('count'),done=document.getElementById('done'),bar=document.getElementById('progressBar');
 if(!count||!done||!bar)return;
 function refresh(){const c=parseInt(count.textContent,10)||0,d=parseInt(done.textContent,10)||0;const pct=c?Math.round(d/c*100):0;bar.style.width=pct+'%';bar.parentElement.title='完成率 '+pct+'%'}
 const mo=new MutationObserver(refresh);mo.observe(count,{childList:true,characterData:true,subtree:true});mo.observe(done,{childList:true,characterData:true,subtree:true});
 refresh();
})();

// Light / dark theme toggle (preference kept per browser).
(function(){
 const btn=document.getElementById('themeToggle');if(!btn)return;
 const root=document.documentElement,KEY='toeicTheme';
 try{const saved=localStorage.getItem(KEY);if(saved==='dark'||saved==='light')root.dataset.theme=saved}catch{}
 function isDark(){return root.dataset.theme?root.dataset.theme==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches}
 function label(){btn.textContent=isDark()?'☀':'🌙';btn.setAttribute('aria-label',isDark()?'切換為淺色模式':'切換為深色模式');btn.title=btn.getAttribute('aria-label')}
 btn.onclick=()=>{const next=isDark()?'light':'dark';root.dataset.theme=next;try{localStorage.setItem(KEY,next)}catch{}label()};
 label();
})();

// Close the Google Drive dropdown when clicking outside or pressing Escape.
(function(){
 const box=document.getElementById('cloudMini');if(!box)return;
 document.addEventListener('click',e=>{if(box.open&&!box.contains(e.target))box.open=false});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&box.open){box.open=false;box.querySelector('summary').focus()}});
})();

// Keyboard shortcuts: Space = play/pause, ←/→ = -5s/+5s (ignored while typing).
document.addEventListener('keydown',e=>{
 if(e.defaultPrevented||e.ctrlKey||e.metaKey||e.altKey)return;
 const t=e.target;
 if(t&&(t.isContentEditable||/^(INPUT|TEXTAREA|SELECT|BUTTON|SUMMARY|A|IFRAME)$/.test(t.tagName)||t.closest('.track')))return;
 if($('localPlayer').classList.contains('hidden'))return;
 const map={' ':'play','ArrowLeft':'back','ArrowRight':'forward'};
 const id=map[e.key];if(!id)return;
 const b=$(id);if(!b||b.disabled)return;
 e.preventDefault();b.click();
});
