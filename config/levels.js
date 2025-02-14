const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
  addExperience: async (userId, guildId, exp, client) => {
    const key = `levels_${guildId}_${userId}`;
    const user = (await db.get(key)) || { exp: 0, level: 1, lastExpTime: 0 };
    const now = Date.now();

    // Vérifier si 3 secondes se sont écoulées depuis le dernier gain d'expérience
    if (now - user.lastExpTime < 3000) {
      return false; // Pas de gain d'expérience
    }

    user.exp += exp;
    user.lastExpTime = now;

    const levelUpExp = 5 * Math.pow(user.level, 2) + 50 * user.level + 100;
    if (user.exp >= levelUpExp) {
      user.level += 1;
      user.exp -= levelUpExp;
      await db.set(key, user);

      // Attribuer des rôles en fonction du niveau atteint
      const guild = client.guilds.cache.get(guildId);
      const member = guild.members.cache.get(userId);

      if (user.level === 5) {
        const role = guild.roles.cache.get("1339902720546439189");
        if (role) member.roles.add(role);
      } else if (user.level === 15) {
        const role = guild.roles.cache.get("1339902718088577074");
        if (role) member.roles.add(role);
      } else if (user.level === 20) {
        const role = guild.roles.cache.get("1339902715165147166");
        if (role) member.roles.add(role);
      } else if (user.level === 30) {
        const role = guild.roles.cache.get("1339902712724066406");
        if (role) member.roles.add(role);
      }

      return true; // Level up
    }

    await db.set(key, user);
    return false; // No level up
  },

  getUserLevel: async (userId, guildId) => {
    const key = `levels_${guildId}_${userId}`;
    return (await db.get(key)) || { exp: 0, level: 1, lastExpTime: 0 };
  },

  getLastMessageTime: async (userId, guildId) => {
    const key = `lastMessage_${guildId}_${userId}`;
    return await db.get(key);
  },

  setLastMessageTime: async (userId, guildId, time) => {
    const key = `lastMessage_${guildId}_${userId}`;
    await db.set(key, time);
  },
};
