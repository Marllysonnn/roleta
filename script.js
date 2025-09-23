// Initialize variables
let roletaAudio = null;
let tickAudio = null;
const names = [];
let angle = 0;
let speed = 0;
let spinning = false;
let decelerating = false;
let timerId = null;
let autoStopTO = null;
let autoStopReached = false;
let isShuffled = false;
let lastSectionIndex = -1;
const canvas = document.getElementById('wheel');
const ctx = canvas.getContext('2d');
const $ = sel => document.querySelector(sel);

// Shuffle function
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

// DOMContentLoaded event listener
window.addEventListener('DOMContentLoaded', () => {
  roletaAudio = document.getElementById('roletaAudio');
  tickAudio = document.getElementById('tickAudio');
  if (tickAudio) {
    tickAudio.volume = 0.7;
  }
  $('#addBtn').addEventListener('click', addName);
  $('#nameInput').addEventListener('keydown', e => { if (e.key === 'Enter') addName(); });
  $('#qtyInput').addEventListener('keydown', e => { if (e.key === 'Enter') addName(); });
  $('#startBtn').addEventListener('click', startSpin);
  $('#stopBtn').addEventListener('click', manualStop);
  $('#exportBtn').addEventListener('click', exportNames);
  $('#importInput').addEventListener('change', importNamesFromFile);
  $('#shuffleBtn').addEventListener('click', toggleShuffle);
  $('#testAudioBtn').addEventListener('click', () => {
    if (roletaAudio) {
      roletaAudio.play().catch(err => {
        console.error('Erro ao reproduzir áudio:', err);
        alert('Não foi possível reproduzir o áudio. Verifique se o arquivo existe e está acessível.');
      });
    }
    if (tickAudio) {
      tickAudio.play().catch(err => {
        console.error('Erro ao reproduzir áudio de clique:', err);
      });
    }
    if (!roletaAudio && !tickAudio) {
      alert('Nenhum elemento de áudio encontrado.');
    }
  });
  function resizeCanvas() {
    const size = canvas.clientWidth;
    canvas.width = size;
    canvas.height = size;
    drawWheel();
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
});

// Film colors object
const filmColors = {};

// Generate random color
function generateRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

// Add name to list
function addName() {
  const name = $('#nameInput').value.trim();
  let qty = parseInt($('#qtyInput').value, 10) || 1;
  if (!name) return;
  qty = Math.max(1, qty);
  if (!filmColors[name]) {
    filmColors[name] = generateRandomColor();
  }
  for (let i = 0; i < qty; i++) names.push(name);
  if (!isShuffled) {
    names.sort();
  } else {
    shuffle(names);
  }
  $('#nameInput').value = '';
  $('#qtyInput').value = 1;
  renderList();
  drawWheel();
}

// Toggle shuffle
function toggleShuffle() {
  if (isShuffled) {
    names.sort();
    $('#shuffleBtn').textContent = 'Embaralhar';
  } else {
    shuffle(names);
    $('#shuffleBtn').textContent = 'Agrupar';
  }
  isShuffled = !isShuffled;
  renderList();
  drawWheel();
}

// Render name list
function renderList() {
  const list = $('#nameList');
  list.innerHTML = '';
  const counts = {};
  names.forEach(n => {
    counts[n] = (counts[n] || 0) + 1;
  });
  Object.keys(counts).forEach(n => {
    const wrapper = document.createElement('div');
    wrapper.className = 'd-flex align-items-center gap-2';
    const b = document.createElement('span');
    b.className = 'badge rounded-pill name-badge text-start flex-grow-1 p-2';
    b.style = "font-size: 15px"
    b.textContent = `${counts[n]}x ${n}`;
    const minusBtn = document.createElement('button');
    minusBtn.className = 'btn btn-sm btn-danger d-flex align-items-center justify-content-center';
    minusBtn.setAttribute('aria-label', `Remover uma ocorrência de ${n}`);
    minusBtn.setAttribute('tabindex', '0');
    minusBtn.innerHTML = '<strong>-</strong>';
    minusBtn.addEventListener('click', () => {
      if (counts[n] === 1) {
        if (!confirm(`Tem certeza que deseja excluir o filme "${n}"?`)) {
          return;
        }
      }
      removeName(n, 1);
    });
    const plusBtn = document.createElement('button');
    plusBtn.className = 'btn btn-sm btn-success d-flex align-items-center justify-content-center';
    plusBtn.setAttribute('aria-label', `Adicionar uma ocorrência de ${n}`);
    plusBtn.setAttribute('tabindex', '0');
    plusBtn.innerHTML = '<strong>+</strong>';
    plusBtn.addEventListener('click', () => {
      names.push(n);
      renderList();
      drawWheel();
    });
    const delBtn = document.createElement('button');
    delBtn.className = 'btn btn-sm btn-outline-danger d-flex align-items-center justify-content-center';
    delBtn.setAttribute('aria-label', `Excluir todas as ocorrências de ${n}`);
    delBtn.setAttribute('tabindex', '0');
    delBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5.5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6zm2 .5a.5.5 0 0 1 .5-.5.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6z"/>
        <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1 0-2h3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3a.5.5 0 0 0 0 1H13.5a.5.5 0 0 0 0-1H2.5z"/>
      </svg>
    `;
    delBtn.addEventListener('click', () => {
      if (!confirm(`Tem certeza que deseja excluir todas as ocorrências de "${n}"?`)) {
        return;
      }
      removeName(n, counts[n]);
    });
    const actions = document.createElement('div');
    actions.className = 'name-actions';
    actions.appendChild(minusBtn);
    actions.appendChild(plusBtn);
    actions.appendChild(delBtn);
    wrapper.appendChild(b);
    wrapper.appendChild(actions);
    list.appendChild(wrapper);
  });
}

// Remove name from list
function removeName(name, qty = 1) {
  let removed = 0;
  for (let i = names.length - 1; i >= 0 && removed < qty; i--) {
    if (names[i] === name) {
      names.splice(i, 1);
      removed++;
    }
  }
  renderList();
  drawWheel();
}

// Get text color based on background
function getTextColor(backgroundColor) {
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

// Draw the wheel
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
  const cx = W / 2, cy = H / 2;
  const r = Math.min(W, H) / 2 - 12;
  const slice = (Math.PI * 2) / N;
  const baseFontSize = 16;
  const minFontSize = 10;
  const maxFontSize = 18;
  const fontSize = Math.max(minFontSize, Math.min(maxFontSize, baseFontSize * (12 / Math.max(1, N))));
  const maxNameLength = 15;

  for (let i = 0; i < N; i++) {
    const start = angle + i * slice;
    const end = start + slice;
    const backgroundColor = filmColors[names[i]];
    ctx.fillStyle = backgroundColor;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, start, end); ctx.closePath(); ctx.fill();
    const textColor = getTextColor(backgroundColor);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(start + slice / 2);
    ctx.fillStyle = textColor;
    ctx.textAlign = 'right';
    ctx.font = `${fontSize}px sans-serif`;
    let displayName = names[i];
    if (displayName.length > maxNameLength) {
      displayName = displayName.substring(0, maxNameLength - 3) + '...';
    }
    ctx.fillText(displayName, r - 10, 0);
    ctx.restore();
  }
  ctx.beginPath(); ctx.fillStyle = '#110d1d'; ctx.arc(cx, cy, 40, 0, Math.PI * 2); ctx.fill();
}

// Export names to .txt
function exportNames() {
  if (!names.length) {
    alert('Nenhum filme para exportar!');
    return;
  }
  const content = names.join('\n');
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'roleta-filmes.txt';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

// Import names from .txt
function importNamesFromFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(evt) {
    const lines = evt.target.result.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (!lines.length) {
      alert('Arquivo vazio ou inválido.');
      return;
    }
    names.length = 0;
    lines.forEach(n => {
      names.push(n);
      if (!filmColors[n]) {
        filmColors[n] = generateRandomColor();
      }
    });
    renderList();
    drawWheel();
    alert('Lista importada!');
  };
  reader.readAsText(file);
  e.target.value = '';
}

// Start spin
function startSpin() {
  if (spinning || names.length === 0) return;
  spinning = true;
  decelerating = false;
  lastSectionIndex = -1;
  if (roletaAudio) {
    roletaAudio.volume = 1;
    roletaAudio.play().catch(err => {
      console.error('Erro ao reproduzir áudio:', err);
    });
  }
  speed = 0.1 + Math.random() * 0.03;
  angle = Math.random() * Math.PI * 2;
  clearInterval(timerId);
  startTs = Date.now();
  timerId = setInterval(() => {
    const t = Math.floor((Date.now() - startTs) / 1000);
    $('#timer').textContent = `00:${String(t).padStart(2, '0')}`;
  }, 1000);
  let s = parseInt($('#autoTime').value, 10);
  if (isNaN(s) || s <= 0) {
    s = 15;
  }
  autoStopTO = setTimeout(() => {
    autoStopReached = true;
    decelerating = true;
    clearInterval(timerId);
  }, s * 1000);
  cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(loop);
}

// Animation loop
let rafId = 0; let startTs = 0;
function loop() {
  angle = (angle + speed) % (Math.PI * 2);
  if (spinning && names.length > 0) {
    const N = names.length;
    const slice = (Math.PI * 2) / N;
    const normalizedAngle = (Math.PI * 2 - (angle % (Math.PI * 2))) % (Math.PI * 2);
    const currentSectionIndex = Math.floor(normalizedAngle / slice) % N;
    if (currentSectionIndex !== lastSectionIndex && lastSectionIndex !== -1) {
      if (tickAudio) {
        tickAudio.currentTime = 0;
        tickAudio.play().catch(err => {
          console.error('Erro ao reproduzir áudio de clique:', err);
        });
      }
    }
    lastSectionIndex = currentSectionIndex;
  }
  if (decelerating) {
    speed *= 0.996;
    if (speed < 0.002) {
      finish();
      return;
    }
  }
  drawWheel();
  rafId = requestAnimationFrame(loop);
}

// Manual stop
function manualStop() {
  if (!spinning) return;
  decelerating = true;
  clearTimeout(autoStopTO);
  clearInterval(timerId);
}

// Finish spin with fade-out
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
  const duration = 400;
  const bounceSize = 0.05;

  // Audio fade-out
  if (roletaAudio && !roletaAudio.paused) {
    const fadeDuration = 2000;
    const fadeDelay = 1000;
    const fadeSteps = 20;
    const fadeInterval = fadeDuration / fadeSteps;
    let currentStep = 0;

    setTimeout(() => {
      const fadeOut = setInterval(() => {
        if (currentStep >= fadeSteps || !roletaAudio) {
          clearInterval(fadeOut);
          if (roletaAudio) {
            roletaAudio.pause();
            roletaAudio.currentTime = 0;
            roletaAudio.volume = 1;
          }
          return;
        }
        roletaAudio.volume = Math.max(0, 1 - (currentStep / fadeSteps));
        currentStep++;
      }, fadeInterval);
    }, fadeDelay);
  }

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
      document.getElementById("winnerName").textContent = names[idx];
      document.getElementById("winnerModal").classList.remove("d-none");
      launchConfetti();
    }
  }

  requestAnimationFrame(animateBounce);
}

// Launch confetti
function launchConfetti() {
  const confettiColors = ["#a78bfa", "#7c3aed", "#22c55e", "#fbbf24", "#f472b6", "#38bdf8", "#fff"];
  const container = document.getElementById("confettiContainer");
  if (!container) return;
  container.innerHTML = "";
  const confettiCount = 50;
  for (let i = 0; i < confettiCount; i++) {
    const conf = document.createElement("div");
    conf.className = "confetti";
    conf.style.left = Math.random() * 95 + "%";
    conf.style.background = confettiColors[Math.floor(Math.random() * confettiColors.length)];
    conf.style.animationDelay = (Math.random() * 1.2) + "s";
    conf.style.transform = `rotate(${Math.random()*360}deg)`;
    container.appendChild(conf);
  }
  setTimeout(() => { container.innerHTML = ""; }, 3200);
}

// Autocomplete
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

document.getElementById("closeWinner").addEventListener("click", () => {
  document.getElementById("winnerModal").classList.add("d-none");
});
document.querySelector(".winner-backdrop").addEventListener("click", () => {
  document.getElementById("winnerModal").classList.add("d-none");
});

function reset() {
  names.length = 0;
  $('#nameInput').value = '';
  $('#qtyInput').value = 1;
  clearTimeout(autoStopTO);
  autoStopTO = null;
  angle = 0;
  speed = 0;
  spinning = false;
  decelerating = false;
  lastSectionIndex = -1;
  $('#nameList').innerHTML = '';
  $('#timer').textContent = '00:00';
  drawWheel();
  cancelAnimationFrame(rafId);
  clearInterval(timerId);
  document.getElementById("winnerModal").classList.add("d-none");
  if (roletaAudio) {
    roletaAudio.pause();
    roletaAudio.currentTime = 0;
    roletaAudio.volume = 1;
  }
  if (tickAudio) {
    tickAudio.pause();
    tickAudio.currentTime = 0;
  }
}

drawWheel();