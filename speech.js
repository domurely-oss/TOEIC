// Browser-only speech-to-text: no API key or server-side secret.
// Local, browser-side EN -> ZH translation. No transcript text is sent to a translation API.
const AUTO_TRANSLATE_KEY='toeic_auto_translate_zh_v1';
try{$('autoTranslateChinese').checked=localStorage.getItem(AUTO_TRANSLATE_KEY)!=='false'}catch{$('autoTranslateChinese').checked=true}
$('autoTranslateChinese').onchange=()=>{try{localStorage.setItem(AUTO_TRANSLATE_KEY,String($('autoTranslateChinese').checked))}catch{}};
let translator=null,translationLoading=null,translationBusy=false,zhConverter=null,converterAttempted=false;
function translateNote(message){$('translateStatus').textContent=message;console.info('[TOEIC Translate]',message)}
async function loadTranslator(){
 if(translator)return translator;
 if(!translationLoading)translationLoading=(async()=>{
  translateNote('正在準備英文→中文翻譯模型，初次使用須下載模型，請保持網路連線…');
  // MarianMT/OPUS model uses the proven Transformers.js v2 translation pipeline.
  const {pipeline,env}=await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/+esm');
  env.allowLocalModels=false;
  return pipeline('translation','Xenova/opus-mt-en-zh',{progress_callback:p=>{
   if(p.status==='progress'&&Number.isFinite(p.progress))translateNote('正在下載翻譯模型：'+Math.round(p.progress)+'%');
  }});
 })().catch(err=>{translationLoading=null;throw err});
 translator=await translationLoading;
 return translator;
}
async function getTraditionalConverter(){
 if(converterAttempted)return zhConverter;
 converterAttempted=true;
 try{
  const lib=await import('https://cdn.jsdelivr.net/npm/opencc-js@1.0.5/+esm');
  const factory=lib.Converter||lib.default?.Converter;
  if(typeof factory==='function')zhConverter=factory({from:'cn',to:'tw'});
 }catch(e){console.warn('[TOEIC Translate] 繁體轉換程式載入失敗',e)}
 return zhConverter;
}
function translationChunks(source){
 // Small chunks avoid exceeding Marian's input token limit on long transcripts.
 const normalized=String(source||'').replace(/\r\n?/g,'\n').trim();
 const sentences=normalized.match(/[^.!?\n]+(?:[.!?]+|\n|$)/g)||[normalized];
 const chunks=[];let pending='';
 const push=()=>{if(pending.trim())chunks.push(pending.trim());pending=''};
 for(const sentence of sentences){
  const words=sentence.trim().split(/\s+/).filter(Boolean);
  if(!words.length)continue;
  for(let i=0;i<words.length;i+=65){
   let part=words.slice(i,i+65).join(' ');
   if(pending&&(pending+' '+part).length>350)push();
   pending+=(pending?' ':'')+part;
   if(pending.length>=300)push();
  }
 }
 push();return chunks;
}
async function translateTrack(t,{automatic=false}={}){
 if(translationBusy){translateNote('翻譯正在進行，請完成後再試。');return false}
 const english=String(t?.englishText||'').trim();
 if(!english){translateNote('沒有英文逐字稿，請先辨識或輸入英文文字。');return false}
 if(automatic&&String(t.chineseText||'').trim()){
  translateNote('已有中文翻譯，為避免覆蓋已編輯內容，本次保留原文。可按「重新翻譯成中文」更新。');
  return false;
 }
 if(!automatic&&String(t.chineseText||'').trim()&&!confirm('重新翻譯會取代這份教材原有的中文翻譯，確定繼續？'))return false;
 translationBusy=true;$('translateEnglish').disabled=true;
 const prior=$('translateEnglish').textContent;$('translateEnglish').textContent='⏳ 翻譯中…';
 try{
  const model=await loadTranslator();
  const chunks=translationChunks(english);
  if(!chunks.length)throw Error('沒有可翻譯的英文內容');
  const translated=[];
  for(let i=0;i<chunks.length;i++){
   translateNote('正在翻譯英文逐字稿：'+(i+1)+' / '+chunks.length+' 段…');
   const output=await model(chunks[i],{max_new_tokens:256});
   const value=String((Array.isArray(output)?output[0]:output)?.translation_text||'').trim();
   if(!value)throw Error('第 '+(i+1)+' 段翻譯結果為空白');
   translated.push(value);
  }
  let chinese=translated.join('\n');
  const convert=await getTraditionalConverter();
  if(convert)chinese=convert(chinese);
  t.chineseText=chinese;
  if(currentId===t.id)$('chineseText').value=chinese;
  save();
  translateNote(convert?'✅ 已完成繁體中文翻譯並儲存至瀏覽器。請核對內容。':'⚠ 中文翻譯已完成，但繁體字轉換元件載入失敗，可能包含簡體字；請檢查網路後再翻譯。');
  return true;
 }catch(e){translateNote('❌ 自動翻譯失敗：'+(e?.message||String(e))+'。英文逐字稿仍已保留，可稍後按「重新翻譯成中文」。');return false}
 finally{translationBusy=false;$('translateEnglish').disabled=false;$('translateEnglish').textContent=prior}
}
$('translateEnglish').onclick=async()=>{
 const t=get();if(!t){translateNote('請先選擇教材。');return}
 t.englishText=$('englishText').value;t.chineseText=$('chineseText').value;save();
 const translated=await translateTrack(t);
 if(translated&&t.type==='cloud'&&$('autoUploadTranscript').checked){
  $('transcriptStatus').textContent='翻譯完成，正在嘗試儲存至 Google Drive…';
  await saveTranscriptToDrive({automatic:true,target:t});
 }
};

