function showView(view){
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
