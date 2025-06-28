function getBalance() {
  return parseInt(localStorage.getItem("blackjackBalance") || "1000");
}

function setBalance(val) {
  localStorage.setItem("blackjackBalance", val);
}