// ASR review controls are inserted here to keep existing index.html compatible.
const asrReview=document.createElement('div');asrReview.id='asrReview';
asrReview.innerHTML=`<label for="asrModel">英文辨識模型</label><select id="asrModel"><option value="base.en">標準：Whisper Base English（預設，下載與辨識較久）</option><option value="tiny.en">快速：Whisper Tiny English</option></select><details><summary>指定時間區間重新辨識</summary><p>區間結果獨立顯示，不會直接覆蓋原稿。可先播放原音，再人工比對。</p><label>開始（分:秒）<input id="asrStart" value="00:26"></label><label>結束（分:秒）<input id="asrEnd" value="01:02"></label><button id="asrRange" type="button">辨識指定區間</button></details><details id="asrResultPanel"><summary>辨識結果／原稿備份</summary><p id="asrResultInfo"></p><label for="asrCandidate">本次辨識結果（可編輯後複製）</label><textarea id="asrCandidate" rows="8"></textarea><button id="asrDownload" type="button">下載本次辨識 TXT</button><label for="asrBackup">辨識前的原稿</label><textarea id="asrBackup" rows="5" readonly></textarea><p>備份僅保留到下一次辨識或關閉此頁；重要內容請先複製保存。辨識結果仍需對照原音核對。</p></details>`;
$('asrStatus').after(asrReview);
function asrTime(value){
 const parts=String(value).trim().split(':');
 if(!parts.length||parts.length>3||parts.some(x=>!/^\d+(?:\.\d+)?$/.test(x)))throw Error('時間請輸入秒數或分:秒，例如 00:26');
 if(parts.length>1&&parts.slice(1).some(x=>Number(x)>=60))throw Error('分:秒格式中的秒數須小於 60');
 return parts.reduce((total,n)=>total*60+Number(n),0);
}
function asrBounds(length,start,end){
 const duration=length/16000;
 if(!Number.isFinite(start)||!Number.isFinite(end)||start<0||end<=start||start>=duration||end>duration+0.1)throw Error('請輸入音檔長度內的有效起迄時間');
 return [Math.floor(start*16000),Math.min(length,Math.ceil(end*16000))];
}
function lockASR(locked){for(const id of ['transcribeAudio','prepareWhisper','asrRange','asrModel'])$(id).disabled=locked}
function showASRResult(t,value,description){
 $('asrCandidate').value=value;$('asrResultInfo').textContent=t.title+' · '+description;
 $('asrResultPanel').open=true;
}
$('asrDownload').onclick=()=>{const value=$('asrCandidate').value;if(!value){asrNote('尚無辨識結果。');return}const url=URL.createObjectURL(new Blob(['\ufeff'+value],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='ASR_review.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000)};
let whisperModelName='';
let whisperPipeline=null,whisperLoading=null,asrBusy=false;
function asrNote(msg){$('asrStatus').textContent=msg;console.info('[TOEIC ASR]',msg)}
async function getWhisper(){
 const name=$('asrModel').value;
 if(whisperPipeline&&whisperModelName===name)return whisperPipeline;
 if(whisperPipeline){await whisperPipeline.dispose();whisperPipeline=null;whisperLoading=null}
 whisperModelName=name;
 if(!whisperLoading)whisperLoading=(async()=>{
   asrNote('正在下載／初始化英文 Whisper 模型；第一次使用需要網路及較長時間…');
   const {pipeline,env}=await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/+esm');
   env.allowLocalModels=false;
   return await pipeline('automatic-speech-recognition','onnx-community/whisper-'+name,{device:'wasm',dtype:'q8',progress_callback:p=>{if(p.status==='progress'&&Number.isFinite(p.progress))asrNote('正在下載語音模型：'+Math.round(p.progress)+'%（'+(p.file||'模型檔')+'）');else if(p.status==='initiate')asrNote('正在準備語音模型：'+(p.file||'下載中…'));else if(p.status==='ready')asrNote('模型下載完成，準備辨識…')}});
 })().catch(e=>{whisperLoading=null;throw e});
 whisperPipeline=await whisperLoading;return whisperPipeline;
}
async function transcriptionBytes(t){
 if(t.type==='cloud'){
  if(!accessToken)throw Error('請先登入 Google，取得讀取音檔的授權。');
  let res=await driveFetch('https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(t.fileId)+'?alt=media');
  return await res.arrayBuffer();
 }
 if(t.type==='local'){
  let res=await fetch(t.src);if(!res.ok)throw Error('無法讀取本機音檔');return await res.arrayBuffer();
 }
 throw Error('Google Drive 分享連結無法直接辨識；請使用 API 同步的音檔或本機音檔。');
}
async function decode16k(buffer){
 const ctx=new (window.AudioContext||window.webkitAudioContext)();
 try{
  let decoded=await ctx.decodeAudioData(buffer);
  if(decoded.duration>1200)throw Error('為避免瀏覽器記憶體不足，目前每次支援最長 20 分鐘的音檔。');
  const length=Math.ceil(decoded.duration*16000);
  const offline=new OfflineAudioContext(1,length,16000);
  const source=offline.createBufferSource();source.buffer=decoded;source.connect(offline.destination);source.start(0);
  let rendered=await offline.startRendering();return rendered.getChannelData(0).slice();
 }finally{await ctx.close()}
}
window.addEventListener('error',e=>{if(asrBusy)asrNote('語音辨識發生錯誤：'+e.message)});
$('prepareWhisper').onclick=async()=>{
 if(asrBusy)return;asrBusy=true;lockASR(true);const btn=$('prepareWhisper');btn.textContent='⏳ 正在準備辨識模型…';
 try {asrNote('已開始測試模型下載，正在連線至 jsDelivr…');await getWhisper();asrNote('✅ 英文辨識模型已準備完成，現在可以選擇 MP3 產生逐字稿。')}
 catch(e){asrNote('❌ 模型載入失敗：'+(e?.message||String(e))+'。請檢查 jsDelivr / Hugging Face 是否可連線，或按 F12 查看 Console。')}
 finally {asrBusy=false;lockASR(false);btn.textContent='⬇ 測試／下載辨識模型'}
};
$('transcribeAudio').onclick=async()=>{
 asrNote('已收到點擊，正在檢查音檔…');
 const t=get();if(!t){asrNote('請先在教材清單選擇 MP3 音檔。');return}
 if(asrBusy)return;
 if(t.englishText && !confirm('已有英文逐字稿。確定以語音辨識結果覆蓋原有內容？'))return;
 const originalText=String(t.englishText||'');$('asrBackup').value=originalText;
 asrBusy=true;lockASR(true);$('transcribeAudio').textContent='⏳ 正在產生逐字稿…';
 const selectedId=t.id;
 try{
  asrNote('正在取得並解碼音檔…');
  const bytes=await transcriptionBytes(t);
  const samples=await decode16k(bytes);
  const model=await getWhisper();
  asrNote('正在辨識英文，請保持頁面開啟（長音檔需要較長時間）…');
  const result=await model(samples,{chunk_length_s:30,stride_length_s:5,return_timestamps:true});
  const value=String(result?.text||'').trim();
  if(!value)throw Error('辨識結果為空白，請檢查音檔是否有人聲。');
  showASRResult(t,value,'完整音檔辨識／'+whisperModelName);
  if(String(t.englishText||'')!==originalText){asrNote('辨識期間原稿已有修改，已保留原稿；新結果顯示在下方供比對。');return}
  t.englishText=value;save();
  if(currentId===selectedId)$('englishText').value=value;
  asrNote('辨識完成：英文逐字稿已保存至瀏覽器，請核對辨識內容。');
  // Translate only after successful English ASR; don't risk losing the recognized English on translation errors.
  if($('autoTranslateChinese').checked){
   await translateTrack(t,{automatic:true});
  }else translateNote('已完成英文辨識；自動翻譯已關閉，可隨時按「重新翻譯成中文」。');
  if(t.type==='cloud'&&$('autoUploadTranscript').checked){
   $('transcriptStatus').textContent='辨識完成，正在自動上傳逐字稿至 Google Drive…';
   const uploaded=await saveTranscriptToDrive({automatic:true,target:t});
   asrNote(uploaded?'✅ 英文辨識完成，並已上傳可用的逐字稿至 Google Drive。請核對中英文內容。':'辨識完成，但尚未自動存回 Google Drive。請查看逐字稿上方提示，必要時手動儲存。');
  }
 }catch(e){asrNote('辨識失敗：'+(e?.message||String(e))+'。可改用 TXT / SRT 字幕匯入。')}
 finally{asrBusy=false;lockASR(false);$('transcribeAudio').textContent='🎙 從音檔產生英文逐字稿'}
};
console.info('[TOEIC ASR] 語音辨識按鈕已完成事件綁定；可使用「測試／下載辨識模型」獨立測試。');

$('asrRange').onclick=async()=>{
 if(asrBusy)return;
 const t=get();if(!t){asrNote('請先選擇音檔教材。');return}
 asrBusy=true;lockASR(true);$('asrBackup').value=String(t.englishText||'');
 try{
  const start=asrTime($('asrStart').value),end=asrTime($('asrEnd').value);
  asrNote('正在載入指定區間音檔…');
  const samples=await decode16k(await transcriptionBytes(t));
  const [first,last]=asrBounds(samples.length,start,end);
  const model=await getWhisper();
  asrNote('正在辨識 '+start+'～'+end+' 秒，原稿會保留…');
  const result=await model(samples.slice(first,last),{chunk_length_s:30,stride_length_s:5,return_timestamps:true});
  const value=String(result?.text||'').trim();if(!value)throw Error('此區間未辨識到文字');
  showASRResult(t,value,start+'～'+end+' 秒／'+whisperModelName);
  asrNote('區間辨識完成，請比對下方結果與原稿；未自動覆寫或上傳。');
 }catch(e){asrNote('區間辨識失敗：'+(e?.message||String(e))+'。原稿未變更。')}
 finally{asrBusy=false;lockASR(false)}
};
