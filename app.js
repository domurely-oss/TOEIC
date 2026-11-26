const $=id=>document.getElementById(id),key='toeic_lessons_v1';let tracks=[];try{tracks=JSON.parse(localStorage.getItem(key))||[]}catch{}let currentId=null,A=null,B=null,transcriptIndex=new Map(),transcriptRequest=0,objectUrls=[],accessToken='',tokenClient=null,cloudBlobUrl=null,cloudLoading=false;const configKey='toeic_drive_config_v1';let cfg={};try{cfg=JSON.parse(localStorage.getItem(configKey))||{}}catch{};let categoryCloudDirty=false,categoryCloudVersion='',categoryCloudFileId='',categoryCloudLoading=false;const categoryKey='toeic_custom_categories_v1';let categories=[];try{const stored=JSON.parse(localStorage.getItem(categoryKey));if(Array.isArray(stored))categories=stored.filter(c=>typeof c==='string'&&c.trim()).map(c=>c.trim()).filter((c,i,a)=>a.indexOf(c)===i)}catch{};
const selectedTrackIds=new Set();
let batchMode=false;
function setBatchMode(enabled){
 batchMode=!!enabled;
 document.body.classList.toggle('batch-mode',batchMode);
 const toggle=$('toggleBatchMode');
 toggle.textContent=batchMode?'✓ 完成多選':'☑ 多選分類';
 toggle.setAttribute('aria-pressed',String(batchMode));
 if(!batchMode)selectedTrackIds.clear();
 render();
}
$('toggleBatchMode').onclick=()=>setBatchMode(!batchMode);
function refreshBatchCategoryOptions(){
 const picker=$('batchCategory'),previous=picker.value;
 picker.replaceChildren(new Option('選擇要歸入的分類',''),new Option('📂 未分類','__uncategorized__'));
 for(const name of categories)picker.add(new Option(name,'category:'+name));
 picker.value=(previous==='__uncategorized__'||(previous.startsWith('category:')&&categories.includes(previous.slice(9))))?previous:'';
}
function updateBatchControls(){
 const shown=visibleTracks(),selected=shown.filter(t=>selectedTrackIds.has(t.id)).length;
 const all=$('selectAllVisible');all.checked=shown.length>0&&selected===shown.length;
 all.indeterminate=selected>0&&selected<shown.length;
 $('batchSelectedCount').textContent='已選 '+selectedTrackIds.size+' 筆'+(selectedTrackIds.size!==selected?'（本頁 '+selected+' 筆）':'');
 $('applyBatchCategory').disabled=!selectedTrackIds.size||!$('batchCategory').value;
 $('clearBatchSelection').disabled=!selectedTrackIds.size;
}
$('selectAllVisible').onchange=e=>{
 for(const t of visibleTracks())if(e.target.checked)selectedTrackIds.add(t.id);else selectedTrackIds.delete(t.id);
 render();
};
$('clearBatchSelection').onclick=()=>{selectedTrackIds.clear();render()};
$('batchCategory').onchange=updateBatchControls;
$('applyBatchCategory').onclick=()=>{
 const val=$('batchCategory').value;
 const category=val==='__uncategorized__'?'':val.startsWith('category:')?val.slice(9):null;
 if(category===null||(category!==''&&!categories.includes(category)))return alert('請先選擇有效的分類。');
 const chosen=tracks.filter(t=>selectedTrackIds.has(t.id));
 if(!chosen.length)return;
 const changed=chosen.filter(t=>(t.category||'')!==category);
 if(!changed.length){$('batchHint').textContent='所選教材已屬於該分類，未進行變更。';return}
 for(const t of changed)t.category=category;
 categoryCloudDirty=true;
 updateCategoryCloudStatus('已批次修改 '+changed.length+' 筆教材分類，尚未儲存到 Google Drive。');
 save();selectedTrackIds.clear();refreshCategoryUI();setBatchMode(false);
 $('batchHint').textContent='✅ 已更新 '+changed.length+' 筆教材為「'+(category||'未分類')+'」。如需跨裝置共用，請按「儲存分類至 Drive」。';
};
function saveCategories(){categoryCloudDirty=true;updateCategoryCloudStatus('分類已修改，尚未儲存到 Google Drive。');try{localStorage.setItem(categoryKey,JSON.stringify(categories))}catch(e){alert('分類未能儲存，請檢查瀏覽器儲存空間。')}}
function categoryVisible(t){const chosen=$('categoryFilter').value;return chosen==='all'||(chosen==='uncategorized'?!t.category:t.category===chosen.slice(9))}
function visibleTracks(){const part=$('filter').value,q=$('search').value.trim().toLowerCase();return tracks.filter(t=>categoryVisible(t)&&(part==='all'||(t.part||'').startsWith(part))&&(t.title||'').toLowerCase().includes(q))}
function refreshCategoryUI(){const filter=$('categoryFilter'),previous=filter.value;filter.replaceChildren(new Option('所有分類','all'),new Option('未分類','uncategorized'));categories.forEach(c=>filter.add(new Option(c,'category:'+c)));if(previous.startsWith('category:')&&categories.includes(previous.slice(9)))filter.value=previous;else if(previous==='uncategorized')filter.value=previous;else filter.value='all';refreshBatchCategoryOptions();const mgr=$('categoryManagerList');mgr.replaceChildren();if(!categories.length){let p=document.createElement('p');p.className='muted';p.textContent='尚未建立自訂分類。';mgr.append(p)}for(const c of categories){const line=document.createElement('div');line.className='category-item';const label=document.createElement('span');label.textContent=c+'（'+tracks.filter(t=>t.category===c).length+'）';const rename=document.createElement('button');rename.className='secondary';rename.textContent='重新命名';rename.onclick=()=>{const name=prompt('請輸入新的分類名稱：',c);if(name===null)return;const next=name.trim();if(!next||next.length>40){alert('分類名稱須為 1～40 個字。');return}if(next!==c&&categories.includes(next)){alert('分類已存在。');return}const wasSelected=filter.value==='category:'+c;categories[categories.indexOf(c)]=next;tracks.forEach(t=>{if(t.category===c)t.category=next});saveCategories();save();refreshCategoryUI();if(wasSelected)filter.value='category:'+next;render()};const del=document.createElement('button');del.className='danger';del.textContent='刪除';del.onclick=()=>{if(!confirm('刪除分類「'+c+'」？其教材將移至「未分類」，教材本身不會刪除。'))return;categories=categories.filter(x=>x!==c);tracks.forEach(t=>{if(t.category===c)t.category='' });saveCategories();save();refreshCategoryUI();render()};line.append(label,rename,del);mgr.append(line)}}
$('createCategory').onclick=()=>{const box=$('newCategoryName'),name=box.value.trim();if(!name||name.length>40){alert('請輸入 1～40 個字的分類名稱。');return}if(categories.includes(name)){alert('此分類已存在。');return}categories.push(name);saveCategories();box.value='';refreshCategoryUI();$('categoryFilter').value='category:'+name;render()};$('newCategoryName').addEventListener('keydown',e=>{if(e.key==='Enter'){$('createCategory').click()}});$('categoryFilter').onchange=render;
function assignTrackCategory(t){const choices=['0. 未分類',...categories.map((name,i)=>(i+1)+'. '+name)];if(!categories.length){alert('請先使用「管理我的分類」新增分類。');return}const current=categories.indexOf(t.category);const answer=prompt('請輸入分類編號：\n'+choices.join('\n'),String(current+1));if(answer===null)return;const n=Number(answer.trim());if(!Number.isInteger(n)||n<0||n>categories.length){alert('請輸入正確的分類編號。');return}t.category=n===0?'':categories[n-1];categoryCloudDirty=true;updateCategoryCloudStatus('教材歸類已修改，尚未儲存到 Google Drive。');save();render()}
refreshCategoryUI();
const audio=$('audio');function save(){localStorage.setItem(key,JSON.stringify(tracks.filter(t=>t.type!=='local')))}function fmt(s){if(!Number.isFinite(s))return '00:00';return Math.floor(s/60).toString().padStart(2,'0')+':'+Math.floor(s%60).toString().padStart(2,'0')}function get(){return tracks.find(t=>t.id===currentId)}function extract(url){try{let u=new URL(url),h=u.hostname.toLowerCase();if(h!=='drive.google.com'&&h!=='docs.google.com')return null;let m=u.pathname.match(/\/file\/d\/([\w-]+)/);let id=m?.[1]||u.searchParams.get('id');return id&&/^[\w-]+$/.test(id)?id:null}catch{return null}}function render(){for(const id of [...selectedTrackIds])if(!tracks.some(t=>t.id===id))selectedTrackIds.delete(id);const shown=visibleTracks();$('list').replaceChildren();for(const t of shown){const el=document.createElement('div');el.className='track'+(t.id===currentId?' active':'')+(selectedTrackIds.has(t.id)?' batch-selected':'');const head=document.createElement('div');head.className='track-head';const checkLabel=document.createElement('label');checkLabel.className='track-check';checkLabel.title='勾選 '+t.title;checkLabel.onclick=e=>e.stopPropagation();const check=document.createElement('input');check.type='checkbox';check.checked=selectedTrackIds.has(t.id);check.setAttribute('aria-label','批次選取 '+t.title);check.onchange=e=>{e.stopPropagation();if(check.checked)selectedTrackIds.add(t.id);else selectedTrackIds.delete(t.id);el.classList.toggle('batch-selected',check.checked);updateBatchControls()};checkLabel.append(check);const n=document.createElement('div');n.className='name';n.textContent=(t.done?'✅ ':'🎧 ')+t.title;const assign=document.createElement('button');assign.type='button';assign.className='assign-category';assign.textContent='📁 分類';assign.setAttribute('aria-label','設定 '+t.title+' 的分類');assign.onclick=e=>{e.stopPropagation();assignTrackCategory(t)};if(batchMode)head.append(checkLabel);head.append(n,assign);el.append(head);if(t.category){const tag=document.createElement('span');tag.className='track-category';tag.textContent=t.category;el.append(tag)}const sm=document.createElement('small');sm.textContent=(t.part||'')+' · '+(t.type==='cloud'?'Drive API':t.type==='drive'?'Drive 分享':'本機');el.append(sm);el.setAttribute('role','button');el.tabIndex=0;el.onclick=()=>select(t.id,true);el.onkeydown=e=>{if(e.target!==el)return;if(e.key==='Enter'||e.key===' '){e.preventDefault();select(t.id,true)}};$('list').append(el)}updateBatchControls();$('count').textContent=tracks.length;$('done').textContent=tracks.filter(t=>t.done).length;if(!shown.length)$('list').textContent='尚無符合的教材';let t=get();$('now').textContent=t?t.title:'請先選擇聽力教材';$('complete').disabled=!t;$('remove').disabled=!t;$('notes').disabled=!t;$('englishText').disabled=!t;$('chineseText').disabled=!t;$('reloadTranscript').disabled=!t;$('saveTranscriptDrive').disabled=!t||t.type!=='cloud';$('complete').textContent=t?.done?'取消完成標記':'✓ 標記完成'}function select(id,fromList=false){++transcriptRequest;let old=get();if(old){old.notes=$('notes').value;old.englishText=$('englishText').value;old.chineseText=$('chineseText').value}save();audio.pause();audio.removeAttribute('src');audio.load();if(cloudBlobUrl){URL.revokeObjectURL(cloudBlobUrl);cloudBlobUrl=null}$('frame').src='about:blank';currentId=id;A=B=null;abLabel();let t=get();if(!t){audio.removeAttribute('src');$('notes').value='';$('englishText').value='';$('chineseText').value='';$('transcriptStatus').textContent='請先選擇教材';$('drivePlayer').classList.add('hidden');$('localPlayer').classList.remove('hidden');render();return}$('notes').value=t.notes||'';$('englishText').value=t.englishText||'';$('chineseText').value=t.chineseText||'';$('transcriptStatus').textContent=t.type==='cloud'?'正在檢查對應逐字稿…':'可匯入 TXT、SRT、VTT 逐字稿，或自行輸入。';void loadTranscript(t);let drive=t.type==='drive';$('localPlayer').classList.toggle('hidden',drive);$('drivePlayer').classList.toggle('hidden',!drive);if(t.type==='cloud'){audio.removeAttribute('src');$('current').textContent='00:00';$('duration').textContent='00:00';$('play').textContent='▶ 載入並播放';}else if(drive){$('frame').src='https://drive.google.com/file/d/'+t.fileId+'/preview';$('openDrive').href='https://drive.google.com/file/d/'+t.fileId+'/view'}else{audio.src=t.src;audio.load()}render();if(fromList&&t){if(window.matchMedia('(max-width: 850px)').matches)showView('player');if(t.type==='cloud'){if(accessToken)void loadCloudAudio(t);else status('已選擇教材。請在右上角「Google Drive」按「Google 連線／快速續用」取得播放權限。',true)}else if(t.type==='local'){audio.play().catch(()=>{$('play').textContent='▶ 播放'})}}}function abLabel(){$('ab').textContent='A: '+(A===null?'—':fmt(A))+' / B: '+(B===null?'—':fmt(B))}function shift(n,playAfter=false){let i=tracks.findIndex(t=>t.id===currentId);if(i<0||!tracks.length)return;let target=tracks[(i+n+tracks.length)%tracks.length];select(target.id,playAfter)}
let repeatOneOn=false;try{repeatOneOn=localStorage.getItem('toeic_repeat_one_v1')==='true'}catch{}
function paintRepeatOne(){$('repeatOne').textContent='🔂 單曲重複：'+(repeatOneOn?'開啟':'關閉');$('repeatOne').setAttribute('aria-pressed',String(repeatOneOn));audio.loop=repeatOneOn;if(repeatOneOn&&autoNextOn){autoNextOn=false;try{localStorage.setItem('toeic_auto_next_v1','false')}catch{}paintAutoNext()}}
$('repeatOne').onclick=()=>{repeatOneOn=!repeatOneOn;try{localStorage.setItem('toeic_repeat_one_v1',String(repeatOneOn))}catch{}paintRepeatOne()};
let autoNextOn=false;try{autoNextOn=localStorage.getItem('toeic_auto_next_v1')==='true'}catch{}
function paintAutoNext(){$('autoNext').textContent='▶ 自動播放下一首：'+(autoNextOn?'開啟':'關閉');$('autoNext').setAttribute('aria-pressed',String(autoNextOn))}
$('autoNext').onclick=()=>{autoNextOn=!autoNextOn;if(autoNextOn&&repeatOneOn){repeatOneOn=false;try{localStorage.setItem('toeic_repeat_one_v1','false')}catch{}paintRepeatOne()}try{localStorage.setItem('toeic_auto_next_v1',String(autoNextOn))}catch{}paintAutoNext()};paintAutoNext();paintRepeatOne();
function autoAdvance(){if(repeatOneOn){audio.currentTime=0;audio.play().catch(()=>{});return}if(!autoNextOn)return;let visible=visibleTracks();let i=visible.findIndex(t=>t.id===currentId);if(i<0||i===visible.length-1)return;let next=visible[i+1];if(next.type==='drive'){select(next.id,true);$('autoNextHelp').textContent='Google Drive 分享預覽無法偵測播放結束，後續請使用 Drive API 音檔。'}else select(next.id,true)}$('add').onclick=()=>{let id=extract($('url').value.trim());if(!id){alert('請輸入有效的 Google Drive 檔案分享連結');return}let t={id:crypto.randomUUID(),type:'drive',fileId:id,title:$('title').value.trim()||'未命名教材',part:$('part').value,category:($('categoryFilter').value.startsWith('category:')?$('categoryFilter').value.slice(9):''),notes:'',done:false};tracks.push(t);save();$('url').value='';$('title').value='';select(t.id)};$('files').onchange=e=>{let files=[...e.target.files];for(let f of files){if(!f.type.startsWith('audio/')&&!/\.(mp3|m4a|wav|ogg)$/i.test(f.name))continue;let src=URL.createObjectURL(f);objectUrls.push(src);tracks.push({id:crypto.randomUUID(),type:'local',src,title:f.name,part:$('part').value,category:($('categoryFilter').value.startsWith('category:')?$('categoryFilter').value.slice(9):''),notes:'',done:false})}if(files.length)select(tracks[tracks.length-1].id);e.target.value=''};$('filter').onchange=render;$('search').oninput=render;$('sortName').onclick=()=>{tracks.sort((a,b)=>a.title.localeCompare(b.title,'zh-Hant',{numeric:true}));save();render()};$('play').onclick=async()=>{let t=get();if(!t)return;if(t.type==='cloud'&&!audio.src){await loadCloudAudio(t);return}if(audio.paused)audio.play().catch(()=>alert('音檔無法播放，請檢查格式'));else audio.pause()};audio.onplay=()=>{$('play').textContent='Ⅱ 暫停'};audio.onpause=()=>{$('play').textContent='▶ 播放'};audio.ontimeupdate=()=>{if(A!==null&&B!==null&&audio.currentTime>=B)audio.currentTime=A;$('current').textContent=fmt(audio.currentTime);$('seek').value=audio.duration?Math.round(audio.currentTime/audio.duration*1000):0};audio.onloadedmetadata=()=>{$('duration').textContent=fmt(audio.duration)};audio.onended=autoAdvance;$('seek').oninput=()=>{if(audio.duration)audio.currentTime=audio.duration*Number($('seek').value)/1000};$('speed').onchange=()=>audio.playbackRate=Number($('speed').value);$('back').onclick=()=>audio.currentTime=Math.max(0,audio.currentTime-5);$('forward').onclick=()=>audio.currentTime=Math.min(audio.duration||Infinity,audio.currentTime+5);$('prev').onclick=()=>shift(-1,true);$('next').onclick=()=>shift(1,true);$('markA').onclick=()=>{A=audio.currentTime;if(B!==null&&B<=A)B=null;abLabel()};$('markB').onclick=()=>{if(A===null){alert('請先設定 A 點');return}if(audio.currentTime<=A){alert('B 點必須晚於 A 點');return}B=audio.currentTime;abLabel()};$('clearAB').onclick=()=>{A=B=null;abLabel()};$('complete').onclick=()=>{let t=get();if(!t)return;t.done=!t.done;save();render()};$('remove').onclick=()=>{let t=get();if(!t||!confirm('確定刪除此教材？'))return;if(t.type==='local')URL.revokeObjectURL(t.src);tracks=tracks.filter(x=>x.id!==t.id);save();refreshCategoryUI();select(tracks[0]?.id||null)};$('notes').oninput=()=>{let t=get();if(t){t.notes=$('notes').value;save()}};for(let field of ['englishText','chineseText'])$(field).oninput=()=>{let t=get();if(t){t[field]=$(field).value;save()}};
function status(message,error=false){$('driveInfo').textContent=message;$('driveInfo').className='status '+(error?'err':'ok')}
function folderFrom(s){s=s.trim();let m=s.match(/\/folders\/([a-zA-Z0-9_-]+)/);return m?m[1]:/^[a-zA-Z0-9_-]{10,}$/.test(s)?s:null}
function saveConfig(){/* 連線值固定於網站設定，不保存舊版瀏覽器輸入值 */}
const DEFAULT_CLIENT_ID='747657718638-ppbqcu783ccpvln2jnau2ltkrrjpkmhm.apps.googleusercontent.com';
const DEFAULT_FOLDER_ID='1T7ukANBenmR298EYb2gFcpv1SAWtrMev';
$('clientId').value=DEFAULT_CLIENT_ID;$('folderId').value=DEFAULT_FOLDER_ID;

