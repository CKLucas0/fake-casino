// mines.js

const balanceEl = document.getElementById('mines-balance');
const minesCountInput = document.getElementById('minesCount');
const betAmountInput = document.getElementById('betAmount');
const startBtn = document.getElementById('startMines');
const cashOutBtn = document.getElementById('cashOut');
const gridEl = document.getElementById('grid');
const messageEl = document.getElementById('message');

const GRID_SIZE = 25; // 5x5 grid

let gameState = {
  active: false,
  minesCount: 5,
  bet: 100,
  revealedPositions: new Set(),
  minesPositions: new Set()
};

function getBalance() {
  let bal = localStorage.getItem('balance');
  if (bal === null) {
    bal = 1000; // start saldo
    localStorage.setItem('balance', bal);
  }
  return Number(bal);
}

function setBalance(value) {
  localStorage.setItem('balance', value);
}

function updateBalanceDisplay() {
  balanceEl.textContent = getBalance();
}

function createGrid() {
  gridEl.innerHTML = '';
  for (let i = 0; i < GRID_SIZE; i++) {
    const cell = document.createElement('div');
    cell.classList.add('cell');
    cell.dataset.index = i;
    gridEl.appendChild(cell);
  }
}

function placeMines(minesCount) {
  const mines = new Set();
  while (mines.size < minesCount) {
    mines.add(Math.floor(Math.random() * GRID_SIZE));
  }
  return mines;
}

function calculateMultiplier() {
  // Exponentiële multiplier: base^(aantal safe clicks)
  const safeClicks = gameState.revealedPositions.size;
  const base = 25 / (25 - gameState.minesCount);
  return Math.pow(base, safeClicks);
}

function calculateWinnings() {
  return Math.floor(gameState.bet * calculateMultiplier());
}

function updateMultiplierMessage() {
  const multiplier = calculateMultiplier();
  messageEl.textContent = `Multiplier: x${multiplier.toFixed(2)} — Klik een veilig vakje of cash uit!`;
}

function revealAllMines() {
  gameState.minesPositions.forEach(pos => {
    const cell = gridEl.querySelector(`[data-index='${pos}']`);
    if (cell) {
      cell.classList.add('mine', 'revealed');
      cell.textContent = '💣';
    }
  });
}

function endGame(won, winnings = null) {
  gameState.active = false;
  revealAllMines();

  if (won) {
    if (winnings === null) {
      winnings = calculateWinnings();
    }
    messageEl.textContent = `Gefeliciteerd! Je cashte uit met €${winnings}.`;
    setBalance(getBalance() + winnings);
  } else {
    messageEl.textContent += ` Probeer opnieuw!`;
  }

  updateBalanceDisplay();
  startBtn.disabled = false;
  cashOutBtn.disabled = true;
  minesCountInput.disabled = false;
  betAmountInput.disabled = false;
}


function startGame() {
  const bet = parseInt(betAmountInput.value);
  const minesCount = parseInt(minesCountInput.value);

  if (isNaN(bet) || bet < 1) {
    alert('Voer een geldige inzet in!');
    return;
  }
  if (bet > getBalance()) {
    alert('Onvoldoende saldo!');
    return;
  }
  if (isNaN(minesCount) || minesCount < 1 || minesCount > 24) {
    alert('Aantal mijnen moet tussen 1 en 24 zijn!');
    return;
  }

  gameState.bet = bet;
  gameState.minesCount = minesCount;
  gameState.active = true;
  gameState.revealedPositions.clear();

  setBalance(getBalance() - bet);
  updateBalanceDisplay();

  createGrid();
  gameState.minesPositions = placeMines(minesCount);

  messageEl.textContent = `Spel gestart! Klik een vakje.`;
  updateMultiplierMessage();

  startBtn.disabled = true;
  cashOutBtn.disabled = false;
  minesCountInput.disabled = true;
  betAmountInput.disabled = true;
}

function onCellClick(e) {
  if (!gameState.active) return;
  const cell = e.target;
  if (!cell.classList.contains('cell')) return;

  const index = Number(cell.dataset.index);
  if (gameState.revealedPositions.has(index)) return;

  if (gameState.minesPositions.has(index)) {
    // Je hebt een mijn geraakt -> verlies
    cell.classList.add('mine', 'revealed');
    cell.textContent = '💣';
    endGame(false);
    return;
  }

  // Veilig vakje
  cell.classList.add('revealed');
  gameState.revealedPositions.add(index);
  updateMultiplierMessage();

  // Check of alle veilige vakjes zijn onthuld (winst)
  if (gameState.revealedPositions.size === GRID_SIZE - gameState.minesCount) {
    endGame(true);
  }
}

function cashOut() {
  if (!gameState.active) return;
  const winnings = calculateWinnings();  // hele winst pakken, geen /2
  endGame(true, winnings);
}



// Event listeners
startBtn.addEventListener('click', startGame);
cashOutBtn.addEventListener('click', cashOut);
gridEl.addEventListener('click', onCellClick);

// Init
updateBalanceDisplay();
createGrid();
