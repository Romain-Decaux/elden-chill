let strengthCost = 10;
let player = {
  runes: 0,
  level: 1,
  vigor: 10,
  strength: 10,
  inventory: [],
};

const buyStrength = () => {
  if (player.runes >= strengthCost) {
    player.runes -= strengthCost;
    player.strength += 5;
    strengthCost = Math.floor(strengthCost * 1.5);

    saveGame();
    updateUI();
  } else {
    alert("Pas assez de runes !");
  }
};

const saveGame = () => {
  localStorage.setItem("eldenChillSave", JSON.stringify(player));
  console.log("Sauvegarde effectuée !");
};

const loadGame = () => {
  const savedData = localStorage.getItem("eldenChillSave");
  if (savedData) {
    player = JSON.parse(savedData);
    updateUI();
  }
};

const collectRunes = () => {
  player.runes += player.strength;
  updateUI();
};

const updateUI = () => {
  document.getElementById("rune-count").innerText = player.runes;
  document.getElementById("level").innerText = player.level;
  document.getElementById("strength").innerText = player.strength;
  document.getElementById("str-cost").innerText = strengthCost;

  if (player.runes >= strengthCost) {
    document.getElementById("buy-str").disabled = false;
  } else {
    document.getElementById("buy-str").disabled = true;
  }
};

setInterval(saveGame, 30000);

window.onload = loadGame;
