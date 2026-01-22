let strengthCost = 10;
const SAVE_NAME = "eldenChillSave";
let gameState = {
  runes: {
    banked: 0,
    carried: 0,
  },
  stats: {
    vigor: 10,
    strength: 10,
    critChance: 0.05,
    critDamage: 1.5,
  },

  equipped: [null, null, null],

  inventory: [],

  world: {
    currentBiome: "Nécrolimbe",
    progress: 0,
    isExploring: false,
  },
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
  try {
    localStorage.setItem(SAVE_NAME, JSON.stringify(gameState));
    console.log("Sauvegarde effectuée !");
  } catch (err) {
    console.error("Erreur lors de la sauvegarde :", err);
  }
};

const loadGame = () => {
  const savedData = localStorage.getItem(SAVE_NAME);
  if (savedData) {
    const parsed = JSON.parse(savedData);
    gameState = { ...gameState, ...parsed };
    updateUI();
  }
};

const updateUI = () => {
  // Runes
  document.getElementById("banked-runes").innerText = gameState.runes.banked;
  document.getElementById("carried-runes").innerText = gameState.runes.carried;

  // Statistiques
  document.getElementById("stat-vigor").innerText = gameState.stats.vigor;
  document.getElementById("stat-strength").innerText = gameState.stats.strength;

  // Formatage des critiques
  document.getElementById("stat-crit-chance").innerText =
    (gameState.stats.critChance * 100).toFixed(0) + "%";
  document.getElementById("stat-crit-damage").innerText =
    gameState.stats.critDamage.toFixed(1) + "x";

  // Gestion des slots d'équipement
  gameState.equipped.forEach((item, index) => {
    const slot = document.getElementById(`slot-${index}`);
    slot.innerText = item ? `${item.name} (Lv.${item.level})` : "Vide";
  });
};

const toggleView = (view) => {
  const camp = document.getElementById("camp-view");
  const biome = document.getElementById("biome-view");

  if (view === "biome") {
    camp.style.display = "none";
    biome.style.display = "block";
    gameState.world.isExploring = true;
  } else {
    gameState.runes.banked += gameState.runes.carried;
    gameState.runes.carried = 0;

    camp.style.display = "block";
    biome.style.display = "none";
    gameState.world.isExploring = false;
    saveGame();
  }
  updateUI();
};

setInterval(saveGame, 30000);

window.onload = loadGame;