function googleReady(){if(location.protocol==='file:')throw Error('請透過 GitHub Pages HTTPS 網址，或使用 http://localhost:8765 開啟網站；不能直接以 file:// 開啟 HTML 使用 Google 登入。');if(!window.google?.accounts?.oauth2)throw Error('Google 登入元件尚未載入，請確認網路可連線至 accounts.google.com。');let cid=$('clientId').value.trim();if(!/^[^\s]+\.apps\.googleusercontent\.com$/.test(cid))throw Error('請輸入有效的 OAuth 用戶端 ID');return cid}
// Google Identity Services: no refresh token or long-lived credential stored in localStorage.
// A short-lived access token may survive a reload within this tab via sessionStorage.
const SESSION_AUTH_KEY='toeic_drive_session_auth_v3', AUTH_PREFERENCE_KEY='toeic_drive_authorized_once_v2';
const DRIVE_WRITE_SCOPE='https://www.googleapis.com/auth/drive';
const DRIVE_SCOPES=DRIVE_WRITE_SCOPE;
let tokenExpiresAt=0, authBusy=false,grantedScopes='';
function restoreSessionAuth(){
 try{const data=JSON.parse(sessionStorage.getItem(SESSION_AUTH_KEY)||'null');
  if(data?.token && Number(data.expiresAt)>Date.now()+60000){accessToken=data.token;tokenExpiresAt=data.expiresAt;grantedScopes=data.scope||'';return true}
  sessionStorage.removeItem(SESSION_AUTH_KEY);
 }catch{}return false;
}
function clearSessionAuth(){accessToken='';tokenExpiresAt=0;grantedScopes='';try{sessionStorage.removeItem(SESSION_AUTH_KEY)}catch{}}
function setSessionAuth(response){
 accessToken=response.access_token;
 tokenExpiresAt=Date.now()+Math.max(60,Number(response.expires_in)||3600)*1000;
 grantedScopes=response.scope||'';
 try{sessionStorage.setItem(SESSION_AUTH_KEY,JSON.stringify({token:accessToken,expiresAt:tokenExpiresAt,scope:grantedScopes}));localStorage.setItem(AUTH_PREFERENCE_KEY,'true')}catch{}
}
function initGoogleTokenClient(){
 if(tokenClient)return tokenClient;
 let cid=googleReady();
 tokenClient=google.accounts.oauth2.initTokenClient({
  client_id:cid,scope:DRIVE_SCOPES,include_granted_scopes:true,
  callback:async response=>{
   authBusy=false;$('connect').disabled=false;$('reauthorize').disabled=false;
   if(response.error||!response.access_token){
    status('Google 無法自動取得授權：'+(response.error||'未取得權杖')+'。可按「重新授權」由 Google 確認帳號。',true);return;
   }
   setSessionAuth(response);status('Google 授權成功，正在同步教材…');await syncDrive();
  },
  error_callback:error=>{
   authBusy=false;$('connect').disabled=false;$('reauthorize').disabled=false;
   status('Google 登入視窗無法開啟或已關閉（'+(error?.type||'未知原因')+'）。請允許瀏覽器彈出視窗，再按「Google 連線／快速續用」。',true);
  }
 });return tokenClient;
}
function requestGoogleToken(forceConsent=false){
 try{
  if(authBusy)return;
  if(!forceConsent&&accessToken&&tokenExpiresAt>Date.now()+60000){void syncDrive();return}
  const client=initGoogleTokenClient();authBusy=true;
  $('connect').disabled=true;$('reauthorize').disabled=true;
  status(forceConsent?'正在開啟 Google 帳號重新授權…':'正在嘗試沿用已授權的 Google 帳號…');
  // Empty prompt avoids repeated consent; Google can still require account interaction.
  client.requestAccessToken({prompt:forceConsent?'consent':''});
 }catch(e){authBusy=false;$('connect').disabled=false;$('reauthorize').disabled=false;status(e.message,true)}
}
$('connect').onclick=()=>requestGoogleToken(false);
$('reauthorize').onclick=()=>requestGoogleToken(true);
restoreSessionAuth();
if(accessToken)status('已恢復此分頁的 Google 授權，可播放及同步教材。');
else if(tracks.some(t=>t.type==='cloud'))status('已載入本機保存的教材清單與筆記。使用 Google Drive 音檔時，請按「Google 連線／快速續用」。');

