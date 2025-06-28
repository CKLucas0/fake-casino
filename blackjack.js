// BALANS OPSLAAN/OPHALEN
function getBalance() {
  let bal = localStorage.getItem('blackjackBalance');
  return bal ? parseInt(bal) : 1000; // start met 1000 als geen saldo
}

function setBalance(val) {
  localStorage.setItem('blackjackBalance', val);
  balance = val;
  document.getElementById('balance').textContent = balance;
}

// SPELVARIABELEN
let deck = [], dealerHand = [];
let playerHands = [];
let currentHandIndex = 0;
let bets = [];
let balance = getBalance();
let gameInProgress = false;

// INIT DISPLAY BALANS
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('balance').textContent = balance;

  // Knoppen starten uitgeschakeld behalve deal
  ['hit-btn', 'stand-btn', 'double-btn', 'split-btn'].forEach(id => {
    document.getElementById(id).disabled = true;
  });

  // Eventlisteners
  document.getElementById('deal-btn').addEventListener('click', startGame);
  document.getElementById('hit-btn').addEventListener('click', hit);
  document.getElementById('stand-btn').addEventListener('click', stand);
  document.getElementById('double-btn').addEventListener('click', doubleDown);
  document.getElementById('split-btn').addEventListener('click', splitHand);
  document.getElementById('back-btn').addEventListener('click', goBack);
});

// --- SPELFUNCTIES ---

function createDeck() {
  const suits = ['♠','♥','♦','♣'];
  const vals = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
  deck = [];
  for (let s of suits) for (let v of vals) deck.push({v,s});
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
}

function drawCard() {
  if (deck.length === 0) createDeck();
  return deck.pop();
}

function getHandValue(hand) {
  let val = 0, aces = 0;
  for (let c of hand) {
    if (['J','Q','K'].includes(c.v)) val += 10;
    else if (c.v === 'A') { val += 11; aces++; }
    else val += parseInt(c.v);
  }
  while (val > 21 && aces > 0) {
    val -= 10;
    aces--;
  }
  return val;
}

function canSplitCards(card1, card2) {
  const tens = ['10','J','Q','K'];
  if (card1.v === card2.v) return true;
  if (tens.includes(card1.v) && tens.includes(card2.v)) return true;
  return false;
}

function updateDisplay(hideDealer = true) {
  const dealerHtml = dealerHand.map((c, i) =>
    i === 0 && hideDealer ? `<span class="card">??</span>` : `<span class="card">${c.v}${c.s}</span>`
  ).join('') + (hideDealer ? '' : ` (${getHandValue(dealerHand)})`);
  document.getElementById('dealer-hand').innerHTML = dealerHtml;

  const container = document.getElementById('player-hands');
  container.innerHTML = '';

  playerHands.forEach((hand, i) => {
    const div = document.createElement('div');
    div.className = 'hand' + (i === currentHandIndex ? ' active' : '');
    const value = getHandValue(hand);
    const cardsHtml = hand.map(c => `<span class="card">${c.v}${c.s}</span>`).join('');
    const title = i === currentHandIndex ? `<strong>➡️ Hand ${i + 1}</strong>` : `Hand ${i + 1}`;
    div.innerHTML = `${title}<br>${cardsHtml} (${value})`;
    container.appendChild(div);
  });

  updateButtons();
  document.getElementById("balance").textContent = balance;
}

function updateButtons() {
  if (!gameInProgress) {
    ['hit-btn', 'stand-btn', 'double-btn', 'split-btn'].forEach(id => {
      document.getElementById(id).disabled = true;
    });
    document.getElementById('deal-btn').disabled = false;
    document.getElementById('bet').disabled = false;
    return;
  }

  const hand = playerHands[currentHandIndex];
  const canDoubleDown = hand.length === 2 && balance >= bets[currentHandIndex];
  const canSplit = hand.length === 2 &&
    canSplitCards(hand[0], hand[1]) &&
    balance >= bets[currentHandIndex] &&
    playerHands.length < 4;

  document.getElementById('hit-btn').disabled = false;
  document.getElementById('stand-btn').disabled = false;
  document.getElementById('double-btn').disabled = !canDoubleDown;
  document.getElementById('split-btn').disabled = !canSplit;
  document.getElementById('deal-btn').disabled = true;
  document.getElementById('bet').disabled = true;
}

