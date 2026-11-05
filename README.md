# TOEIC 逐字稿 Google Drive 儲存修正版

本版修正上一版的 Drive 資料夾寫入權限不足、辨識完成未自動上傳、儲存成功缺乏實際確認等問題，保留既有播放器、教材清單、Whisper 辨識與美化介面。

## 更新及首次授權

1. 將 `index.html` 放到 GitHub Pages 專案覆蓋原檔，然後按 Ctrl+F5。
2. 進入「我的教材清單」→「重新授權」，用有權編輯教材資料夾的 Google 帳號登入，允許 Drive 讀寫權限。
3. 選擇從 Drive **同步** 的教材（清單顯示 Drive API），編輯英文逐字稿／中文翻譯。
4. 點「☁ 儲存逐字稿至 Google Drive」，確認同名檔案覆寫及上傳。頁面必須出現「✅ 已成功存入 Google Drive 教材資料夾」才代表透過 API 確認位置。
5. 也可勾選「語音辨識完成後自動儲存至 Google Drive」，辨識結束會嘗試上傳；如果已有同名檔案，**不會自動覆寫**，須使用手動儲存確認。此選項預設關閉。

例如 `Part 2-01.mp3` 對應 `Part 2-01.en.txt`、`Part 2-01.zh.txt`，只上傳有內容的語言。

## 重要權限說明

為能直接寫入使用者預先指定、可能不是此網站建立的資料夾，本版把 Google OAuth 權限由 `drive.readonly + drive.file` 改成 `https://www.googleapis.com/auth/drive`。這是**可讀寫整個 Google Drive 的高度敏感權限**，不是只限教材資料夾。程式設計上只會對設定的教材資料夾執行檔案讀取、TXT 建立與覆寫，但持有該權限的網站程式理論上可以處理其他 Drive 檔案。請只在信任的自有 GitHub Pages 站點使用，不要使用不明來源的修改版。

Google OAuth 對完整 Drive 權限可能要求 OAuth 同意畫面設定、應用程式驗證、測試使用者或 Workspace 管理員同意，**僅修改 HTML 不代表一定能取得授權**。如果 Google 不允許此權限，需到 Google Cloud Console 完成同意畫面／授權設定，或改採較限縮的 Google Picker／後端方案。

## 失敗排查

- **403 / insufficient scopes**：舊權杖權限不足；到「我的教材清單」點「重新授權」，確認出現 Drive 讀寫要求。
- **404 / File not found**：確認登入帳號擁有對教材資料夾的編輯權限及 ID 正確。
- **Access blocked / 未驗證的應用程式**：Google OAuth 設定或管理政策阻擋；需管理員／Google Cloud Console 處理。
- **雲端儲存成功後沒有看到檔案**：檔案存入網站設定的教材資料夾（不是「我的雲端硬碟」根目錄）。
- **辨識成功但未上傳**：辨識只保證瀏覽器本地儲存，請檢查逐字稿上方的雲端儲存狀態訊息。

已進行 JavaScript 語法檢查及 ZIP 完整性檢查；真實 Google 帳號授權與寫入測試必須在使用者 GitHub Pages 網站執行。
