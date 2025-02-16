import { QuickDB } from "quick.db";
const db = new QuickDB();

export async function addExperience(userId, guildId, exp, client) {
  const key = `levels_${guildId}_${userId}`;
  const user = (await db.get(key)) || {
    exp: 0,
    level: 1,
    messages: 0,
    voice: 0,
  };
  user.exp += exp;

  const nextLevelExp = user.level * 100;
  let leveledUp = false;

  if (user.exp >= nextLevelExp) {
    user.level++;
    user.exp = 0; // Reset experience to 0 when leveling up
    leveledUp = true;

    const levelUpChannelId = "1340011943733366805";
    const levelUpChannel = client.channels.cache.get(levelUpChannelId);
    if (levelUpChannel) {
      levelUpChannel.send(
        `🎉 ${client.users.cache.get(userId)}, vous avez atteint le niveau **${
          user.level
        }** !`
      );
    }
  }

  await db.set(key, user);
  return leveledUp;
}

export async function getUserLevel(userId, guildId) {
  const key = `levels_${guildId}_${userId}`;
  const user = (await db.get(key)) || {
    exp: 0,
    level: 1,
    messages: 0,
    voice: 0,
  };
  return user;
}

export async function setLastMessageTime(userId, guildId, timestamp) {
  const key = `lastMessage_${guildId}_${userId}`;
  await db.set(key, timestamp);
}

export async function getLastMessageTime(userId, guildId) {
  const key = `lastMessage_${guildId}_${userId}`;
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
  const key = `levels_${guildId}_${userId}`;
  const user = (await db.get(key)) || {
    exp: 0,
    level: 1,
    messages: 0,
    voice: 0,
  };
  user.messages += 1;
  await db.set(key, user);
}

export async function incrementVoiceTime(userId, guildId, time) {
  const key = `levels_${guildId}_${userId}`;
  const user = (await db.get(key)) || {
    exp: 0,
    level: 1,
    messages: 0,
    voice: 0,
  };
  user.voice += time;
  await db.set(key, user);
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
