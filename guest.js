/* Isolated public viewer: never reads/writes the original app's tracks, tokens or storage. */
(()=>{'use strict';
const FOLDER='1T7ukANBenmR298EYb2gFcpv1SAWtrMev';
const byId=id=>document.getElementById(id);
const catalog=window.TOEIC_GUEST_CATALOG||{files:[],updated:'未提供'};
const texts=catalog.files.filter(f=>/\.(txt|srt|vtt)$/i.test(f.name));
const lessons=new Map();
function identity(name){const m=name.match(/^(.*?)(?:[._ -](en|eng|english|zh-tw|zh|cn|cht|chinese|中文|英文))?\.(txt|srt|vtt)$/i);return m?{base:m[1],lang:/^(zh|zh-tw|cn|cht|chinese|中文)$/i.test(m[2]||'')?'zh':'en'}:null}
function lesson(base){const key=base.toLowerCase();if(!lessons.has(key))lessons.set(key,{key,title:base});return lessons.get(key)}
for(const f of catalog.files){if(/\.(mp3|m4a|wav|ogg)$/i.test(f.name))lesson(f.name.replace(/\.[^.]+$/,'')).audio=f;else{const x=identity(f.name);if(x)lesson(x.base)[x.lang]=f}}
const all=[...lessons.values()].sort((a,b)=>a.title.localeCompare(b.title,'zh-Hant',{numeric:true}));
const section=document.createElement('section');section.id='guestSection';section.hidden=true;section.setAttribute('aria-label','免登入使用');
section.innerHTML=`<div class="panel guest-top"><div><h2>🌏 免登入使用</h2><p class="muted">選擇教材，同時閱讀英文與中文文字。內容由公開 Google Drive 檔案提供。</p></div><a href="https://drive.google.com/drive/folders/${FOLDER}" target="_blank" rel="noopener noreferrer">開啟公開資料夾 ↗</a></div>
<div class="guest-layout"><aside class="panel"><h2>公開教材</h2><label for="guestSearch">搜尋教材</label><input id="guestSearch" type="search" placeholder="輸入 Day、Sample 或檔名"><p class="muted" id="guestCount"></p><div id="guestList" class="guest-list"></div><p class="muted">快速清單更新日期：<span id="guestUpdated"></span>。新增檔案請使用下方「瀏覽最新資料夾」。</p></aside>
<div class="panel"><h2 id="guestTitle">請選擇教材</h2><p id="guestStatus" class="muted" role="status"></p>
<div id="guestAudio"></div><div class="guest-transcripts"><div><label for="guestEnSelect">英文文字檔</label><select id="guestEnSelect"></select><div id="guestEn"></div></div><div><label for="guestZhSelect">中文文字檔</label><select id="guestZhSelect"></select><div id="guestZh"></div></div></div>
<p class="muted">預覽若顯示權限不足或無法載入，請用「另開檔案」檢查共用權限。音檔使用 Drive 官方播放器，這個頁簽不提供原播放器的 A–B 循環或變速控制。</p>
<details><summary>讀取其他公開檔案連結</summary><div class="guest-link-form"><label>檔案類型<select id="guestLinkType"><option value="en">英文文字</option><option value="zh">中文文字</option><option value="audio">音檔</option></select></label><label>Google Drive 檔案分享連結<input id="guestLink" placeholder="https://drive.google.com/file/d/…/view"></label><button id="guestOpenLink" type="button">讀取</button></div><p class="muted" id="guestLinkStatus" role="status"></p></details></div></div>
<details class="panel" id="guestFolder" style="margin-top:18px"><summary>📂 瀏覽最新資料夾（含新檔案與子資料夾）</summary><p class="muted">此區直接顯示 Drive 目前清單。點選檔案會在新視窗開啟；也可複製其分享連結到上方讀取。重新整理此區不會更新上方快速配對清單。</p><button type="button" id="guestRefreshFolder" class="secondary">重新整理資料夾</button><div id="guestFolderHost"></div></details>`;
document.querySelector('main').after(section);
byId('guestUpdated').textContent=catalog.updated;
let current=null,active=false;
const containers={audio:'guestAudio',en:'guestEn',zh:'guestZh'};
function preview(kind,file){const host=byId(containers[kind]);host.replaceChildren();if(!file){const p=document.createElement('p');p.className='guest-empty';p.textContent=kind==='audio'?'此教材沒有配對音檔。':'快速清單未找到同名'+(kind==='en'?'英文':'中文')+'文字檔，可從上方選單指定或瀏覽最新資料夾。';host.append(p);return}
 const a=document.createElement('a');a.href='https://drive.google.com/file/d/'+encodeURIComponent(file.id)+'/view';a.target='_blank';a.rel='noopener noreferrer';a.textContent='另開檔案：'+file.name;
 const p=document.createElement('p');p.append(a);const frame=document.createElement('iframe');frame.title=(kind==='audio'?'音檔':kind==='en'?'英文逐字稿':'中文翻譯')+'：'+file.name;frame.className=kind==='audio'?'guest-audio-frame':'guest-text-frame';frame.src='https://drive.google.com/file/d/'+encodeURIComponent(file.id)+'/preview';frame.allow='autoplay';host.append(p,frame)
}
for(const [kind,id] of [['en','guestEnSelect'],['zh','guestZhSelect']]){const sel=byId(id);sel.add(new Option('未選擇文字檔',''));for(const f of texts)sel.add(new Option(f.name,f.id));sel.onchange=()=>{if(current)current[kind]=texts.find(f=>f.id===sel.value);preview(kind,current?.[kind])}}
function choose(item){current={...item};byId('guestTitle').textContent=item.title;for(const kind of ['audio','en','zh'])preview(kind,item[kind]);byId('guestEnSelect').value=item.en?.id||'';byId('guestZhSelect').value=item.zh?.id||'';byId('guestStatus').textContent='已選擇教材。下方由 Google Drive 直接預覽目前檔案內容。';renderList()}
function renderList(){const q=byId('guestSearch').value.trim().toLowerCase();const shown=all.filter(x=>x.title.toLowerCase().includes(q));byId('guestCount').textContent=`${shown.length} / ${all.length} 份教材`;const list=byId('guestList');list.replaceChildren();for(const item of shown){const b=document.createElement('button');b.type='button';b.className='guest-track';b.setAttribute('aria-pressed',String(current?.key===item.key));b.append(document.createTextNode(item.title));const small=document.createElement('small');small.textContent=[item.audio?'音檔':'',item.en?'英文':'',item.zh?'中文':''].filter(Boolean).join(' · ');b.append(small);b.onclick=()=>choose(item);list.append(b)}if(!shown.length)list.textContent='找不到符合的教材。'}
byId('guestSearch').oninput=renderList;
function showGuest(){active=true;document.body.classList.add('guest-mode');section.hidden=false;document.querySelectorAll('main audio').forEach(a=>a.pause());byId('goGuest').classList.add('active');byId('goGuest').setAttribute('aria-current','page');for(const id of ['goPlayer','goMaterials']){byId(id).classList.remove('active');byId(id).removeAttribute('aria-current')}if(!current&&all.length)choose(all.find(x=>x.en&&x.zh)||all[0]);else if(current)for(const k of ['audio','en','zh'])preview(k,current[k]);renderList()}
function leaveGuest(id){if(!active)return;active=false;section.hidden=true;document.body.classList.remove('guest-mode');section.querySelectorAll('iframe').forEach(f=>f.remove());byId('goGuest').classList.remove('active');byId('goGuest').removeAttribute('aria-current');byId(id).classList.add('active');byId(id).setAttribute('aria-current','page');byId('guestFolder').open=false;}
byId('goGuest').onclick=showGuest;
for(const id of ['goPlayer','goMaterials'])byId(id).addEventListener('click',()=>leaveGuest(id),true);
function folderPreview(){const host=byId('guestFolderHost');host.replaceChildren();const f=document.createElement('iframe');f.title='公開 Google Drive 最新資料夾';f.className='guest-folder-frame';f.src='https://drive.google.com/embeddedfolderview?id='+FOLDER+'#list';host.append(f)}
byId('guestFolder').ontoggle=()=>{if(byId('guestFolder').open&&!byId('guestFolderHost').querySelector('iframe'))folderPreview()};byId('guestRefreshFolder').onclick=folderPreview;
byId('guestOpenLink').onclick=()=>{try{const u=new URL(byId('guestLink').value.trim());if(u.protocol!=='https:'||u.hostname!=='drive.google.com')throw Error('請輸入 Google Drive 的 HTTPS 檔案分享連結。');const id=u.pathname.match(/^\/file\/d\/([\w-]+)/)?.[1]||u.searchParams.get('id');if(!id||!/^[-\w]{10,}$/.test(id))throw Error('找不到檔案 ID，請使用檔案連結，不能使用資料夾連結。');const kind=byId('guestLinkType').value;const file={id,name:'指定的公開檔案'};if(!current)current={key:'manual',title:'指定檔案'};current[kind]=file;preview(kind,file);if(kind!=='audio')byId(kind==='en'?'guestEnSelect':'guestZhSelect').value='';byId('guestLinkStatus').textContent='已開啟預覽。檔案須允許知道連結的任何人檢視。'}catch(e){byId('guestLinkStatus').textContent=e.message}};
if(location.hash==='#guest')showGuest();
})();
