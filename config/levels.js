import { QuickDB } from "quick.db";
const db = new QuickDB();

export const roleRewards = [
  { level: 10, roleId: "1339902720546439189", bonus: 0.05, nom: "Bronze" },
  { level: 25, roleId: "1339902718088577074", bonus: 0.1, nom: "Argent" },
  { level: 40, roleId: "1339902715165147166", bonus: 0.15, nom: "Or" },
  { level: 60, roleId: "1339902712724066406", bonus: 0.25, nom: "Diamant" },
];

// Fonction pour attribuer un rôle à un utilisateur
async function assignRole(userId, guildId, roleId, client) {
  const guild = client.guilds.cache.get(guildId);
  if (!guild) return;

  const member = guild.members.cache.get(userId);
  if (!member) return;

  const role = guild.roles.cache.get(roleId);
  if (!role) return;

  await member.roles.add(role);
  console.log(`🎉 [ROLE] ${userId} a reçu le rôle ${role.name}`);
}

// ✅ Ajouter de l'expérience à un utilisateur
export async function addExperience(userId, guildId, exp, client) {
  const key = `levels_${guildId}_${userId}`;
  let userData = (await db.get(key)) || { level: 1, exp: 0 };

  userData.exp += exp;
  console.log(`📈 [XP] ${userId} a gagné ${exp} XP. Total: ${userData.exp}`);

  const requiredExp = userData.level * 100;
  let leveledUp = false;

  while (userData.exp >= requiredExp) {
    userData.exp -= requiredExp;
    userData.level++;
    leveledUp = true;
    console.log(
      `🏆 [LEVEL UP] ${userId} est maintenant niveau ${userData.level}`
    );

    // Vérifier et attribuer le rôle correspondant
    const reward = roleRewards.find((r) => r.level === userData.level);
    if (reward) {
      await assignRole(userId, guildId, reward.roleId, client);
    }
  }

  await db.set(key, userData);
  return leveledUp;
}

// ✅ Ajouter du temps vocal à un utilisateur
export async function incrementVoiceTime(userId, guildId, time) {
  const key = `voiceTime_${guildId}_${userId}`;
  const totalTime = (await db.get(key)) || 0;
  await db.set(key, totalTime + time);
}

// ✅ Récupérer les meilleurs utilisateurs vocaux
export async function getTopVoiceUsers(guildId) {
  const keys = await db.all();
  const users = [];

  for (const { id, value } of keys) {
    if (id.startsWith(`voiceTime_${guildId}_`)) {
      const userId = id.split("_")[2];
      users.push({ userId, voiceTime: value });
    }
  }

  // Trier du plus actif au moins actif
  users.sort((a, b) => b.voiceTime - a.voiceTime);
  return users.slice(0, 10);
}

// ✅ Récupérer le niveau d'un utilisateur
export async function getUserLevel(userId, guildId) {
  const key = `levels_${guildId}_${userId}`;
  const userData = await db.get(key);
  return userData || { level: 1, exp: 0 };
}

// ✅ Récupérer le dernier temps de message d'un utilisateur
export async function getLastMessageTime(userId, guildId) {
  const key = `lastMessageTime_${guildId}_${userId}`;
  return await db.get(key);
}

// ✅ Définir le dernier temps de message d'un utilisateur
export async function setLastMessageTime(userId, guildId, timestamp) {
  const key = `lastMessageTime_${guildId}_${userId}`;
  await db.set(key, timestamp);
}

// ✅ Supprimer tous les niveaux
export async function deleteAllLevels() {
  const keys = await db.all();
  for (const { id } of keys) {
    if (id.startsWith("levels_")) {
      await db.delete(id);
    }
  }
}

// ✅ Récupérer le classement des utilisateurs
export async function getLeaderboard(guildId) {
  const keys = await db.all();
  const leaderboard = [];

  for (const { id, value } of keys) {
    if (id.startsWith(`levels_${guildId}_`)) {
      const userId = id.split("_")[2];
      leaderboard.push({ userId, ...value });
    }
  }

  leaderboard.sort((a, b) => b.level - a.level || b.exp - a.exp);
  return leaderboard;
}

// ✅ Récupérer les meilleurs utilisateurs par messages
export async function getTopMessageUsers(guildId) {
  const keys = await db.all();
  const users = [];

  for (const { id, value } of keys) {
    if (id.startsWith(`levels_${guildId}_`)) {
      const userId = id.split("_")[2];
      users.push({ userId, ...value });
    }
  }

  users.sort((a, b) => b.messages - a.messages);
  return users.slice(0, 10);
}

// ✅ Incrémenter le compteur de messages d'un utilisateur
export async function incrementMessageCount(userId, guildId) {
  const key = `messageCount_${guildId}_${userId}`;
  const count = (await db.get(key)) || 0;
  await db.set(key, count + 1);
}

// ✅ Attribuer un badge à un utilisateur
export async function addBadge(userId, guildId, badge) {
  const key = `badges_${guildId}_${userId}`;
  let badges = (await db.get(key)) || [];
  if (!badges.includes(badge)) {
    badges.push(badge);
    await db.set(key, badges);
  }
}
