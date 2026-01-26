import { gameState, setGameState } from "./state.js";
import { updateUI } from "./ui.js";

export const SAVE_NAME = "eldenChillSave";

const encodeSave = (data) => {
  const jsonString = JSON.stringify(data);
  const base64 = btoa(unescape(encodeURIComponent(jsonString)));
  return base64.split("").reverse().join("");
};

const decodeSave = (encodedData) => {
  try {
    const reversed = encodedData.split("").reverse().join("");
    const jsonString = decodeURIComponent(escape(atob(reversed)));
    return JSON.parse(jsonString);
  } catch (err) {
    console.error("Erreur de décodage de la sauvegarde :", err);
    return null;
  }
};

export const saveGame = () => {
  try {
    const secretString = encodeSave(gameState);
    localStorage.setItem(SAVE_NAME, secretString);
    console.log("Sauvegarde cryptée effectuée !");
  } catch (err) {
    console.error("⚠️ Sauvegarde corrompue ou modifiée illégalement : ", err);
  }
};

export const loadGame = () => {
  const savedData = localStorage.getItem(SAVE_NAME);
  if (savedData) {
    const decrypted = decodeSave(savedData);
    if (decrypted) {
      // 1. Initialisation des objets s'ils sont absents pour éviter les plantages
      decrypted.world = decrypted.world || { unlockedBiomes: ["necrolimbe"] };
      decrypted.runes = decrypted.runes || { banked: 0, carried: 0 };
      decrypted.inventory = decrypted.inventory || [];

      // 2. Migration structurelle (ton code existant)
      if (decrypted.equipped && Array.isArray(decrypted.equipped)) {
        console.warn(
          "Ancienne structure détectée, réinitialisation de l'équipement.",
        );
        decrypted.equipped = { weapon: null, armor: null, accessory: null };
      }

      // 3. Reset forcé de l'état d'expédition pour éviter le soft-lock
      decrypted.world.isExploring = false;
      decrypted.runes.carried = 0;

      // 4. On applique l'état et on SAUVEGARDE tout de suite sur le disque
      setGameState(decrypted);
      saveGame(); // Force l'écriture de "isExploring: false" dans le localStorage
    }
  }
  updateUI();
};
