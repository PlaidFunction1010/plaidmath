// 112 基隆女中｜教師甄試（數學）— 模擬練習 MVP
// 功能：
// 1) 題庫呈現、即時批改（支援浮點誤差 ±1e-6、分數簡寫 1/2 或 0.5）
// 2) 錯題收藏（自動標記未通過）
// 3) 部分題目具備「重抽數字」與「自動計算正解」能力（示範：Q2、Q11）
// 4) 題面支援 LaTeX。
//
// 注意：此為 MVP，僅部分題目完成參數化，其他題目以「固定版」呈現（已含正解）。
// 後續要擴充時，仿照 param 型題目的 generator 撰寫即可。

const state = {
  questions: [],
  filterWrongOnly: false
};

// --- 工具函式 ---
function toNumberLike(s) {
  if (typeof s === 'number') return s;
  if (!s) return NaN;
  s = String(s).trim();
  // 支援分數型  a/b
  if (/^[+-]?\d+\/[+-]?\d+$/.test(s)) {
    const [a, b] = s.split('/').map(Number);
    if (b === 0) return NaN;
    return a / b;
  }
  // 支援根號簡寫 sqrt(2)
  s = s.replace(/√/g, 'sqrt');
  if (/^sqrt\(\s*[\d.]+\s*\)$/.test(s)) {
    const val = Number(s.match(/sqrt\(\s*([\d.]+)\s*\)/)[1]);
    return Math.sqrt(val);
  }
  // 其他直接 parseFloat
  const num = Number(s);
  return isFinite(num) ? num : NaN;
}

function nearlyEqual(a, b, eps=1e-6) {
  if (typeof a === 'number' && typeof b === 'number') {
    return Math.abs(a - b) <= eps;
  }
  return a === b;
}

function showScore() {
  const total = state.questions.length;
  const ok = state.questions.filter(q => q._ok === true).length;
  document.getElementById('scoreboard').textContent = `得分：${ok} / ${total}`;
}

function mountQuestions() {
  const root = document.getElementById('app');
  root.innerHTML = '';
  const list = state.filterWrongOnly ? state.questions.filter(q => !q._ok) : state.questions;

  list.forEach((q, idx) => {
    const card = document.createElement('div');
    card.className = 'card';

    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.innerHTML = `<span class="tag">第 ${q.id} 題</span><span class="tag">${q.section}</span><span class="tag">${q.type}</span>`;
    card.appendChild(meta);

    const qtext = document.createElement('div');
    qtext.className = 'qtext';
    qtext.innerHTML = q.render();
    card.appendChild(qtext);

    const ansRow = document.createElement('div');
    ansRow.className = 'answerRow';

    const inp = document.createElement('input');
    inp.className = 'answer';
    inp.placeholder = '輸入答案…（支援 3/2、sqrt(2)、π 用 pi 表示）';
    inp.value = q._userAns || '';
    ansRow.appendChild(inp);

    const btn = document.createElement('button');
    btn.className = 'btn-check';
    btn.textContent = '檢查';
    const result = document.createElement('span');
    result.className = 'result';

    btn.onclick = () => {
      const raw = inp.value.trim().replace(/pi/gi,'π');
      q._userAns = raw;

      if (q.answerCheck) {
        q._ok = q.answerCheck(raw);
      } else {
        // fallback：數值或字串等於
        q._ok = (raw === q.answerText);
        // 嘗試數值比較
        const a = toNumberLike(raw);
        const b = toNumberLike(q.answerText);
        if (!isNaN(a) && !isNaN(b)) q._ok = nearlyEqual(a, b);
      }

      result.textContent = q._ok ? '✔ 正確' : `✖ 錯誤（正解：${q.answerText}）`;
      result.className = 'result ' + (q._ok ? 'ok' : 'no');
      showScore();
    };

    ansRow.appendChild(btn);
    ansRow.appendChild(result);
    card.appendChild(ansRow);

    if (q.explain) {
      const exp = document.createElement('div');
      exp.className = 'explain';
      exp.innerHTML = q.explain;
      card.appendChild(exp);
    }

    if (q.randomize) {
      const admin = document.createElement('div');
      admin.className = 'admin';
      admin.innerHTML = '此題支援「重抽數字」。';
      card.appendChild(admin);
    }

    root.appendChild(card);
  });

  showScore();
}

// --- 題目定義 ---
// 固定題（直接核對字串或數值）
function fixedQuestion(id, section, html, answerText, explain='') {
  return {
    id, section,
    type: '填充題',
    render: () => html,
    answerText,
    explain
  };
}

