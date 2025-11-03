// 全參數化示範 v1.1.2 — 更健壯的 KaTeX 啟動與快取破壞參數
const state = { questions: [], filterWrongOnly: false };

window.__mountApp = function(){
  buildQuestions();
  mountQuestions();
};

function rerenderMath(){
  if (window.renderMathInElement) {
    window.renderMathInElement(document.body, {
      delimiters:[
        {left:'$$', right:'$$', display:true},
        {left:'\\(', right:'\\)', display:false},
        {left:'$', right:'$', display:false}
      ],
      throwOnError:false
    });
  }
}

// 工具
function toNumberLike(s) {
  if (typeof s === 'number') return s;
  if (!s) return NaN;
  s = String(s).trim();
  if (/^[+-]?\d+\/[+-]?\d+$/.test(s)) {
    const [a, b] = s.split('/').map(Number);
    if (b === 0) return NaN;
    return a / b;
  }
  s = s.replace(/√/g, 'sqrt');
  if (/^sqrt\(\s*[\d.]+\s*\)$/.test(s)) {
    const val = Number(s.match(/sqrt\(\s*([\d.]+)\s*\)/)[1]);
    return Math.sqrt(val);
  }
  s = s.replace(/π/g,'pi').replace(/\s+/g,'');
  const num = Number(s.replace(/pi/g, Math.PI));
  return isFinite(num) ? num : NaN;
}
function nearlyEqual(a, b, eps=1e-6) {
  if (typeof a === 'number' && typeof b === 'number') return Math.abs(a - b) <= eps;
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
  list.forEach((q) => {
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
    inp.placeholder = '輸入答案…（支援 3/2、sqrt(2)、π→pi）';
    inp.value = q._userAns || '';
    ansRow.appendChild(inp);
    const btn = document.createElement('button');
    btn.className = 'btn-check';
    btn.textContent = '檢查';
    const result = document.createElement('span');
    result.className = 'result';
    btn.onclick = () => {
      const raw = inp.value.trim();
      q._userAns = raw;
      if (q.answerCheck) {
        q._ok = q.answerCheck(raw);
      } else {
        q._ok = (raw === q.answerText);
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
  rerenderMath();
}
function fixedQuestion(id, section, html, answerText, explain='') {
  return { id, section, type:'填充題', render: () => html, answerText, explain };
}

// Q1 參數化
function makeQ1(id=1, a=null){
  if (a===null) a = Math.floor(20 + Math.random()*61);
  const area = a*a + Math.PI/2*a*a;
  const html = `滿足聯立不等式 $$\\begin{cases}|x|+|y|+|x+y|\\le 2a \\\\ x^2+y^2\\le a^2\\end{cases}$$ 的點所形成的區域面積為 \\(\\underline{\\quad\\quad}\\)。<br>
  <small>本次抽到 \\(a=${a}\\)。</small>`;
  return { id, section:'第一部分', type:'填充題（參數化）',
    render: () => html,
    answerText: `a^2 + (π/2)a^2（本次 a=${a}，≈${area.toFixed(4)}）`,
    answerCheck: (raw)=>{ const v = toNumberLike(raw); return !isNaN(v) && Math.abs(v - area) <= 0.01; },
    explain: `第一、三象限各 \\(\\tfrac12 a^2\\)；第二、四象限合成半圓 \\(\\tfrac{\\pi}{2}a^2\\)。`,
    randomize: () => makeQ1(id) };
}

// 判斷質數
function isPrime(n){ if (n<2) return false; for(let i=2;i*i<=n;i++) if(n%i===0) return false; return true; }

// Q2：相異質數
function makeQ2(id=2) {
  // (p+2)(q+2)=132 ⇒ 候選因數對
  const fac = [[4,33],[33,4],[6,22],[22,6],[11,12],[12,11]];
  const pairs = [];
  fac.forEach(([A,B])=>{
    const p=A-2, q=B-2;
    if (isPrime(p) && isPrime(q) && p!==q) {
      const a = 53 - (p+q);
      pairs.push({p,q,a});
    }
  });
  // 應至少得到 (p,q)=(31,2) 或 (2,31)
  const pick = pairs[Math.floor(Math.random()*pairs.length)];
  const p = Math.max(pick.p, pick.q);
  const q = Math.min(pick.p, pick.q);
  const a = pick.a;
  const html = `設 $a$ 為整數，方程式 $x^2 + (a-53)x + (2a+22)=0$ 的解為兩**相異質數** $p,q$，其中 $p>q$，則 $p=\\underline{\\quad\\quad}$.<hr class="sep">
  <div>本次隨機的 $a$ 值為：<b>$${a}$$</b></div>`;
  return { id, section:'第一部分', type:'填充題（參數化）',
    render: () => html,
    answerText: String(p),
    explain: `Vieta：$p+q=53-a,\\ pq=2a+22$。因 $(p+2)(q+2)=132$，本次 $p=${p},\\ q=${q}$（皆為質數）。`,
    randomize: () => makeQ2(id) };
}

// Q6：複數幾何
function makeQ6(id=6){
  const s = 1 + Math.floor(Math.random()*3);
  const t = 1 + Math.floor(Math.random()*4);
  const angles = [
    {tex:'\\frac{\\pi}{6}', c:Math.sqrt(3)/2, s:0.5, txt:'+ '+t+'√3 + '+t+'i'},
    {tex:'\\frac{\\pi}{4}', c:Math.sqrt(2)/2, s:Math.sqrt(2)/2, txt:'+ '+t+'√2 + '+t+'√2 i'},
    {tex:'\\frac{\\pi}{3}', c:0.5, s:Math.sqrt(3)/2, txt:'+ '+t+' + '+t+'√3 i'}
  ];
  const ang = angles[Math.floor(Math.random()*angles.length)];
  const K = 4*t*t - 4*s*s;
  const x = 2*s + 2*t*ang.c;
  const y = 2*t*ang.s;
  const html = `若複數 $z$ 滿足 $z\\bar z - 2${s}\\,z - 2${s}\\,\\bar z = ${K}$ 且 $\\arg (z-${2*s}) = ${ang.tex}$，則 $z=\\underline{\\quad\\quad}$.`;
  return { id, section:'第一部分', type:'填充題（參數化）',
    render: () => html,
    answerText: `${2*s} ${ang.txt}`,
    answerCheck: (raw)=>{
      const m = raw.replace(/\s+/g,'').replace(/√3/g, String(Math.sqrt(3))).replace(/√2/g, String(Math.sqrt(2))).match(/^([+-]?[0-9.]+)([+-][0-9.]+)i$/);
      let xr, yi;
      if (m){ xr = Number(m[1]); yi = Number(m[2]); }
      if (xr===undefined || yi===undefined){ return false; }
      return Math.hypot(xr - x, yi - y) <= 0.03;
    },
    explain: `$(x-2${s})^2+y^2=(2${t})^2$，沿 $\\arg (z-2${s})=${ang.tex}$ 取距離 $2${t}$。`,
    randomize: () => makeQ6(id) };
}

function makeQ8(id=8){
  const L = 1 + Math.floor(Math.random()*5);
  const val = L * Math.sqrt(6) / 3;
  const html = `在邊長為 $${L}$ 的正方體 $ABCD-A_1B_1C_1D_1$ 中，若點 $E$ 為 $A_1B_1$ 的中點，則兩直線 $DE$ 與 $BC_1$ 的距離為 \\(\\underline{\\quad\\quad}\\).`;
  return { id, section:'第一部分', type:'填充題（參數化）',
    render: () => html,
    answerText: `${L}·√6/3 ≈ ${val.toFixed(4)}`,
    answerCheck: (raw)=>{ const v = toNumberLike(raw.replace(/√6/g, String(Math.sqrt(6)))); return !isNaN(v) && Math.abs(v - val) <= 0.01; },
    explain: `邊長放大為 $${L}$，距離等比放大為 $${L}\\cdot\\tfrac{\\sqrt6}{3}$。`,
    randomize: () => makeQ8(id) };
}

function makeQ11(id=11, N=20000) {
  const n=10, colors=[0,1,2]; let ok=0;
  for (let t=0;t<N;t++){
    const hats = Array.from({length:n}, _=> colors[Math.floor(Math.random()*3)]);
    let allok = true;
    for (let i=0;i<n;i++){
      const L = hats[(i-1+n)%n], R = hats[(i+1)%n];
      if (!(L===hats[i] || R===hats[i])) { allok=false; break; }
    }
    if (allok) ok++;
  }
  const prob = ok/N;
  const html = `10 名女生坐圓桌，每人隨機戴上藍、綠、紅三色帽之一（獨立且等機率）。若每個人都「至少一名鄰座（左或右）與自己同色」成立的機率為 \\(\\underline{\\quad\\quad}\\).`;
  return { id, section:'第一部分', type:'填充題（參數化）',
    render: () => html,
    answerText: prob.toFixed(4),
    answerCheck: (raw)=>{ const v = toNumberLike(raw); return !isNaN(v) && Math.abs(v - prob) <= 0.005; },
    explain: `蒙地卡羅 ${N} 次近似；解析值特例為 $\\tfrac{19}{2187}\\approx0.0087$。`,
    randomize: () => makeQ11(id, N) };
}

function makeQ12(id=12){
  const N = 1000 + Math.floor(Math.random()*2001);
  let sum2_mod300 = 0, sumr_mod300 = 0, pow2_mod300 = 2 % 300;
  for (let k=1;k<=N;k++){
    sum2_mod300 = (sum2_mod300 + pow2_mod300) % 300;
    sumr_mod300 = (sumr_mod300 + (pow2_mod300 % 3)) % 300;
    pow2_mod300 = (pow2_mod300 * 2) % 300;
  }
  const ans = ((sum2_mod300 - sumr_mod300) / 3) % 100;
  const v = ((ans+100)%100);
  const html = `設 $\\lfloor x\\rfloor$ 表示不超過 $x$ 的最大整數，求 $$\\sum_{k=1}^{${N}} \\left\\lfloor \\frac{2^k}{3} \\right\\rfloor$$ 的末兩位數為 \\(\\underline{\\quad\\quad}\\).`;
  return { id, section:'第一部分', type:'填充題（參數化）',
    render: () => html,
    answerText: String(v).padStart(2,'0'),
    answerCheck: (raw)=>{ const x = parseInt(raw,10); return !isNaN(x) && (x%100)===v; },
    explain: `利用 $\\lfloor\\tfrac{2^k}{3}\\rfloor = \\tfrac{2^k - (2^k\\bmod 3)}{3}$，以模運算求末兩位。`,
    randomize: () => makeQ12(id) };
}

// 其他固定
const fixedSet = [
  fixedQuestion(3,'第一部分','設 $y=|\\sqrt{3}\\sin x-\\cos x|$ 的圖形與 $x$ 軸、$y$ 軸、直線 $x=2\\pi$ 所圍成的區域繞 $x$ 軸旋轉所得旋轉體為 $S$，$S$ 的體積為 \\(\\underline{\\quad\\quad}\\).','4π^2'),
  fixedQuestion(4,'第一部分','等腰直角三角形邊長條件（題述略）之向量和極限值為 \\(\\underline{\\quad\\quad}\\).','2/3'),
  fixedQuestion(5,'第一部分','遞迴表示 $x_{n+2}=u x_n + v x_{n+1}$，$(u,v)=\\underline{\\quad\\quad}\\).','(5,4)'),
  fixedQuestion(7,'第一部分','三向量兩兩 $60^\\circ$、長度分別 2,3,4，求 $|\\vec u - \\vec v|$ 最大值。','(√7+2√3+√13)/2'),
  fixedQuestion(9,'第一部分','若 $z^5+z^4+1=0$，且 $|z|=1$ 的根之和為 \\(\\underline{\\quad\\quad}\\).','-1'),
  fixedQuestion(10,'第一部分','空間三直線 $L_1,L_2,L_3$… 若 $L_4$ 與 $L_2,L_3$ 交，則 $a:b:c=\\underline{\\quad\\quad}\\).','4:5:4'),
  fixedQuestion(13,'第二部分','分段函數可微求 $a,b,c$。','a=3, b=5, c=-1'),
  fixedQuestion(14,'第二部分','拋物線切線幾何（題述略）。','(1)(13,8); (2)(2,0); 3√5/2'),
  fixedQuestion(15,'第二部分','縮距線性變換矩陣（代 $m=2$）。','[[ (m^2+2)/(2m^2+2), m/(2m^2+2) ],[ m/(2m^2+2), (2m^2+1)/(2m^2+2) ]] （m=2）')
];

function buildQuestions(){
  const list = [];
  list.push(makeQ1(1));
  list.push(makeQ2(2));
  fixedSet.forEach(q=> list.push(q));
  const idsToReplace = new Set([6,8,11,12]);
  const filtered = list.filter(q => !idsToReplace.has(q.id));
  filtered.push(makeQ6(6));
  filtered.push(makeQ8(8));
  filtered.push(makeQ11(11, 20000));
  filtered.push(makeQ12(12));
  filtered.sort((a,b)=> a.id - b.id);
  state.questions = filtered;
}

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
  state.questions = state.questions.map(q=> q.randomize ? q.randomize() : q);
  mountQuestions();
};
