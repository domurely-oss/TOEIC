# TOEIC 多益聽力學習網站（GitHub Pages 版）

本版已將 OAuth Client ID 與 Google Drive 資料夾 ID 預設在 `index.html` 程式碼中；**不在網頁操作介面顯示**。Google OAuth Client ID 與資料夾 ID 仍可經由公開網站原始碼查看，不能視為保密資料。請勿將 OAuth Client Secret 放入前端。

## GitHub Pages 部署

1. 上傳 `index.html`、`.nojekyll` 到儲存庫根目錄。
2. Repository → Settings → Pages → Deploy from a branch → main / (root)。
3. 在 Google Cloud OAuth 用戶端的 Authorized JavaScript origins 新增 `https://你的帳號.github.io`（不含儲存庫路徑）。
4. Google 帳號登入授權後，自動同步預設 Drive 資料夾第一層的音檔。

## 使用

點選左側音檔，畫面會捲動到右側播放器，雲端音檔在授權有效時自動載入並播放。本機音檔點選後也會嘗試立即播放。Google Drive 分享連結音檔使用 Drive 預覽播放器，可能需要在預覽視窗按播放。

## 注意

- 雲端 MP3 必須由已授權 Google 帳號有權存取。
- 雲端音檔目前是先下載成 Blob 再播放，大檔案可能較慢。
- 學習紀錄儲存在目前瀏覽器的 localStorage。
- 若瀏覽器阻擋自動播放，請點播放器的「播放」按鈕。
