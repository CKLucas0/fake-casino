function getBalance() {
  return parseInt(localStorage.getItem("balance") || "1000");
}

function setBalance(val) {
  localStorage.setItem("balance", val);
}