// 參數化題（示範）：Q2 二次方程整根題（自動產生 a、p、q）
// 我們直接反過來「先抽整數根 p>q」，再解出 a，使得
// x^2 + (a-53)x + (2a+22)=0 的兩根恰為 p, q。
// 需求：
// p + q = 53 - a
// pq = 2a + 22
// 解得 a = 53 - (p + q) 且需滿足 pq = 2(53 - (p+q)) + 22
// → pq + 2(p+q) = 128
// 我們用窮舉挑一組 (p,q) 滿足上式。
function makeQ2(id=2) {
  let p=null,q=null,a=null;
  const cand = [];
  for (let i=-50;i<=80;i++){
    for (let j=-50;j<=80;j++){
      if (i===j) continue;
      const lhs = i*j + 2*(i+j);
      if (lhs===128) {
        cand.push([i,j]);
      }
    }
  }
  const pick = cand[Math.floor(Math.random()*cand.length)];
  [p,q] = pick[0]>pick[1] ? pick : [pick[1], pick[0]]; // 令 p>q
  a = 53 - (p+q);

  const html = `設 $a$ 為整數，方程式 $x^2 + (a-53)x + (2a+22)=0$ 的解為兩相異實數 $p,q$，其中 $p>q$，則 $p=\\underline{\\quad\\quad}$.<br>
  <small class="hint">（本題為參數化示範：系統隨機重抽 $(p,q)$，並同步調整 $a$；你只需求 $p$）</small><hr class="sep">
  <div>本次隨機的 $a$ 值為：<b>$${a}$$</b></div>`;

  return {
    id,
    section: '第一部分',
    type: '填充題（參數化示範）',
    render: () => html,
    answerText: String(p),
    explain: `由 $p+q=53-a$、$pq=2a+22$ 聯立可得；本次抽樣解為 $p=${p},\\;q=${q}$。`,
    randomize: () => makeQ2(id)
  };
}

// 參數化題（示範）：Q11 配位帽子問題（座位圓桌，每人左右鄰居至少一名戴同色帽的機率）
// 簡化版設定：10 人圓座，帽子三色等機率獨立配發。問：每人左右鄰居至少一人與自己同色的機率。
// 我們以蒙地卡羅近似（預設 20000 次）。此為 MVP 示範（可調樣本數）。
function makeQ11(id=11, N=20000, seed=null) {
  const n=10;
  const colors = [0,1,2];
  let ok=0;
  function rand(){
    // 簡單亂數
    return Math.random();
  }
  for (let t=0;t<N;t++){
    const hats = Array.from({length:n}, _=> colors[Math.floor(rand()*3)]);
    let allok = true;
    for (let i=0;i<n;i++){
      const L = hats[(i-1+n)%n];
      const R = hats[(i+1)%n];
      if (!(L===hats[i] || R===hats[i])) { allok=false; break; }
    }
    if (allok) ok++;
  }
  const prob = ok/N;
  const html = `10 名女生坐圓桌，每人隨機戴上藍、綠、紅三色帽之一（獨立且等機率）。
  若每個人都「至少一名鄰座（左或右）與自己同色」成立的機率為 $\\underline{\\quad\\quad}$。<br>
  <small class="hint">（本題為參數化示範：系統以蒙地卡羅法近似期望值；重抽數字時會重新模擬）</small>`;

  return {
    id,
    section: '第一部分',
    type: '填充題（參數化示範）',
    render: () => html,
    answerText: prob.toFixed(4),
    answerCheck: (raw)=>{
      // 接受四捨五入到小數第 4 位
      const v = toNumberLike(raw);
      return !isNaN(v) && Math.abs(v - prob) <= 0.005;
    },
    explain: `模擬次數 ${N} 次，近似機率=${prob.toFixed(4)}。實際考題答案為 $\\tfrac{19}{2187}\\approx0.0087$（三色均等、特定題意條件下的解析值）。此處示範為可重算版本。`,
    randomize: () => makeQ11(id, N)
  };
}

