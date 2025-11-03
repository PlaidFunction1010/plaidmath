# 112 基隆女中｜教師甄試（數學）模擬練習 MVP

這是可直接上傳到 GitHub Pages 的最小可行產品（MVP）：

- 單頁網站（HTML + CSS + Vanilla JS）
- 內建 **LaTeX** 顯示（KaTeX CDN）
- 即時批改（支援 `3/2`, `sqrt(2)`, `π` 輸入 `pi`）
- 錯題濾出、全部重置
- **參數化示範**：Q2（整根二次式）、Q11（帽子機率，蒙地卡羅近似）可「重抽數字」並自動重算答案

> 後續你要擴充「可重抽數字」的題型時，照 `questions.js` 裡的 `makeQ2()` / `makeQ11()` 模式撰寫即可。

## 使用方式

1. 把整個資料夾上傳到 GitHub（例如倉庫 `teacher-exam-112`）。  
2. 到 GitHub 的「Settings → Pages」啟用 GitHub Pages（Branch 選 `main`, folder 選 `/root`）。  
3. 等待幾十秒，網頁即可在 `https://你的帳號.github.io/teacher-exam-112/` 開啟。

## 檔案結構
- `index.html`：主頁
- `styles.css`：樣式
- `questions.js`：題庫與邏輯（含兩題參數化示範）

## 後續 Roadmap（建議）
- [ ] 擴增更多參數化題（每題先寫**產生器** + **答案計算**）
- [ ] 新增「解題詳解」面板與手寫板（供老師示範）
- [ ] 加入帳號與成績記錄（可改用 Firebase Auth + Firestore）
- [ ] 題庫分年分校篩選（例如 112 基隆女中 / 113 基隆高中…）
- [ ] 付費牆（免費試做 5 題，完整題庫需登入訂閱）

---

作者：鴻鈞專案｜MVP 版本（2025/11）
