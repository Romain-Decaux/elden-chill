import { gameState, getEffectiveStats, runtimeState } from "./state.js";

export const ASHES_OF_WAR = {
  beginer_tarnished_heal: {
    name: "Soin du Sans-Éclat",
    description: "Restaure 150PV. +1 utilisation si vous avez battu un troll",
    maxUses: gameState.world.unlockedBiomes.includes("limgrave_west") ? 3 : 2,
    effect: (stats, enemy) => {
      const healAmount = 150;
      const maxHp = getHealth(getEffectiveStats().vigor);

      runtimeState.playerCurrentHp = Math.min(
        maxHp,
        runtimeState.playerCurrentHp + healAmount,
      );

      return {
        msg: "Vous récupérez 150PV",
      };
    },
  },
  storm_stomp: {
    name: "Piétinement Tempétueux",
    description:
      "Augmente vos dégats légèrement et étourdit l'ennemi au prochain coup.",
    maxUses: 2,
    effect: (stats, enemy) => {
      return {
        damageMult: 1.2,
        status: { id: "STUN", duration: 1 },
        msg: "La tempête déséquilibre l'ennemi !",
      };
    },
  },
  bloody_slash: {
    name: "Entaille Sanglante",
    description:
      "Sacrifie 100 PV pour infliger d'énormes dégâts (x2.5) et 3 saignements.",
    maxUses: 3,
    effect: (stats, enemy) => {
      runtimeState.playerCurrentHp -= 100;
      return {
        damageMult: 2.5,
        status: { id: "BLEED", duration: 3 },
        msg: "Une entaille sanglante déchire l'air !",
      };
    },
  },
};