function startGame() {
  const initialBet = parseInt(document.getElementById('bet').value);
  if (isNaN(initialBet) || initialBet < 1 || initialBet > balance) {
    alert('Ongeldige inzet.');
    return;
  }

  gameInProgress = true;
  createDeck();
  dealerHand = [drawCard(), drawCard()];
  playerHands = [[drawCard(), drawCard()]];
  bets = [initialBet];
  currentHandIndex = 0;

  balance -= initialBet;
  setBalance(balance);
  document.getElementById('message').textContent = `Hand 1: Jouw beurt...`;

  updateDisplay();
}

function hit() {
  playerHands[currentHandIndex].push(drawCard());
  updateDisplay();

  if (getHandValue(playerHands[currentHandIndex]) > 21) {
    document.getElementById('message').textContent = `Hand ${currentHandIndex + 1} bust!`;
    nextHand();
  }
}

function stand() {
  nextHand();
}

function doubleDown() {
  if (balance < bets[currentHandIndex]) return;
  balance -= bets[currentHandIndex];
  bets[currentHandIndex] *= 2;
  setBalance(balance);

  playerHands[currentHandIndex].push(drawCard());
  updateDisplay();
  nextHand();
}

function splitHand() {
  const hand = playerHands[currentHandIndex];
  if (hand.length !== 2 || !canSplitCards(hand[0], hand[1])) return;
  if (balance < bets[currentHandIndex]) return;

  balance -= bets[currentHandIndex];
  setBalance(balance);

  const card1 = hand[0];
  const card2 = hand[1];

  playerHands[currentHandIndex] = [card1, drawCard()];
  playerHands.splice(currentHandIndex + 1, 0, [card2, drawCard()]);
  bets.splice(currentHandIndex + 1, 0, bets[currentHandIndex]);

  updateDisplay();
  document.getElementById('message').textContent = `Hand ${currentHandIndex + 1} gesplitst.`;
}

function nextHand() {
  if (currentHandIndex < playerHands.length - 1) {
    currentHandIndex++;
    document.getElementById('message').textContent = `Hand ${currentHandIndex + 1}: Jouw beurt...`;
    updateDisplay();
  } else {
    dealerPlay();
  }
}

function dealerPlay() {
  document.getElementById('message').textContent = 'Dealer aan zet...';
  updateDisplay(false);

  while (getHandValue(dealerHand) < 17) {
    dealerHand.push(drawCard());
    updateDisplay(false);
  }

  checkResults();
}

function checkResults() {
  const dealerVal = getHandValue(dealerHand);
  let totalWin = 0;
  let msg = '';

  playerHands.forEach((hand, i) => {
    const val = getHandValue(hand);
    let bet = bets[i];
    if (val > 21) {
      msg += `Hand ${i+1} verloren (bust).<br>`;
    } else if (dealerVal > 21 || val > dealerVal) {
      totalWin += bet * 2;
      msg += `Hand ${i+1} gewonnen! (+${bet * 2} euro)<br>`;
    } else if (val === dealerVal) {
      totalWin += bet;
      msg += `Hand ${i+1} gelijkspel. (+${bet} euro terug)<br>`;
    } else {
      msg += `Hand ${i+1} verloren.<br>`;
    }
  });

  balance += totalWin;
  setBalance(balance);

  document.getElementById('message').innerHTML = msg;
  gameInProgress = false;
  updateDisplay(false);
}

function goBack() {
  window.location.href = 'index.html'; 

}
