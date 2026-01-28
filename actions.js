import { gameState } from "./state.js";
import { saveGame, SAVE_NAME } from "./save.js";
import { updateUI } from "./ui.js";
import { ASHES_OF_WAR } from "./ashes.js";
import { ITEMS } from "./item.js";

const upgradeCosts = {
  vigor: 1,
  strength: 1,
  dexterity: 1.5,
  intelligence: 1.5,
  critChance: 2,
  critDamage: 3,
};

export const equipAsh = (ashId) => {
  gameState.equippedAsh = ashId;
  saveGame();
  updateUI();
};

export const getUpgradeCost = (statName) => {
  const baseCost = upgradeCosts[statName] || 10;
  let count = gameState.stats.level;
  let x = Math.max((count - 11) * 0.02, 0);
  return Math.floor(baseCost * ((x + 0.1) * Math.pow(count + 81, 2) + 1));
};

export const upgradeStat = (statName) => {
  let cost = getUpgradeCost(statName);

  if (statName === "critChance" && gameState.stats.critChance >= 1.0) {
    alert("Votre Chance de Critique est déjà au maximum (100%) !");
    return;
  }

  if (gameState.runes.banked >= cost) {
    gameState.runes.banked -= cost;

    if (statName === "critChance") {
      gameState.stats.critChance += 0.01;
    } else if (statName === "critDamage") {
      gameState.stats.critDamage += 0.1;
    } else {
      gameState.stats[statName] += 1;
    }
    gameState.stats.level++;
    gameState.stats.runesSpent += cost;
    saveGame();
    updateUI();
  } else {
    alert("Pas assez de runes pour renforcer votre lien avec la Grace !");
  }
};

export const refundRunes = () => {
  if (
    confirm(
      "Êtes-vous sûr de vouloir récuperer vos runes ? Vous en perdrez 10%.",
    )
  ) {
    gameState.runes.banked = Math.floor(gameState.runes.banked + gameState.stats.runesSpent * 0.9);
    gameState.stats.runesSpent = 0;
    gameState.stats.level = 0;
    gameState.stats.vigor = 0;
    gameState.stats.strength = 0;
    gameState.stats.dexterity = 0;
    gameState.stats.intelligence = 0;
    gameState.stats.critChance = 0.05;
    gameState.stats.critDamage = 1.5;
    gameState.equipped = { weapon: null, armor: null, accessory: null, };
    gameState.order = [null, null, null],
    saveGame();
    updateUI();
  }
};

export const equipItem = (itemId) => {
  const itemData = ITEMS[itemId];
  if (!itemData) return;

  // Map the item type from the French string to the English key used in the state
  const typeToSlotKey = {
    Arme: "weapon",
    Armure: "armor",
    Accessoire: "accessory",
  };
  const slotKey = typeToSlotKey[itemData.type];

  if (!slotKey) {
    console.error(`Type d'objet inconnu: ${itemData.type}`);
    return;
  }

  const currentlyEquipped = gameState.equipped[slotKey];

  /* ================= UNEQUIP ================= */
  if (currentlyEquipped === itemId) {
    // remove from slot
    gameState.equipped[slotKey] = null;

    // remove from order
    gameState.order = gameState.order.filter(id => id !== itemId);

  } 
  /* ================= EQUIP ================= */
  else {
    // If slot already has an item → remove old item from order
    if (currentlyEquipped) {
      gameState.order = gameState.order.filter(id => id !== currentlyEquipped);
    }

    // Remove item from order if it exists elsewhere (safety)
    gameState.order = gameState.order.filter(id => id !== itemId);

    // Equip item
    gameState.equipped[slotKey] = itemId;

    // Push to order as most recent
    gameState.order.push(itemId);
  }

  // Normalize order array
  gameState.order = gameState.order.filter(Boolean); // remove nulls
  while (gameState.order.length < 3) gameState.order.push(null);
  if (gameState.order.length > 3) gameState.order = gameState.order.slice(0, 3);

  saveGame();
  updateUI();
};



export const resetGame = () => {
  if (
    confirm(
      "Êtes-vous sûr de vouloir tout effacer ? Votre progression sera perdue à jamais.",
    )
  ) {
    localStorage.removeItem(SAVE_NAME);
    location.reload();
  }
};
