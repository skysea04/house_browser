# House Browser (591)
---
## 專案簡介
本專案為透過 [Cloudflare service](https://dash.cloudflare.com/) (免費方案) 與 [Line Notify](https://notify-bot.line.me/zh_TW/) (也是免費方案) 結合的 591 房屋資訊通知小幫手。

可以依照特定租屋條件在 Line 上進行新物件與物件降價的推播通知，不再需要頻繁開 App 找物件，還能在第一時間獲取資訊、搶先於他人和房東聯絡。

## 使用服務
1. Cloudflare worker (cloudflare 提供的 serverless app service，類似於 GCP Cloud Run / AWS Fargate)
2. Cloudflare D1 (Cloudflare serverless SQL，可以把它當作 SQLite)
3. Line Notify (作為單方面傳送通知的 API / Webhook)

## 未來新增功能
1. 開放針對特定預售屋推案進行追蹤，若有資訊更新進行推播通知
2. 依照特定進行新成屋、中古屋的推播通知

## 專案建構、使用教學

### 環境準備
1. 下載 [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
1. 下載 Node.js (可使用 [nvm](https://github.com/nvm-sh/nvm) 安裝 Node.js 進行版本管理與切換)
2. 註冊 [Cloudflare](https://dash.cloudflare.com/) 帳號
3. 擁有一個 [Line 帳號](https://line.me/tw/)

### 建構服務
1. 擷取專案後，複製一份 `wrangler.toml.sample` 並改名為 `wrangler.toml`，此為 cloudflare 需要的設定檔
2. 建立 Cloudflare D1，在當前路徑執行：
   ```
   npx wrangler d1 create house_browser
   ```
   ↓ 獲得以下資訊，貼到 `wrangler.toml` 中取代原本的 [[d1_databases]] 設定
   ```
   [[d1_databases]]
   binding = "DB" # i.e. available in your Worker on env.DB
   database_name = "house_browser"
   database_id = "__YOUR_D1_DATABASE_ID__"
   ```
   執行以下指令，將本專案的 DB Schema 建立到你 的 cloudflare D1 DB house_browser 上
   ```
   npx wrangler d1 migrations apply house_browser --remote
   ```
3. 接著執行 `npx wrangler deploy` 部署 worker 到 cloudflare 上
4. 進入 [Line Notify](https://notify-bot.line.me/zh_TW/) 登入後點擊 **發行權杖** 按鈕
   <image src="https://github.com/skysea04/house_browser/assets/73434165/1fca4b11-acc7-4a5e-9aee-64a6b8640d81" width=600>
   設定 Notify 名稱與對應通知群組後將 Token 記下來（沒有存下來就再也看不到了，需要重新申請喔）

### 使用教學
1. 進入 [Cloudflare 儀表板](https://dash.cloudflare.com/) 選擇 **Workers & Pages** 再點擊 D1，你會看到在前面建立的 house_browser DB，進入 Config table 並新增上方獲得的 Token 於 lineNotifyToken 欄位，目前一次僅能新增一筆 Config，也就是所有通知接會從相同 Notify Account 發送
   ![image](https://github.com/skysea04/house_browser/assets/73434165/875cf06c-af04-491b-a34a-b94d22bbd335)
2. 前往 [591 租屋](https://rent.591.com.tw/) 並將自己的條件勾選 / 輸入完畢後，複製上方的完整網址，將網址新增於 houser_browser DB 中的 RentCondition table 中，同時可以包含多筆不同的條件 URL，name 為幫助自己管理的條件說明
   ![image](https://github.com/skysea04/house_browser/assets/73434165/bdfbe146-cc81-453b-83bb-d9a975bc53f0)
   ![image](https://github.com/skysea04/house_browser/assets/73434165/c889a686-516b-485e-92c7-c63f94de3a4a)
3. (Optional) 前往 house-browser worker -> Setting -> Triggers -> Cron Triggers，可以看到目前腳本的執行頻率設定，預設為六小時執行一次，若想要更改頻率可以在此進行改動或新增規則
4. 若有腳本有順利執行，就會在 Line 上看到通知訊息囉

   <image src="https://github.com/skysea04/house_browser/assets/73434165/117be08f-4b9c-418e-b0f0-ec44ad6a32e6" width=400>





   
