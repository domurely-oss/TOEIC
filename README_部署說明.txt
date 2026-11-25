TOEIC GitHub 教材版 — 2026-11-25

一、這次修改
免登入頁面改讀同一個 GitHub Pages 網站內的音檔與文字檔，不再使用 Drive 音檔連結。
保留自訂播放器、A–B 循環、變速、上一首／下一首、文字編輯、TXT 匯入下載與個人草稿。
原有登入、教材管理與語音辨識程式保持不變，仍沿用原設定。
編輯文字只存於此瀏覽器，不會直接更新 GitHub。要公開更新，請下載 TXT 後上傳到儲存庫。
此版草稿使用新的儲存名稱，舊版草稿不會被覆寫，也不會自動搬入；請先由舊版下載重要草稿。

二、教材放置位置（保留原始檔名，大小寫須一致）
音檔：media/audio/01_Day1.mp3
英文：media/texts/01_Day1.en.txt
中文：media/texts/01_Day1.zh.txt
以相同主檔名配對。支援 MP3、M4A、WAV、OGG；文字請使用 UTF-8。
如果分成子資料夾，兩邊使用相同子路徑，例如 audio/Part1/01.mp3 與 texts/Part1/01.en.txt。

包內已含 18 份既有文字副本（來源為 2026-11-17 的公開教材副本），不是最新雲端同步。
包內沒有 207 個實體音檔！需從 Google Drive 下載、解壓縮，再上傳到 media/audio。
只有文字而沒有音檔的教材仍可編輯文字，但不會假裝已有可播放音源。
可以先上傳 01_Day1.mp3 測試，成功後分批上傳其餘音檔。

三、GitHub 部署
1. 先備份原儲存庫與重要文字草稿。
2. 解壓縮本包，將包內檔案及資料夾放到 main 分支根目錄，保留目錄結構。
   不要只上傳 ZIP，也不要多包一層資料夾。
   包內所有 JS、CSS 與 index.html 必須整組更新。
3. 上傳音檔到 media/audio，英文及中文 TXT 放 media/texts。
4. 確認 .github/workflows/pages.yml 與 scripts/build_catalog.py 已一併上傳。
   若網頁上傳未帶入 .github，可用 Add file > Create new file，輸入完整路徑後貼入內容。
5. 停用先前其他 Pages 部署流程，只留本包 pages.yml，避免互相覆蓋。
   若之前也是同一路徑的 pages.yml，直接以此版取代即可。
6. Settings > Pages > Source 選 GitHub Actions。
7. Actions > Deploy TOEIC GitHub Media > Run workflow > 選 main。
8. build 與 deploy 成功後重整網站（Ctrl+F5），點「免登入使用」。

以後新增或修改教材並提交到 main，就會自動掃描 media 並更新清單、部署。
不要手動修改 guest-catalog.js 與 guest-texts.js；Actions 會依實際檔案重新產生。
不要選 Deploy from a branch，否則不會自動更新教材清單。
網站仍可保留原有 Google 登入；若換網域，需另確認 Google OAuth 允許來源。

四、排查
沒有音檔：確認 media/audio 有實體音檔，且最新部署成功。
音檔 404：確認檔名大小寫與路徑，網址不可只指向 github.com 的檔案檢視頁。
清單沒更新：確認 Source 是 GitHub Actions，且執行的是本包的新流程。
文字仍顯示舊內容：個人草稿會優先保留；按「重新讀取網站文字」並確認後可取得網站版本。
修改文字後想讓所有人看見：下載 TXT，再上傳覆蓋 media/texts 的同名檔案。

五、容量與驗證
GitHub 網頁上傳單檔上限 25 MiB；一般 Git 不接受超過 100 MiB 的檔案。
GitHub Pages 網站總大小上限 1 GB；本包建置在教材超過 950 MiB 時會提示停止。
不要使用 Git LFS 指標檔充當音檔。瀏覽器需取得實際音訊位元組。
本版已驗證 JavaScript 語法、引用完整性、原有程式不變、教材掃描與特殊檔名路徑。
尚未在您的 GitHub 實際部署；本次未完成真實瀏覽器的音訊互動測試。