async function driveFetch(url){if(!accessToken||tokenExpiresAt&&Date.now()>=tokenExpiresAt-30000){clearSessionAuth();throw Error('Google 存取權杖已到期，請按「Google 連線／快速續用」續用授權。')}let res=await fetch(url,{headers:{Authorization:'Bearer '+accessToken}});if(!res.ok){let reason='';try{let j=await res.json();reason=j.error?.message||''}catch{}if(res.status===401)clearSessionAuth();throw Error('Google Drive API HTTP '+res.status+' '+reason+(res.status===401?'（請重新登入授權）':''))}return res}
async function listFolderFiles(fid){let files=[],page='';do{let qs=new URLSearchParams({q:"'"+fid+"' in parents and trashed = false",fields:'nextPageToken,files(id,name,mimeType,size,description)',supportsAllDrives:'true',includeItemsFromAllDrives:'true',pageSize:'1000',orderBy:'name'});if(page)qs.set('pageToken',page);let data=await(await driveFetch('https://www.googleapis.com/drive/v3/files?'+qs)).json();files.push(...(data.files||[]));page=data.nextPageToken||''}while(page);return files}
function transcriptIdentity(name){let m=name.match(/^(.*?)(?:[._ -](en|eng|english|zh|zh-tw|cn|cht|chinese|中文|英文))?\.(txt|srt|vtt)$/i);if(!m)return null;let lang=(m[2]||'en').toLowerCase();return {base:m[1].trim().toLowerCase(),lang:/^(zh|zh-tw|cn|cht|chinese|中文)$/.test(lang)?'zh':'en'}}
function audioIdentity(name){return name.replace(/\.(mp3|m4a|wav|ogg|mp4)$/i,'').trim().toLowerCase()}
function indexTranscripts(files){transcriptIndex=new Map();for(const f of files){let key=transcriptIdentity(f.name);if(!key)continue;let rec=transcriptIndex.get(key.base)||{};rec[key.lang]=f;transcriptIndex.set(key.base,rec)}}
function stripSubtitle(text,filename=''){
 const raw=String(text).replace(/^\uFEFF/,'');
 // Plain text is content, not subtitle metadata. Preserve every line and space.
 if(!/\.(srt|vtt)$/i.test(filename))return raw;
 const lines=raw.replace(/\r\n?/g,'\n').split('\n');
 const timing=/^\s*(?:\d{2,}:)?\d{2}:\d{2}[.,]\d{3}\s*-->\s*(?:\d{2,}:)?\d{2}:\d{2}[.,]\d{3}(?:\s.*)?$/;
 const vtt=/\.vtt$/i.test(filename),blocks=lines.join('\n').split(/\n[ \t]*\n/),output=[];
 for(const block of blocks){
  const part=block.split('\n');
  if(vtt&&/^(?:WEBVTT(?:\s|$)|NOTE(?:\s|$)|STYLE\s*$|REGION\s*$)/.test(part[0]))continue;
  const at=part.findIndex(line=>timing.test(line));
  if(at>=0&&at<=1)output.push(part.slice(at+1).join('\n'));
  else if(block.trim())output.push(block); // Keep malformed content instead of silently discarding it.
 }
 return output.join('\n\n');
}
async function readTranscript(file){let res=await driveFetch('https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(file.id)+'?alt=media');return stripSubtitle(await res.text(),file.name)}
async function loadTranscript(t,force=false){let seq=++transcriptRequest;if(t.type!=='cloud')return;if(!accessToken){$('transcriptStatus').textContent='請先 Google 登入，才能讀取雲端逐字稿。';return}let pair=transcriptIndex.get(audioIdentity(t.title));if(!pair){$('transcriptStatus').textContent='尚無對應逐字稿。可上傳同名 TXT / SRT / VTT 後重新同步，或直接編輯。';return}let pending=['en','zh'].filter(lang=>pair[lang]&&(force||!t[lang==='en'?'englishText':'chineseText']));if(!pending.length){$('transcriptStatus').textContent='已顯示已儲存的逐字稿。';return}try{const results=await Promise.all(pending.map(async lang=>({lang,value:await readTranscript(pair[lang])})));if(seq!==transcriptRequest||currentId!==t.id)return;for(let {lang,value} of results){let field=lang==='en'?'englishText':'chineseText';t[field]=value;$(field).value=value}save();$('transcriptStatus').textContent='已從 Google Drive 載入：'+pending.map(lang=>pair[lang].name).join('、')}catch(e){if(seq===transcriptRequest&&currentId===t.id)$('transcriptStatus').textContent='逐字稿讀取失敗：'+e.message}}
$('reloadTranscript').onclick=async()=>{let t=get();if(!t)return;if(t.type==='cloud'){if(!accessToken){$('transcriptStatus').textContent='請先登入 Google。';return}try{indexTranscripts(await listFolderFiles(folderFrom($('folderId').value)));await loadTranscript(t,true)}catch(e){$('transcriptStatus').textContent='重新載入失敗：'+e.message}}else $('transcriptStatus').textContent='非雲端教材：請匯入逐字稿檔。'};
$('transcriptFile').onchange=async e=>{let t=get(),file=e.target.files?.[0];if(!t||!file)return;try{let content=stripSubtitle(await file.text(),file.name);let isZh=/(?:[._ -](?:zh|zh-tw|cn|cht|chinese|中文))\.(?:txt|srt|vtt)$/i.test(file.name);let field=isZh?'chineseText':'englishText';t[field]=content;$(field).value=content;save();$('transcriptStatus').textContent='已匯入：'+file.name+(isZh?'（中文）':'（英文）')}catch(err){$('transcriptStatus').textContent='匯入失敗：'+err.message}finally{e.target.value=''}};
// Save only explicitly requested text, never upload the user's audio or notes.
function hasDriveWriteScope(){return grantedScopes.split(/\s+/).includes(DRIVE_WRITE_SCOPE)}
async function driveWrite(url,options){
 if(!accessToken||Date.now()>=tokenExpiresAt-30000){clearSessionAuth();throw Error('Google 登入已過期，請在右上角「Google Drive」按「Google 連線／快速續用」。')}
 let res=await fetch(url,{...options,headers:{...(options.headers||{}),Authorization:'Bearer '+accessToken}});
 if(!res.ok){let reason='';try{reason=(await res.json()).error?.message||''}catch{}if(res.status===401)clearSessionAuth();throw Error('Google Drive API HTTP '+res.status+(reason?'：'+reason:'')+(res.status===403?'。若同名檔案不是由此網站建立，Google 可能不允許覆寫；請先在 Drive 更名該檔案後重試。':''))}
 return res;
}
async function uploadTranscriptTxt(folderId,name,text,existing){
 const bytes=new Blob([text],{type:'text/plain;charset=UTF-8'});
 if(existing){
  // drive.file permits updating files created with this OAuth app, not arbitrary existing files.
  const res=await driveWrite('https://www.googleapis.com/upload/drive/v3/files/'+encodeURIComponent(existing.id)+'?uploadType=media&fields=id,name&supportsAllDrives=true',{method:'PATCH',headers:{'Content-Type':'text/plain; charset=UTF-8'},body:bytes});
  return await res.json();
 }
 const boundary='toeic_transcript_'+Date.now().toString(36);
 const body=new Blob([
  '--'+boundary+'\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n',
  JSON.stringify({name,mimeType:'text/plain',parents:[folderId]}),
  '\r\n--'+boundary+'\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n',
  bytes,'\r\n--'+boundary+'--\r\n'
 ],{type:'multipart/related; boundary='+boundary});
 const res=await driveWrite('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name',{method:'POST',headers:{'Content-Type':'multipart/related; boundary='+boundary},body});
 return await res.json();
}
// Shared categories are stored as a single JSON file in the configured Drive folder.
// Only cloud-backed lessons are included. Never upload tokens, notes, transcripts or audio.
const CATEGORY_CLOUD_FILENAME='TOEIC_教材分類設定.json';
function updateCategoryCloudStatus(message){const el=$('categoryCloudStatus');if(el)el.textContent=message}
function makeCategoryPayload(){
 const assignments={};
 for(const t of tracks){if(t.type==='cloud'&&t.fileId&&t.category&&categories.includes(t.category))assignments[t.fileId]=t.category}
 return {schema:'toeic-categories-v1',version:1,updatedAt:new Date().toISOString(),categories:[...categories],assignments};
}
async function getCategoryCloudFile(){
 const fid=folderFrom($('folderId').value);if(!fid)throw Error('教材資料夾設定不正確');
 const matches=(await listFolderFiles(fid)).filter(f=>f.name===CATEGORY_CLOUD_FILENAME);
 if(matches.length>1)throw Error('資料夾中有多份同名分類設定檔，請先在 Google Drive 整理後重試，避免修改錯誤檔案。');
 return {fid,file:matches[0]||null};
}
async function fetchCategoryCloudMetadata(id){
 const query=new URLSearchParams({fields:'id,name,modifiedTime,parents',supportsAllDrives:'true'});
 return await (await driveFetch('https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(id)+'?'+query)).json();
}
async function fetchCategoryCloudData(file){
 const response=await driveFetch('https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(file.id)+'?alt=media');
 const text=await response.text();if(text.length>1000000)throw Error('分類設定檔過大');
 let data;try{data=JSON.parse(text)}catch{throw Error('雲端分類設定不是有效 JSON，未修改本機資料')}
 if(data?.schema!=='toeic-categories-v1'||data.version!==1||!Array.isArray(data.categories)||!data.assignments||typeof data.assignments!=='object'||Array.isArray(data.assignments))throw Error('分類設定檔版本不相容，未修改本機資料');
 const clean=data.categories.filter(x=>typeof x==='string'&&x.trim()&&x.length<=40).map(x=>x.trim()).filter((x,i,a)=>a.indexOf(x)===i);
 if(clean.length>500||Object.keys(data.assignments).length>20000)throw Error('分類設定數量超過安全限制');
 return {categories:clean,assignments:data.assignments};
}
function sameCategoryPayload(payload){
 const ours=makeCategoryPayload();
 if(JSON.stringify(ours.categories)!==JSON.stringify(payload.categories))return false;
 for(const t of tracks.filter(t=>t.type==='cloud'&&t.fileId)){
  if((ours.assignments[t.fileId]||'')!==(typeof payload.assignments[t.fileId]==='string'?payload.assignments[t.fileId]:''))return false;
 }
 return true;
}
function applyCloudCategories(data){
 categories=[...data.categories];
 for(const t of tracks)if(t.type==='cloud'&&t.fileId){const c=data.assignments[t.fileId];t.category=typeof c==='string'&&categories.includes(c)?c:''}
 try{localStorage.setItem(categoryKey,JSON.stringify(categories))}catch{}
 save();refreshCategoryUI();render();categoryCloudDirty=false;
}
async function loadCategoriesFromDrive({automatic=false}={}){
 if(categoryCloudLoading)return false;
 if(!accessToken){updateCategoryCloudStatus('請先在右上角登入 Google Drive。');return false}
 categoryCloudLoading=true;$('loadCategoryCloud').disabled=true;
 try{
  const {file}=await getCategoryCloudFile();
  if(!file){categoryCloudFileId='';categoryCloudVersion='';updateCategoryCloudStatus('Google Drive 尚無分類設定；在這台裝置整理好後按「儲存分類至 Drive」。');return false}
  const metadata=await fetchCategoryCloudMetadata(file.id);
  const data=await fetchCategoryCloudData(file);
  const hasLocal=categories.length>0||tracks.some(t=>t.type==='cloud'&&t.category);
  if(hasLocal&&!sameCategoryPayload(data)){
   if(automatic){updateCategoryCloudStatus('雲端已有分類設定，且與本機不同。請按「讀取雲端分類」比較並確認，或先儲存本機設定。');return false}
   if(!confirm('讀取雲端分類會取代這台裝置的分類名稱與雲端教材歸類（不影響筆記、逐字稿及音檔）。確定繼續？'))return false;
  }
  applyCloudCategories(data);categoryCloudFileId=file.id;categoryCloudVersion=metadata.modifiedTime||'';
  updateCategoryCloudStatus('✅ 已從 Google Drive 讀取分類（'+new Date().toLocaleString('zh-TW')+'）。');return true;
 }catch(e){updateCategoryCloudStatus('❌ 讀取分類失敗：'+e.message);return false}
 finally{categoryCloudLoading=false;$('loadCategoryCloud').disabled=false}
}
async function saveCategoriesToDrive(){
 if(categoryCloudLoading)return;
 if(!accessToken){updateCategoryCloudStatus('請先在右上角登入 Google Drive。');return}
 if(!hasDriveWriteScope()){updateCategoryCloudStatus('缺少 Drive 寫入權限，請在右上角重新授權。');return}
 categoryCloudLoading=true;$('saveCategoryCloud').disabled=true;
 try{
  const {fid,file}=await getCategoryCloudFile();
  if(file){
   const metadata=await fetchCategoryCloudMetadata(file.id);
   const remoteVersion=metadata.modifiedTime||'';
   if((categoryCloudFileId!==file.id||categoryCloudVersion!==remoteVersion)&&!confirm('偵測到 Google Drive 分類設定與上次讀取版本不同（可能由其他裝置修改）。覆寫會取代雲端設定。建議先取消並按「讀取雲端分類」。確定仍要覆寫？'))return;
  }
  const payload=JSON.stringify(makeCategoryPayload(),null,2);
  const result=await uploadTranscriptTxt(fid,CATEGORY_CLOUD_FILENAME,payload,file);
  if(!result?.id)throw Error('上傳後未取得檔案 ID');
  const metadata=await fetchCategoryCloudMetadata(result.id);
  if(metadata.name!==CATEGORY_CLOUD_FILENAME||!metadata.parents?.includes(fid))throw Error('檔案未能確認位於教材資料夾');
  categoryCloudFileId=result.id;categoryCloudVersion=metadata.modifiedTime||'';categoryCloudDirty=false;
  updateCategoryCloudStatus('✅ 分類已存至 Google Drive，可在其他裝置登入並同步（'+new Date().toLocaleString('zh-TW')+'）。');
 }catch(e){updateCategoryCloudStatus('❌ 儲存分類失敗：'+e.message)}
 finally{categoryCloudLoading=false;$('saveCategoryCloud').disabled=false}
}
$('saveCategoryCloud').onclick=()=>void saveCategoriesToDrive();
$('loadCategoryCloud').onclick=()=>void loadCategoriesFromDrive();
let savingTranscript=false;
const AUTO_UPLOAD_KEY='toeic_auto_upload_transcript_v1';
try{$('autoUploadTranscript').checked=localStorage.getItem(AUTO_UPLOAD_KEY)==='true'}catch{}
$('autoUploadTranscript').onchange=()=>{try{localStorage.setItem(AUTO_UPLOAD_KEY,String($('autoUploadTranscript').checked))}catch{}};
async function saveTranscriptToDrive({automatic=false,target=null}={}){
 const t=target||get(),out=$('transcriptStatus');
 const report=m=>{out.textContent=m};
 if(!t||t.type!=='cloud'){if(!automatic)report('請選擇從 Google Drive 同步的音檔，無法將本機音檔儲存到指定教材資料夾。');return false}
 if(!accessToken||tokenExpiresAt&&Date.now()>=tokenExpiresAt-30000){report('尚未取得有效的 Google 授權。請在右上角「Google Drive」按「重新授權」，再返回儲存。');return false}
 if(!hasDriveWriteScope()){report('目前的 Google 登入權杖只有舊版讀取權限，無法寫入教材資料夾。請在右上角「Google Drive」按「重新授權」，同意 Drive 讀寫權限。');return false}
 if(savingTranscript){report('前一次雲端儲存仍在進行中，請完成後再試。');return false}
 const en=String(t.englishText||'').trim(),zh=String(t.chineseText||'').trim();
 if(!en&&!zh){report('英文逐字稿和中文翻譯都是空白，沒有可儲存內容。');return false}
 const folderId=folderFrom($('folderId').value);
 if(!folderId){report('教材資料夾 ID 無效，請檢查網站設定。');return false}
 const selectedId=t.id;
 savingTranscript=true;$('saveTranscriptDrive').disabled=true;
 let saved=[];
 try{
  report('正在向 Google Drive 查詢教材資料夾…');
  const files=await listFolderFiles(folderId);
  const stem=t.title.replace(/\.(mp3|m4a|wav|ogg|mp4)$/i,'');
  const jobs=[['en',en],['zh',zh]].filter(([,value])=>value).map(([lang,value])=>{
   const name=stem+'.'+lang+'.txt';return {name,value,existing:files.find(f=>f.name.toLowerCase()===name.toLowerCase())};
  });
  const existingNames=jobs.filter(j=>j.existing).map(j=>j.name);
  if(automatic&&existingNames.length){report('已有同名逐字稿：'+existingNames.join('、')+'。為避免自動覆蓋舊內容，本次僅保存在瀏覽器。請按「儲存逐字稿至 Google Drive」確認覆寫。');return false}
  if(!automatic){
   if(existingNames.length&&!confirm('Google Drive 已有同名逐字稿：\n'+existingNames.join('\n')+'\n\n是否覆寫？')){report('已取消覆寫，瀏覽器中的逐字稿仍保留。');return false}
   if(!confirm('確定將 '+jobs.map(j=>j.name).join('、')+' 儲存至 Google Drive 教材資料夾？')){report('已取消上傳。');return false}
  }
  for(const job of jobs){
   report('正在上傳 '+job.name+'…');
   let result=await uploadTranscriptTxt(folderId,job.name,job.value,job.existing);
   if(!result?.id)throw Error(job.name+' 上傳後未取得 Google Drive 檔案 ID');
   // Verify actual file metadata rather than assuming a successful upload request means success.
   const qs=new URLSearchParams({fields:'id,name,parents,webViewLink',supportsAllDrives:'true'});
   const check=await(await driveFetch('https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(result.id)+'?'+qs)).json();
   if(check.name!==job.name||!(check.parents||[]).includes(folderId))throw Error(job.name+' 已上傳，但未能確認位於指定教材資料夾。請檢查 Google Drive。');
   saved.push(job.name);
  }
  indexTranscripts(await listFolderFiles(folderId));
  t.lastDriveSaveAt=Date.now();save();
  report('✅ 已成功存入 Google Drive 教材資料夾：'+saved.join('、')+'（'+new Date().toLocaleString('zh-TW')+'）');
  return true;
 }catch(e){
  let detail=String(e?.message||e);
  if(/403|insufficientPermissions|insufficient authentication scopes/i.test(detail))detail+='。請在右上角「Google Drive」按「重新授權」，同意 Drive 讀寫權限；若使用公司帳號，可能須由管理員允許。';
  if(/404|File not found/i.test(detail))detail+='。請確認登入帳號對教材資料夾具有編輯權限。';
  report('❌ 雲端儲存失敗'+(saved.length?'（已成功：'+saved.join('、')+'）':'')+'：'+detail);
  return false;
 }finally{savingTranscript=false;$('saveTranscriptDrive').disabled=!(get()&&get().type==='cloud')}
}
$('saveTranscriptDrive').onclick=()=>{const t=get();if(t){t.englishText=$('englishText').value;t.chineseText=$('chineseText').value;save()}void saveTranscriptToDrive()};
async function syncDrive(){if(!accessToken){status('請先按「Google 連線／快速續用」，再同步資料夾。',true);return}let fid=folderFrom($('folderId').value);if(!fid){status('請填入正確的 Google Drive 資料夾 ID 或連結。',true);return}saveConfig();$('sync').disabled=true;try{let allFiles=await listFolderFiles(fid);indexTranscripts(allFiles);let files=allFiles.filter(f=>/\.(mp3|m4a|wav|ogg)$/i.test(f.name)||/^audio\//i.test(f.mimeType));let existing=new Map(tracks.filter(t=>t.type==='cloud').map(t=>[t.fileId,t]));let updated=files.map(f=>{let t=existing.get(f.id);return t?{...t,title:f.name}:{id:'cloud_'+f.id,type:'cloud',fileId:f.id,title:f.name,part:/part\s*([1-4])/i.test(f.name)?'Part '+f.name.match(/part\s*([1-4])/i)[1]+' '+['','照片描述','應答問題','簡短對話','簡短獨白'][Number(f.name.match(/part\s*([1-4])/i)[1])]:'Part 1 照片描述',notes:'',englishText:'',chineseText:'',done:false}});let keep=tracks.filter(t=>t.type!=='cloud');tracks=[...updated,...keep];save();refreshCategoryUI();if(!get()&&tracks.length)select(tracks[0].id);else {render();let t=get();if(t)void loadTranscript(t)}status('同步成功：找到 '+files.length+' 個音檔、'+allFiles.filter(f=>transcriptIdentity(f.name)).length+' 個逐字稿。同步時間 '+new Date().toLocaleString('zh-TW'));await loadCategoriesFromDrive({automatic:true})}catch(e){status('同步失敗：'+e.message,true)}finally{$('sync').disabled=false}}
$('sync').onclick=()=>{if(accessToken)void syncDrive();else requestGoogleToken(false)};
$('disconnect').onclick=()=>{if(accessToken&&window.google?.accounts?.oauth2)google.accounts.oauth2.revoke(accessToken,()=>{});clearSessionAuth();tokenClient=null;try{localStorage.removeItem(AUTH_PREFERENCE_KEY)}catch{}audio.pause();status('已登出並清除本分頁的 Google 授權。教材與筆記仍保留在此瀏覽器。')};
$('clearCloud').onclick=()=>{if(!confirm('清除本機保存的雲端教材清單及相關筆記？不會刪除 Google Drive 檔案。'))return;tracks=tracks.filter(t=>t.type!=='cloud');save();refreshCategoryUI();select(tracks[0]?.id||null);status('已清空本機雲端教材清單')};
async function loadCloudAudio(t){if(!accessToken){status('雲端音檔需要重新 Google 登入授權。',true);return}if(cloudLoading)return;cloudLoading=true;$('play').disabled=true;$('play').textContent='載入中…';let chosen=t.id;try{let response=await driveFetch('https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(t.fileId)+'?alt=media');let blob=await response.blob();if(currentId!==chosen)return;if(cloudBlobUrl)URL.revokeObjectURL(cloudBlobUrl);cloudBlobUrl=URL.createObjectURL(blob);audio.src=cloudBlobUrl;audio.playbackRate=Number($('speed').value);await audio.play()}catch(e){status('播放失敗：'+e.message,true);if(currentId===chosen)$('play').textContent='▶ 重試播放'}finally{cloudLoading=false;$('play').disabled=false;if(currentId===chosen&&audio.paused)$('play').textContent='▶ 播放'}}
if(tracks.length)select(tracks[0].id);else render();