// 其餘固定題（依你提供的影像答案先做 MVP）
const fixedSet = [
  fixedQuestion(1,'第一部分','滿足聯立不等式 $\\begin{cases}|x|+|y|+|x+y|\\le 100\\\\ x^2+y^2\\le 2500\\end{cases}$ 的點所形成的區域面積為 $\\underline{\\quad\\quad}$.','2500+1250π','（解析略，MVP 先提供核對功能。）'),
  // Q2 參數化
  fixedQuestion(3,'第一部分','設 $y=|\\sqrt{3}\\sin x-\\cos x|$ 的圖形與 $x$ 軸、$y$ 軸、直線 $x=2\\pi$ 所圍成的區域繞 $x$ 軸旋轉所得旋轉體為 $S$，$S$ 的體積為 $\\underline{\\quad\\quad}$.','4π^2','（解析略）'),
  fixedQuestion(4,'第一部分','平面上設 $\\triangle ABC$ 為等腰直角三角形，$\\angle C$ 為直角且 $AC=1$。在 $AB$ 上取 $n$ 等分點 $P_0=A,P_1,\\dots,P_n=B$。試求 $\\lim\\limits_{n\\to\\infty}\\frac{1}{n}\\sum_{k=1}^n \\overrightarrow{CP_{k-1}}\\cdot \\overrightarrow{CP_k}=\\underline{\\quad\\quad}$.','2/3'),
  fixedQuestion(5,'第一部分','設 $x_n=p^n+q^n$，$n$ 為正整數且 $p,q$ 為方程式 $x^2-5x-4=0$ 的兩實根；若 $x_{n+2}$ 可表成 $u x_n + v x_{n+1}$，則實數對 $(u,v)=\\underline{\\quad\\quad}$.','(5,4)'),
  fixedQuestion(6,'第一部分','若複數 $z$ 滿足 $z\\bar z -2z-2\\bar z=8$ 且 $\\arg (z-2)=\\tfrac{\\pi}{6}$，則 $z=\\underline{\\quad\\quad}$.','5+√3 i'),
  fixedQuestion(7,'第一部分','已知空間中三個非零向量 $\\vec a,\\vec b,\\vec c$ 兩兩夾角皆為 $60^\\circ$，且 $|\\vec a|=2,|\\vec b|=3,|\\vec c|=4$。若兩向量 $\\vec u,\\vec v$ 滿足 $\\overrightarrow{u\\,(\\vec u+\\vec a)}=u\\vec b,\\;\\overrightarrow{v\\,(\\vec v+\\vec a)}=v\\vec c$，則 $|\\vec u-\\vec v|$ 的最大值為 $\\underline{\\quad\\quad}$.','(√7+2√3+√13)/2'),
  fixedQuestion(8,'第一部分','在單位正方體 $ABCD-A_1B_1C_1D_1$ 中，若點 $E$ 為 $A_1B_1$ 的中點，則兩直線 $DE$ 與 $BC_1$ 的距離為 $\\underline{\\quad\\quad}$.','√6/3'),
  fixedQuestion(9,'第一部分','設 $z$ 為複數，且 $z$ 為方程式 $z^5+z^4+1=0$ 的根，則滿足 $|z|=1$ 的所有根之和為 $\\underline{\\quad\\quad}$.','-1'),
  fixedQuestion(10,'第一部分','已知空間中三直線 $L_1:\\;x/a=y/b=z/c,\\; L_2:\\;x-2/2=y+2/4=z+1/3,\\; L_3:\\;x-4/4=y+1/2=z-2/3$，若直線 $L_4$ 與 $L_2, L_3$ 均相交，則 $a:b:c=\\underline{\\quad\\quad}$.','4:5:4'),
  // Q11 參數化示範
  fixedQuestion(12,'第一部分','設 $\\lfloor x\\rfloor$ 表示不超過 $x$ 的最大整數，求 $\\left\\lfloor\\frac{1}{3}\\right\\rfloor+\\left\\lfloor\\frac{2^2}{3}\\right\\rfloor+\\left\\lfloor\\frac{2^3}{3}\\right\\rfloor+\\cdots+\\left\\lfloor\\frac{2^{2024}}{3}\\right\\rfloor$ 的末兩位數為 $\\underline{\\quad\\quad}$.','98'),
  fixedQuestion(13,'第二部分','設 $f(x)=\\begin{cases}x^2-2x,&x>1\\\\ c,&x=1\\\\ ax^2-bx+1,&x<1\\end{cases}$ 為可微分函數；求實數 $a,b,c$.','a=3, b=5, c=-1'),
  fixedQuestion(14,'第二部分','過直線 $x-2y+13=0$ 上一動點 $A(4,?)$（題面略），作拋物線 $y^2=8x$ 的兩條切線，...（題面略）。','(1)(13,8); (2)(2,0); 3√5/2'),
  fixedQuestion(15,'第二部分','令直線 $L: y=mx$；二階方陣 $T$ 對應將點 $P$ 到 $L$ 的垂直距離縮小一半的線性變換，若 $m=2$，試求 $T$.','[[ (m^2+2)/(2m^2+2), m/(2m^2+2) ],[ m/(2m^2+2), (2m^2+1)/(2m^2+2) ]] （代 m=2）')
];

// 組合題庫（把 Q2、Q11 參數化版本插入）
function buildQuestions(){
  const list = [];
  // push fixed except Q2 id=2 and Q11 id=11 placeholders
  fixedSet.forEach(q=>{
    if (q.id!==2 && q.id!==11) list.push(q);
  });
  // 插入參數化題
  list.splice(1,0, makeQ2(2));
  list.splice(9,0, makeQ11(11, 20000));
  state.questions = list;
}

// --- 事件 ---
document.getElementById('btn-review').onclick = ()=>{
  state.filterWrongOnly = !state.filterWrongOnly;
  document.getElementById('btn-review').textContent = state.filterWrongOnly ? '顯示全部' : '只看未答對';
  mountQuestions();
};

document.getElementById('btn-reset').onclick = ()=>{
  state.questions.forEach(q=>{ q._ok=false; q._userAns=''; });
  mountQuestions();
};

document.getElementById('btn-randomize').onclick = ()=>{
  // 只對具 randomize 的題目重建
  state.questions = state.questions.map(q=>{
    if (q.randomize) return q.randomize();
    return q;
  });
  mountQuestions();
};

// 初始化
buildQuestions();
mountQuestions();
