// 112 免費固定版（原題）+ 強化驗答（支援 pi/π/^/sqrt）
const state = { questions: [], };

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

// --- 表達式求值（支援 pi、π、sqrt()、^、分數） ---
function evalExpr(str){
  if (typeof str !== 'string') return NaN;
  let s = str.trim();
  // 允許輸入分數 a/b
  // 先處理特殊：如果是形如 "a/b" 單一分數
  if (/^[+-]?\d+\/[+-]?\d+$/.test(s)) {
    const [a,b] = s.split('/').map(Number);
    if (b===0) return NaN;
    return a/b;
  }
  // 轉換：π、pi、√x、^ → **
  s = s.replace(/π/gi,'pi');
  s = s.replace(/√\s*\(/g,'sqrt(').replace(/√\s*([0-9.]+)/g,'sqrt($1)');
  s = s.replace(/\^/g,'**');
  s = s.replace(/pi/gi,'Math.PI').replace(/sqrt\(/g,'Math.sqrt(');
  // 禁止非法字元（只允許數字、運算子、小數點、括號、空白、Math.PI 及 Math.sqrt）
  if (/[^0-9+\-*/().\sMatahcPIqrt]/.test(s)) return NaN;
  try {
    // eslint-disable-next-line no-new-func
    return Function(`"use strict"; return (${s});`)();
  } catch(e){ return NaN; }
}

function nearlyEqual(a,b,eps=1e-6){
  if (typeof a!=='number'||typeof b!=='number'||!isFinite(a)||!isFinite(b)) return false;
  return Math.abs(a-b)<=eps;
}

// 元件
function fixedQ(id, htmlLatex, answerExpr){
  return {
    id, section:'第一部分', type:'填充題（原題固定）',
    render: () => htmlLatex,
    answerExpr, // canonical expression string
    answerText: answerExpr,
    answerCheck: (raw)=>{
      const vUser = evalExpr(String(raw));
      const vAns = evalExpr(String(answerExpr));
      // 若答案包含 pi 或 sqrt，改用數值比較；否則字串相等也可以
      const hasIrr = /pi|π|sqrt|√|\^/.test(answerExpr);
      if (hasIrr){
        return isFinite(vUser) && isFinite(vAns) && nearlyEqual(vUser, vAns, 1e-4);
      }else{
        // 整數/有理數支持 a/b 型
        if (/^[+-]?\d+\/[+-]?\d+$/.test(String(raw).trim())){
          return nearlyEqual(vUser, vAns, 1e-10);
        }
        return String(raw).trim() === String(answerExpr).trim() || nearlyEqual(vUser, vAns, 1e-10);
      }
    }
  };
}

function showScore(){
  const total = state.questions.length;
  const ok = state.questions.filter(q=>q._ok).length;
  document.getElementById('scoreboard').textContent = `得分：${ok} / ${total}`;
}

function mount(){
  const root = document.getElementById('app');
  root.innerHTML = '';
  state.questions.forEach(q=>{
    const card = document.createElement('div'); card.className='card';
    const meta = document.createElement('div'); meta.className='meta';
    meta.innerHTML = `<span class="tag">第 ${q.id} 題</span><span class="tag">${q.section}</span><span class="tag">${q.type}</span>`;
    const qtext = document.createElement('div'); qtext.className='qtext'; qtext.innerHTML = q.render();
    const row = document.createElement('div'); row.className='answerRow';
    const inp = document.createElement('input'); inp.className='answer'; inp.placeholder='輸入答案…（支援 3/2、sqrt(2)、π 或 pi、^ 次方）';
    const btn = document.createElement('button'); btn.className='btn-check'; btn.textContent='檢查';
    const result = document.createElement('span'); result.className='result';
    btn.onclick = ()=>{
      const raw = inp.value;
      const ok = q.answerCheck(raw);
      q._ok = ok;
      result.textContent = ok ? '✔ 正確' : `✖ 錯誤（參考答案：${q.answerText}）`;
      result.className = 'result ' + (ok? 'ok':'no');
      showScore();
    };
    row.appendChild(inp); row.appendChild(btn); row.appendChild(result);
    card.appendChild(meta); card.appendChild(qtext); card.appendChild(row);
    root.appendChild(card);
  });
  showScore();
  rerenderMath();
}

// 題庫（依你先前影像的答案建置）
function build(){
  const qs = [];
  qs.push(fixedQ(1,'滿足聯立不等式 $$\\begin{cases}|x|+|y|+|x+y|\\le 100\\\\ x^2+y^2\\le 2500\\end{cases}$$ 的點所形成的區域面積為 \\(\\underline{\\quad\\quad}\\).','2500 + (1250*pi)'));
  qs.push(fixedQ(2,'設 $a$ 為整數，方程式 $x^2+(a-53)x+(2a+22)=0$ 的解為兩相異質數 $p,q$，其中 $p>q$，則 $p=\\underline{\\quad\\quad}$.','31'));
  qs.push(fixedQ(3,'設 $y=|\\sqrt{3}\\sin x-\\cos x|$ 的圖形與 $x$ 軸、$y$ 軸、直線 $x=2\\pi$ 所圍成的區域繞 $x$ 軸旋轉所得旋轉體為 $S$，$S$ 的體積為 \\(\\underline{\\quad\\quad}\\).','4*(pi^2)'));
  qs.push(fixedQ(4,'等腰直角三角形（$AC=1$）…極限值為 \\(\\underline{\\quad\\quad}\\).','2/3'));
  qs.push(fixedQ(5,'$x_n=p^n+q^n$，$p,q$ 為 $x^2-5x-4=0$ 之根；若 $x_{n+2}=ux_n+vx_{n+1}$，則 $(u,v)=\\underline{\\quad\\quad}$.','(5,4)'));
  qs.push(fixedQ(6,'若複數 $z$ 滿足 $z\\bar z-2z-2\\bar z=8$ 且 $\\arg(z-2)=\\tfrac{\\pi}{6}$，則 $z=\\underline{\\quad\\quad}$.','5 + (sqrt(3))*i'));
  qs.push(fixedQ(7,'三向量兩兩夾角 $60^\\circ$，長度 2,3,4，求 $|\\vec u-\\vec v|$ 最大值。','(sqrt(7)+2*sqrt(3)+sqrt(13))/2'));
  qs.push(fixedQ(8,'單位正方體中，$E$ 為 $A_1B_1$ 中點，距離 $DE$ 與 $BC_1$ 為 \\(\\underline{\\quad\\quad}\\).','sqrt(6)/3'));
  qs.push(fixedQ(9,'$z$ 為 $z^5+z^4+1=0$ 之根，滿足 $|z|=1$ 的所有根之和為 \\(\\underline{\\quad\\quad}\\).','-1'));
  qs.push(fixedQ(10,'空間三直線…若 $L_4$ 與 $L_2,L_3$ 交，則 $a:b:c=\\underline{\\quad\\quad}\\).','4:5:4'));
  qs.push(fixedQ(11,'10 名女生圓桌隨機戴三色帽，每人都有至少一名鄰座與自己同色的機率為 \\(\\underline{\\quad\\quad}\\).','19/2187'));
  qs.push(fixedQ(12,'求 \\( \\left\\lfloor\\tfrac13\\right\\rfloor+\\left\\lfloor\\tfrac{2^2}{3}\\right\\rfloor+\\cdots+\\left\\lfloor\\tfrac{2^{2024}}{3}\\right\\rfloor \\) 的末兩位數。','98'));
  qs.push(fixedQ(13,'求 $1+1$ = ? ','2'));
  state.questions = qs;
}

window.__mountApp = function(){ build(); mount(); };
