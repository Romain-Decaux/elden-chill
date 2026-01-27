import { ASHES_OF_WAR } from "./ashes.js";
import { STATUS_EFFECTS } from "./status.js";
import { ITEMS } from "./item.js";
import { handleDeath, handleVictory } from "./core.js";
import {
  gameState,
  getEffectiveStats,
  runtimeState,
  getHealth,
} from "./state.js";
import {
  ActionLog,
  formatNumber,
  triggerShake,
  updateHealthBars,
  updateUI,
} from "./ui.js";

/* ================= HELPERS ================= */

function getEntityHp(entity) {
  if ("currentHp" in entity) return entity.currentHp;
  if ("hp" in entity) return entity.hp;
  return 0;
}

function setEntityHp(entity, value) {
  if ("currentHp" in entity) entity.currentHp = value;
  else if ("hp" in entity) entity.hp = value;
}

function getMonsterArmor(monster) {
  if (monster && typeof monster.armor === "number") return monster.armor;
  return 100;
}

function clamp(v, min = 0) {
  return Math.max(min, v);
}

/* ================= STATUS EFFECTS ================= */

export const applyEffect = (targetEffects, effectId, duration) => {
  const existing = targetEffects.find((e) => e.id === effectId);
  if (existing) existing.duration = Math.max(existing.duration, duration);
  else targetEffects.push({ id: effectId, duration });
};

const processTurnEffects = (entity, effectsArray) => {
  let logMessages = [];
  let skipTurn = false;

  for (let i = effectsArray.length - 1; i >= 0; i--) {
    const effectRef = effectsArray[i];
    const effectData = STATUS_EFFECTS[effectRef.id];

    if (effectData.onTurnStart) {
      const result = effectData.onTurnStart(entity);
      if (result?.message) logMessages.push(result.message);
      if (result?.skipTurn) skipTurn = true;
    }

    effectRef.duration--;
    if (effectRef.duration <= 0) effectsArray.splice(i, 1);
  }

  return { logMessages, skipTurn };
};

/* ================= GENERIC ATTACK ================= */

export function performAttack({
  attackers,
  target,
  targetGroup,
  stats,
  targetEffects,
  logPrefix,
  isPlayer = false,
  ashEffect = null,
}) {
  attackers.forEach((attacker) => {

    /* ===== BASE DAMAGE ===== */
    let baseDamage = attacker.atk ?? stats?.strength ?? 0;

    if (ashEffect?.damageMult) baseDamage *= ashEffect.damageMult;

    let isCrit = false;
    if (stats?.critChance && Math.random() < stats.critChance) {
      isCrit = true;
      baseDamage *= stats.critDamage;
    }

    baseDamage = Math.max(0, baseDamage);

    /* ================= ARMOR SYSTEM ================= */

    let armor;

    if (isPlayer) {
      /* PLAYER ATTACKING MONSTER */
      const monsterArmor = getMonsterArmor(target);
      const playerPercentPen = stats?.percentDamagePenetration ?? 0;
      const playerFlatPen = stats?.flatDamagePenetration ?? 0;

      armor = monsterArmor;
      armor *= (1 - playerPercentPen);
      armor -= playerFlatPen;

    } else {
      /* MONSTER ATTACKING PLAYER */
      const playerFlatRed = stats?.flatDamageReduction ?? 0;
      const playerPercentRed = stats?.percentDamageReduction ?? 0;

      const monsterPercentPen = attacker.percentDamagePenetration ?? 0;
      const monsterFlatPen = attacker.flatDamagePenetration ?? 0;

      armor = 100;
      armor += playerFlatRed;
      armor *= (1 + playerPercentRed);
      armor *= (1 - monsterPercentPen);
      armor -= monsterFlatPen;
    }

    armor = clamp(armor, 1); // avoid division by 0

    const damageMultiplier = 100 / armor;

    let finalDamage = Math.floor(baseDamage * damageMultiplier);
    finalDamage = Math.max(0, finalDamage);

    /* ===== APPLY DAMAGE ===== */
    setEntityHp(target, getEntityHp(target) - finalDamage);
    updateHealthBars();

    ActionLog(
      `${logPrefix} ${isPlayer ? "infligez" : "frappe"} ${formatNumber(finalDamage)} dégâts ${isCrit ? "CRITIQUES !" : "."}`,
      isCrit ? "log-crit" : ""
    );

    /* ================= PHASE CHECK ================= */
    if (target?.hasSecondPhase && !target.isInSecondPhase) {
      const maxHp = target.maxHp ?? target.hp;
      const hpRatio = getEntityHp(target) / maxHp;

      if (hpRatio <= target.thresholdForPhase2) {
        target.isInSecondPhase = true;

        if (target.dmgMultPhase2 && target.atk) {
          target.atk *= target.dmgMultPhase2;
        }

        if (target.flavorTextPhase2) {
          ActionLog(target.flavorTextPhase2, "log-flavor-orange");
        }
      }
    }

    /* ===== SPLASH ===== */
    const splash = stats?.splashDamage ?? 0;
    if (splash > 0 && targetGroup?.length > 1) {
      for (let i = 1; i < targetGroup.length; i++) {
        targetGroup[i].hp -= splash;
      }

      ActionLog(
        `${logPrefix} inflige ${formatNumber(splash)} dégâts de zone au reste du groupe de ${targetGroup[0].name}.`
      );
    }

    /* ===== TARGET EFFECT REACTIONS ===== */
    targetEffects.forEach((eff) => {
      const effectData = STATUS_EFFECTS[eff.id];
      if (effectData.onBeingHit) {
        const result = effectData.onBeingHit(attacker, target, finalDamage);
        if (result?.message) ActionLog(result.message, "log-warning");
      }
    });

    /* ===== PLAYER ITEMS ===== */
    if (isPlayer) {
      Object.values(gameState.equipped).forEach((itemId) => {
        const item = ITEMS[itemId];
        if (item?.onHitEffect) {
          const { id, duration, chance } = item.onHitEffect;
          if (Math.random() < chance) {
            applyEffect(targetEffects, id, duration);
            ActionLog(`Vous appliquez ${duration} ${STATUS_EFFECTS[id].name} à l'ennemi !`, "log-warning");
          }
        }
      });
    }

  });
}

