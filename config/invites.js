import { QuickDB } from "quick.db";
const db = new QuickDB();

export async function addInvite(userId, guildId, count = 1) {
  const key = `invites_${guildId}_${userId}`;
  const invites = (await db.get(key)) || 0;
  await db.set(key, invites + count);
}

export async function getInvites(userId, guildId) {
  const key = `invites_${guildId}_${userId}`;
  return (await db.get(key)) || 0;
}

export async function resetInvites(userId, guildId) {
  const key = `invites_${guildId}_${userId}`;
  await db.set(key, 0);
}

export async function getTopInviters(guildId) {
  const keys = await db.all();
  const inviters = [];

  for (const { id, value } of keys) {
    if (id.startsWith(`invites_${guildId}_`)) {
      const userId = id.split("_")[2];
      inviters.push({ userId, invites: value });
    }
  }

  inviters.sort((a, b) => b.invites - a.invites);
  return inviters.slice(0, 10);
}
