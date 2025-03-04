import { addExperience, incrementVoiceTime } from "../config/levels.js";
import { Events } from "discord.js";
import { QuickDB } from "quick.db";

const db = new QuickDB();
const economyTable = db.table("economy");

const minVoiceReward = 5;
const maxVoiceReward = 10;
const rewardInterval = 30000; // 30 sec
const allowedChannels = ["1339588538005454868", "1340794889155117076"];

const voiceTimes = new Map();
const voiceIntervals = new Map();
const rewardIntervals = new Map();

export default {
  name: Events.VoiceStateUpdate,
  async execute(oldState, newState) {
    const userId = newState.member?.user?.id;
    if (!userId || newState.member.user.bot) return;

    const guildId = newState.guild.id;
    const oldChannelId = oldState.channelId || "none";
    const newChannelId = newState.channelId || "none";

    console.log(`🔊 Mise à jour voix : ${oldChannelId} -> ${newChannelId}`);

    // ➤ L'utilisateur rejoint un salon vocal
    if (!oldState.channelId && newState.channelId) {
      if (!allowedChannels.includes(newChannelId)) return;

      console.log(`[VOIX] ${userId} a rejoint ${newChannelId}`);
      voiceTimes.set(userId, Date.now());

      // ✅ Démarrer le suivi du temps vocal
      const interval = setInterval(async () => {
        const member = newState.guild.members.cache.get(userId);
        if (
          !member ||
          !member.voice.channelId ||
          !allowedChannels.includes(member.voice.channelId) ||
          member.voice.selfMute ||
          member.voice.selfDeaf
        ) {
          clearInterval(interval);
          voiceIntervals.delete(userId);
          console.log(`[VOIX] Arrêt du suivi pour ${userId}`);
          return;
        }

        await incrementVoiceTime(userId, guildId, 60000);
        await addExperience(userId, guildId, 1);
        console.log(`[VOIX] ${userId} a gagné 1 minute.`);
      }, 60000);

      voiceIntervals.set(userId, interval);

      // ✅ Démarrer l'intervalle de récompenses économiques
      const rewardIntervalId = setInterval(async () => {
        const member = newState.guild.members.cache.get(userId);
        if (
          !member ||
          !member.voice.channelId ||
          !allowedChannels.includes(member.voice.channelId) ||
          member.voice.selfMute ||
          member.voice.selfDeaf
        ) {
          clearInterval(rewardIntervalId);
          rewardIntervals.delete(userId);
          return;
        }

        const reward =
          Math.floor(Math.random() * (maxVoiceReward - minVoiceReward + 1)) +
          minVoiceReward;
        let balance = (await economyTable.get(`balance_${userId}`)) || 0;
        balance += reward;
        await economyTable.set(`balance_${userId}`, balance);

        console.log(`💸 ${userId} a gagné ${reward} crédits.`);
      }, rewardInterval);

      rewardIntervals.set(userId, rewardIntervalId);
    }

    // ➤ L'utilisateur quitte totalement le vocal
    if (oldState.channelId && !newState.channelId) {
      const joinTime = voiceTimes.get(userId);
      if (joinTime) {
        const timeSpent = Date.now() - joinTime;
        console.log(
          `[VOIX] ${userId} a quitté après ${timeSpent / 60000} min.`
        );
        await incrementVoiceTime(userId, guildId, timeSpent);
        voiceTimes.delete(userId);
      }

      if (voiceIntervals.has(userId)) {
        clearInterval(voiceIntervals.get(userId));
        voiceIntervals.delete(userId);
      }

      if (rewardIntervals.has(userId)) {
        clearInterval(rewardIntervals.get(userId));
        rewardIntervals.delete(userId);
      }
    }

    // ➤ L'utilisateur change de canal
    if (
      oldState.channelId &&
      newState.channelId &&
      oldState.channelId !== newState.channelId
    ) {
      const joinTime = voiceTimes.get(userId);
      if (joinTime) {
        const timeSpent = Date.now() - joinTime;
        console.log(
          `[VOIX] ${userId} a changé de canal après ${timeSpent / 60000} min.`
        );
        await incrementVoiceTime(userId, guildId, timeSpent);
      }
      voiceTimes.set(userId, Date.now());

      if (voiceIntervals.has(userId)) {
        clearInterval(voiceIntervals.get(userId));
        voiceIntervals.delete(userId);
      }

      if (rewardIntervals.has(userId)) {
        clearInterval(rewardIntervals.get(userId));
        rewardIntervals.delete(userId);
      }

      if (allowedChannels.includes(newChannelId)) {
        // ✅ Redémarrer le suivi du temps vocal
        const interval = setInterval(async () => {
          const member = newState.guild.members.cache.get(userId);
          if (
            !member ||
            !member.voice.channelId ||
            !allowedChannels.includes(member.voice.channelId) ||
            member.voice.selfMute ||
            member.voice.selfDeaf
          ) {
            clearInterval(interval);
            voiceIntervals.delete(userId);
            return;
          }

          await incrementVoiceTime(userId, guildId, 60000);
          await addExperience(userId, guildId, 1);
        }, 60000);

        voiceIntervals.set(userId, interval);

        // ✅ Redémarrer l'intervalle économique
        const rewardIntervalId = setInterval(async () => {
          const member = newState.guild.members.cache.get(userId);
          if (
            !member ||
            !member.voice.channelId ||
            !allowedChannels.includes(member.voice.channelId) ||
            member.voice.selfMute ||
            member.voice.selfDeaf
          ) {
            clearInterval(rewardIntervalId);
            rewardIntervals.delete(userId);
            return;
          }

          const reward =
            Math.floor(Math.random() * (maxVoiceReward - minVoiceReward + 1)) +
            minVoiceReward;
          let balance = (await economyTable.get(`balance_${userId}`)) || 0;
          balance += reward;
          await economyTable.set(`balance_${userId}`, balance);
        }, rewardInterval);

        rewardIntervals.set(userId, rewardIntervalId);
      }
    }
  },
};
