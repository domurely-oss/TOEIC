TOEIC GitHub Pages 完整網站包 — 2026-11-25

本包包含原有登入功能、免登入頁簽、自訂播放器與中英文文字編輯介面。
原有應用程式拆為 app.js、speech.js、navigation.js，邏輯保持不變。
請整組上傳，勿混用舊版 index.html 或 guest.js。

部署（建議使用 GitHub Actions）
1. 備份儲存庫原有檔案。
2. 解壓縮本包，將 index.html、所有 .js、guest.css、.nojekyll 放在 main 分支根目錄。
   不要只上傳 ZIP，也不要多包一層 repaired_toeic 資料夾。
3. 將 .github/workflows/pages.yml 放到儲存庫相同路徑。
   如網頁上傳未包含隱藏資料夾，可用 Add file > Create new file，
   檔名輸入 .github/workflows/pages.yml，再貼入本包該檔案內容。
4. 移除或停用先前的 Deploy static content to Pages 部署流程，避免兩套流程同時發布。
   只調整舊的 Pages 部署流程；其他工作流程請保留。
5. Settings > Pages > Source 選 GitHub Actions。
6. Actions > Deploy TOEIC to GitHub Pages > Run workflow，選 main。
7. build 與 deploy 均成功後開啟網站，按 Ctrl+F5。
   若仍失敗，提供最新的失敗步驟紀錄，不要只提供舊的部署錯誤。

如果已採用 Deploy from a branch
可繼續用 main / (root)，不必啟用本包的 Actions 工作流程。
只選一種部署方式；.nojekyll 可跳過 Jekyll 處理。

檔案說明
index.html：首頁
app.js / speech.js / navigation.js：原有功能（全部必須上傳）
guest.js / guest.css：免登入播放器與編輯器
guest-catalog.js：公開教材清單
guest-texts.js：中英文文字副本
.github/workflows/pages.yml：檔案檢查、打包、上傳、發布

使用限制
Google Drive 音檔是否可直接播放取決於公開權限與下載服務限制。
直連失敗時可用 Drive 預覽，或先下載音檔，再由自訂播放器選取本機音檔。
文字副本不是雲端即時同步；可嘗試重新讀取雲端，或匯入最新 TXT。
修改只存於目前瀏覽器的個人草稿；可下載 TXT，不會寫回 Google Drive。
原有 Google 登入仍沿用原設定；若換用新網域，需要另確認 OAuth 允許來源。

驗證範圍
已檢查本機引用、全部 JavaScript 語法及原有程式邏輯未變。
此環境瀏覽器執行檔不可用，未完成本次瀏覽器互動測試。
尚未替您在 GitHub 上傳或實際執行部署，無法保證遠端服務狀態。
