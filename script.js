
const names = [];
let angle = 0;
let speed = 0;
let spinning = false;
let decelerating = false;
let timerId = null;
let autoStopTO = null;
const canvas = document.getElementById('wheel');
const ctx = canvas.getContext('2d');

const $ = sel => document.querySelector(sel);
function shuffle(arr) { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[arr[i], arr[j]] = [arr[j], arr[i]]; } }

$('#addBtn').addEventListener('click', addName);
$('#nameInput').addEventListener('keydown', e => { if (e.key === 'Enter') addName(); });
$('#qtyInput').addEventListener('keydown', e => { if (e.key === 'Enter') addName(); });
$('#startBtn').addEventListener('click', startSpin);
$('#stopBtn').addEventListener('click', manualStop);

function addName() {
  const name = $('#nameInput').value.trim();
  let qty = parseInt($('#qtyInput').value, 10) || 1;
  if (!name) return;
  qty = Math.max(1, qty);
  for (let i = 0; i < qty; i++) names.push(name);
  shuffle(names);
  $('#nameInput').value = '';
  $('#qtyInput').value = 1;
  renderList();
  drawWheel();
}

function renderList() {
  const list = $('#nameList');
  list.innerHTML = '';

  const counts = {};
  names.forEach(n => {
    counts[n] = (counts[n] || 0) + 1;
  });


  Object.keys(counts).forEach(n => {
    const b = document.createElement('span');
    b.className = 'badge rounded-pill name-badge text-start';
    b.textContent = `${n} ${counts[n]}x`;
    list.appendChild(b);
  });
}


function drawWheel() {
  const N = names.length;
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  if (N === 0) {
    ctx.fillStyle = '#6b5ba8';
    ctx.beginPath(); ctx.arc(W / 2, H / 2, W / 2 - 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#a78bfa';
    ctx.font = "20px sans-serif";
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('Adicione os Filmes', W / 2, H / 2);
    return;
  }
  const cx = W / 2, cy = H / 2; const r = Math.min(W, H) / 2 - 12;
  const slice = (Math.PI * 2) / N;
  for (let i = 0; i < N; i++) {
    const start = angle + i * slice;
    const end = start + slice;
    ctx.fillStyle = (i % 2 === 0) ? '#8b5cf6' : '#7c3aed';
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, start, end); ctx.closePath(); ctx.fill();
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(start + slice / 2);
    ctx.fillStyle = '#fff'; ctx.textAlign = 'right'; ctx.font = '16px sans-serif';
    ctx.fillText(names[i], r - 10, 0);
    ctx.restore();
  }
  ctx.beginPath(); ctx.fillStyle = '#110d1d'; ctx.arc(cx, cy, 40, 0, Math.PI * 2); ctx.fill();
}

let rafId = 0; let startTs = 0;
function loop() {
  angle = (angle + speed) % (Math.PI * 2);

  if (decelerating) {
    speed *= 0.995;
    if (speed < 0.002) {
      finish();
      return;
    }
  }

  drawWheel();
  rafId = requestAnimationFrame(loop);
}

function startSpin() {
  if (spinning || names.length === 0) return;
  spinning = true; decelerating = false; $('#winner').textContent = '';

  speed = 0.18 + Math.random() * 0.05;
  angle = Math.random() * Math.PI * 2;

  clearInterval(timerId);
  startTs = Date.now();
  timerId = setInterval(() => {
    const t = Math.floor((Date.now() - startTs) / 1000);
    $('#timer').textContent = `00:${String(t).padStart(2, '0')}`;
  }, 1000);

  const s = parseInt($('#autoTime').value, 10);
  if (s > 0) {
    autoStopTO = setTimeout(() => {
      decelerating = true;
      clearInterval(timerId); 
    }, s * 1000);
  }

  cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(loop);
}

function manualStop() {
  if (!spinning) return;
  decelerating = true;
  clearTimeout(autoStopTO);
  clearInterval(timerId);
}

function finish() {
  cancelAnimationFrame(rafId);
  speed = 0; decelerating = false; spinning = false;
  clearInterval(timerId);

  const N = names.length;
  const slice = (Math.PI * 2) / N;
  const a = (Math.PI * 2 - (angle % (Math.PI * 2))) % (Math.PI * 2);
  const idx = Math.floor(a / slice) % N;


  const finalAngle = angle;

  let start = null;
  const duration = 600;
  const bounceSize = 0.05;

  function easeOut(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function animateBounce(ts) {
    if (!start) start = ts;
    const progress = Math.min((ts - start) / duration, 1);
    const eased = easeOut(progress);

  
    const offset = Math.sin(progress * Math.PI) * bounceSize * (1 - eased);
    angle = finalAngle + offset;

    drawWheel();

    if (progress < 1) {
      requestAnimationFrame(animateBounce);
    } else {
    
      angle = finalAngle;
      drawWheel();
      $('#winner').textContent = `🎉 Sorteado: ${names[idx]}`;
    }
  }

  requestAnimationFrame(animateBounce);
}

$('#nameInput').addEventListener('input', showAutocomplete);

function showAutocomplete() {
  const input = $('#nameInput');
  const val = input.value.toLowerCase();
  const list = $('#autocompleteList');
  list.innerHTML = '';

  if (!val) return;


  const uniqueNames = [...new Set(names)];
  const suggestions = uniqueNames.filter(n => n.toLowerCase().includes(val));

  suggestions.slice(0, 5).forEach(s => {
    const div = document.createElement('div');
    div.textContent = s;
    div.addEventListener('click', () => {
      input.value = s;
      list.innerHTML = '';
    });
    list.appendChild(div);
  });
}

document.addEventListener('click', e => {
  if (e.target.id !== 'nameInput') {
    $('#autocompleteList').innerHTML = '';
  }
});

drawWheel();
