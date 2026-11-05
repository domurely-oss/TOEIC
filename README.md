# TOEIC 多益聽力網站 — 語音辨識載入順序修正版

## 修正重點
- 修復按鈕點擊後無反應：前一版辨識腳本先於主程式執行，造成 `Cannot access '$' before initialization`，按鈕事件無法綁定。現在已將辨識腳本移到主程式後面。
- 新增「⬇ 測試／下載辨識模型」按鈕，**不必先選音檔**即可觸發 Whisper 模型初始化及顯示進度。
- 新增載入失敗時的提示；請開發者工具 F12 → Console 查看詳細錯誤。
- 保留播放器置頂、逐字稿第二區、Google Drive 第三區、自動下一首等既有功能。

## 操作方式
1. 將 `index.html` 放在 GitHub Pages 的 Repository 根目錄，覆蓋舊檔並 Commit。
2. 部署完成後，使用 `Ctrl+Shift+R` 或無痕模式載入新網站。
3. 先在逐字稿區按「⬇ 測試／下載辨識模型」，確認看到「正在準備語音模型」與「模型已準備完成」等提示。
4. Google 登入並選擇 MP3，按「從音檔產生英文逐字稿」。

## 注意
- 模型首次下載需要外網可連到 `cdn.jsdelivr.net`、`huggingface.co`（或對應的模型 CDN），並需足夠記憶體。若無法下載，可能是網路阻擋、瀏覽器防護或第三方資源失效。
- 模型會由瀏覽器下載並快取，不會在 GitHub Repository 中出現模型檔。**不會有傳統檔案下載視窗**；請看網站的進度提示及 F12 → Network。
- 如果網站在 `file://` 或封閉式網路環境，OAuth / CDN 模型可能無法正常運作。
- 暫時僅辨識英文，不會自動產生繁體中文翻譯。
- 程式已通過靜態 JS 語法檢查，但無法在此環境驗證外部模型下載及 Google 帳號授權。


Repeat one: Use the repeat-one button to replay the current audio continuously. It is mutually exclusive with auto-next and persists across reloads. Google Drive preview iframe does not support repeat detection.


## 教材清單獨立介面
頁面上方新增「聽力播放 / 我的教材清單」雙介面切換。Google Drive 同步、新增教材與教材清單在教材介面；點選教材自動返回播放介面。切換不會重新載入頁面，也不會中斷音樂。單曲重複播放功能保留。

## 2026-11-05 英文語音辨識修正
使用 `onnx-community/whisper-tiny.en` 英文專用模型時，辨識呼叫不再傳入 `task` 與 `language`，修正「Cannot specify `task` or `language` for an English-only model」錯誤。其他功能（單曲重複、教材清單獨立介面）保留。
