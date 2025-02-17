import { QuickDB } from "quick.db";
const db = new QuickDB();

const roleRewards = [
  { level: 5, roleId: "1339902720546439189", bonus: 0.05 },
  { level: 15, roleId: "1339902718088577074", bonus: 0.1 },
  { level: 25, roleId: "1339902715165147166", bonus: 0.15 },
  { level: 40, roleId: "1339902712724066406", bonus: 0.25 },
];

export async function addExperience(userId, guildId, exp, client) {
  const userKey = `levels_${guildId}_${userId}`;
  let userData = await db.get(userKey);

  if (!userData) {
    userData = { level: 1, exp: 0 };
  }

  userData.exp += exp;
  console.log(`User ${userId} gained ${exp} XP. Total XP: ${userData.exp}`);

  const requiredExp = userData.level * 100;
  let leveledUp = false;

  while (userData.exp >= requiredExp) {
    userData.exp -= requiredExp;
    userData.level++;
    leveledUp = true;
    console.log(`User ${userId} leveled up to ${userData.level}`);
  }

  await db.set(userKey, userData);
  return leveledUp;
}

export async function getUserLevel(userId, guildId) {
  const userKey = `levels_${guildId}_${userId}`;
  const userData = await db.get(userKey);
  return userData || { level: 1, exp: 0 };
}

export async function setLastMessageTime(userId, guildId, timestamp) {
  const key = `lastMessageTime_${guildId}_${userId}`;
  await db.set(key, timestamp);
}

export async function getLastMessageTime(userId, guildId) {
  const key = `lastMessageTime_${guildId}_${userId}`;
  return await db.get(key);
}

export async function deleteAllLevels() {
  const keys = await db.all();
  for (const { id } of keys) {
    if (id.startsWith("levels_")) {
      await db.delete(id);
    }
  }
}

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

export async function incrementMessageCount(userId, guildId) {
  const key = `messageCount_${guildId}_${userId}`;
  const count = (await db.get(key)) || 0;
  await db.set(key, count + 1);
}

export async function incrementVoiceTime(userId, guildId, time) {
  const key = `voiceTime_${guildId}_${userId}`;
  const totalTime = (await db.get(key)) || 0;
  await db.set(key, totalTime + time);
}

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

export async function getTopVoiceUsers(guildId) {
  const keys = await db.all();
  const users = [];

  for (const { id, value } of keys) {
    if (id.startsWith(`levels_${guildId}_`)) {
      const userId = id.split("_")[2];
      users.push({ userId, ...value });
    }
  }

  users.sort((a, b) => b.voice - a.voice);
  return users.slice(0, 10);
}