/* ================= COMBAT LOOP ================= */

export const combatLoop = (sessionId) => {
  if (!gameState.world.isExploring) return;
  if (sessionId !== runtimeState.currentCombatSession) return;

  const playerObj = {
    name: "Vôtre héro",
    currentHp: runtimeState.playerCurrentHp,
    maxHp: getHealth(gameState.stats.vigor),
  };

  setTimeout(() => {
    const playerStatus = processTurnEffects(playerObj, gameState.playerEffects);
    runtimeState.playerCurrentHp = playerObj.currentHp;

    if (playerStatus.logMessages.length)
      playerStatus.logMessages.forEach((msg) => ActionLog(msg, "log-warning"));

    if (runtimeState.playerCurrentHp <= 0) {
      handleDeath();
      return;
    }

    /* ================= PLAYER TURN ================= */

    if (!playerStatus.skipTurn) {
      const stats = getEffectiveStats();

      let ashEffect = null;
      if (runtimeState.ashIsPrimed && runtimeState.ashUsesLeft > 0) {
        const ash = ASHES_OF_WAR[gameState.equippedAsh];
        ashEffect = ash.effect(stats, runtimeState.currentEnemyGroup[0]);
        runtimeState.ashUsesLeft--;
        runtimeState.ashIsPrimed = false;
        ActionLog(`CENDRE : ${ash.name} activée !`, "log-ash-activation");
        if (ashEffect.msg) ActionLog(ashEffect.msg, "log-status");
      }

      for (let i = 0; i < stats.attacksPerTurn; i++) {
        performAttack({
          attackers: [{ atk: stats.strength }],
          target: runtimeState.currentEnemyGroup[0],
          targetGroup: runtimeState.currentEnemyGroup,
          stats,
          targetEffects: gameState.ennemyEffects,
          logPrefix: "Vous",
          isPlayer: true,
          ashEffect,
        });
      }
    }

    /* ================= KILL CHECK ================= */

    let defeated = [];
    for (let i = runtimeState.currentEnemyGroup.length - 1; i >= 0; i--) {
      const e = runtimeState.currentEnemyGroup[i];
      if (e.hp <= 0) {
        defeated.push(e);
        runtimeState.currentEnemyGroup.splice(i, 1);
      }
    }

    if (defeated.length) {
      const eff = getEffectiveStats();
      const intBonus = 1 + eff.intelligence / 100;

      defeated.forEach((enemy) => {
        const runes = Math.floor(enemy.runes * intBonus);
        gameState.runes.carried += runes;
        ActionLog(`${enemy.name} a été vaincu ! (+${formatNumber(runes)} runes)`, "log-runes");
      });
    }

    /* ================= VICTORY ================= */

    if (runtimeState.currentEnemyGroup.length === 0) {
      runtimeState.lastDefeatedEnemy = defeated[defeated.length - 1] || null;
      setTimeout(() => handleVictory(sessionId), 500);
      return;
    }

    /* ================= GROUP MESSAGE ================= */

    if (defeated.length > 0) {
      const counts = {};
      runtimeState.currentEnemyGroup.forEach(e => {
        counts[e.name] = (counts[e.name] || 0) + 1;
      });

      const parts = Object.entries(counts).map(([name, count]) => `${count} ${name}`);
      let msg = "Il reste encore ";

      if (parts.length === 1) msg += parts[0];
      else if (parts.length === 2) msg += parts.join(" et ");
      else msg += parts.slice(0, -1).join(", ") + ", et " + parts[parts.length - 1];

      msg += " !";
      ActionLog(msg);
    }

    updateHealthBars();
    updateUI();

    /* ================= ENEMY TURN ================= */

    setTimeout(() => {
      if (sessionId !== runtimeState.currentCombatSession || !gameState.world.isExploring) return;

      const enemyStatus = processTurnEffects(runtimeState.currentEnemyGroup[0], gameState.ennemyEffects);

      if (enemyStatus.logMessages.length)
        enemyStatus.logMessages.forEach((msg) => ActionLog(msg, "log-status"));

      if (!enemyStatus.skipTurn) {
        const stats = getEffectiveStats();
        const dodgeChance = Math.min(0.5, stats.dexterity / 500);

        if (Math.random() < dodgeChance) {
          ActionLog("ESQUIVE ! Vous évitez le coup.", "log-dodge");
          setTimeout(() => combatLoop(sessionId), 500);
          return;
        }

        performAttack({
          attackers: runtimeState.currentEnemyGroup,
          target: {
            name: playerObj.name,
            get currentHp() { return runtimeState.playerCurrentHp; },
            set currentHp(v) { runtimeState.playerCurrentHp = v; }
          },
          stats,
          targetEffects: gameState.playerEffects,
          logPrefix: runtimeState.currentEnemyGroup[0].name,
          isPlayer: false,
        });

        if (runtimeState.currentEnemyGroup[0].atk > getHealth(stats.vigor) * 0.15) triggerShake();

        updateHealthBars();
        updateUI();
      }

      if (runtimeState.playerCurrentHp <= 0) handleDeath();
      else setTimeout(() => combatLoop(sessionId), 500);

    }, 800);
  }, 800);
};
