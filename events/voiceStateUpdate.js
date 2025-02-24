import {
  addExperience,
  getUserLevel,
  incrementVoiceTime,
} from "../config/levels.js";
import { Events } from "discord.js";
import { QuickDB } from "quick.db";

const db = new QuickDB();
const economyTable = db.table("economy");

const minVoiceReward = 5;
const maxVoiceReward = 10;
const rewardInterval = 30000; // 30 seconds

const activeUsers = new Set();

const voiceTimes = new Map();
const voiceIntervals = new Map(); // Stocke les intervalles actifs

const allowedChannels = ["1339588538005454868", "1340794889155117076"];

export default {
  name: Events.VoiceStateUpdate,
  async execute(oldState, newState) {
    const oldChannelId = oldState.channelId ? oldState.channelId : "none";
    const newChannelId = newState.channelId ? newState.channelId : "none";

    // Ignore cases where both old and new channel IDs are "none"
    if (oldChannelId === "none" && newChannelId === "none") return;

    console.log(
      `🔊 Mise à jour de l'état vocal : ${oldChannelId} -> ${newChannelId}`
    );

    if (newState.member.user.bot) return;

    const guildId = newState.guild.id;
    const userId = newState.member.user.id;

    if (!oldState.channelId && newState.channelId) {
      console.log(`[VOIX] ${userId} a rejoint le vocal.`);
      voiceTimes.set(userId, Date.now());

      // ✅ Démarrer un intervalle pour mise à jour continue
      const interval = setInterval(async () => {
        const currentChannel =
          newState.guild.members.cache.get(userId)?.voice.channelId;

        if (
          !currentChannel ||
          !allowedChannels.includes(currentChannel) ||
          newState.selfMute ||
          newState.selfDeaf
        ) {
          clearInterval(interval);
          voiceIntervals.delete(userId);
          console.log(`[VOIX] Arrêt de la mise à jour pour ${userId}`);
          return;
        }

        if (allowedChannels.includes(currentChannel)) {
          await incrementVoiceTime(userId, guildId, 60000);
          const experience = Math.floor(Math.random() * 15) + 1;
          await addExperience(userId, guildId, experience);
          console.log(`[VOIX] ${userId} a gagné 1 minute.`);
        }
      }, 60000); // Toutes les 60 secondes

      voiceIntervals.set(userId, interval);

      // ✅ Démarrer un intervalle pour récompense économique
      if (!activeUsers.has(userId)) {
        activeUsers.add(userId);
        const rewardIntervalId = setInterval(async () => {
          const currentChannel =
            newState.guild.members.cache.get(userId)?.voice.channelId;

          if (
            !currentChannel ||
            !allowedChannels.includes(currentChannel) ||
            newState.selfMute ||
            newState.selfDeaf
          ) {
            clearInterval(rewardIntervalId);
            activeUsers.delete(userId);
            return;
          }

          const reward =
            Math.floor(Math.random() * (maxVoiceReward - minVoiceReward + 1)) +
            minVoiceReward;
          let balance = (await economyTable.get(`balance_${userId}`)) || 0;
          balance += reward;
          await economyTable.set(`balance_${userId}`, balance);

          console.log(
            `💸 ${newState.member.user.username} a gagné ${reward} pour être dans un canal vocal. Nouveau solde: ${balance}💸.`
          );
        }, rewardInterval);
      }
    } else if (oldState.channelId && !newState.channelId) {
      const joinTime = voiceTimes.get(userId);
      if (joinTime) {
        const timeSpent = Date.now() - joinTime;
        console.log(
          `[VOIX] ${userId} a quitté après ${timeSpent / 60000} min.`
        );
        await incrementVoiceTime(userId, guildId, timeSpent);
        voiceTimes.delete(userId);
      }

      // ✅ Arrêter l'intervalle de mise à jour
      if (voiceIntervals.has(userId)) {
        clearInterval(voiceIntervals.get(userId));
        voiceIntervals.delete(userId);
      }

      // ✅ Arrêter l'intervalle de récompense économique
      activeUsers.delete(userId);
    } else if (
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

      // ✅ Redémarrer l'intervalle dans le nouveau canal
      if (voiceIntervals.has(userId)) {
        clearInterval(voiceIntervals.get(userId));
      }

      const interval = setInterval(async () => {
        const currentChannel =
          newState.guild.members.cache.get(userId)?.voice.channelId;

        if (
          !currentChannel ||
          !allowedChannels.includes(currentChannel) ||
          newState.selfMute ||
          newState.selfDeaf
        ) {
          clearInterval(interval);
          voiceIntervals.delete(userId);
          console.log(`[VOIX] Arrêt de la mise à jour pour ${userId}`);
          return;
        }

        if (allowedChannels.includes(currentChannel)) {
          await incrementVoiceTime(userId, guildId, 60000);
          await addExperience(userId, guildId, 1);
          console.log(`[VOIX] ${userId} a gagné 1 minute.`);
        }
      }, 60000);

      voiceIntervals.set(userId, interval);

      // ✅ Redémarrer l'intervalle de récompense économique
      if (!activeUsers.has(userId)) {
        activeUsers.add(userId);
        const rewardIntervalId = setInterval(async () => {
          const currentChannel =
            newState.guild.members.cache.get(userId)?.voice.channelId;

          if (
            !currentChannel ||
            !allowedChannels.includes(currentChannel) ||
            newState.selfMute ||
            newState.selfDeaf
          ) {
            clearInterval(rewardIntervalId);
            activeUsers.delete(userId);
            return;
          }

          const reward =
            Math.floor(Math.random() * (maxVoiceReward - minVoiceReward + 1)) +
            minVoiceReward;
          let balance = (await economyTable.get(`balance_${userId}`)) || 0;
          balance += reward;
          await economyTable.set(`balance_${userId}`, balance);

          console.log(
            `💸 ${newState.member.user.username} a gagné ${reward} pour être dans un canal vocal. Nouveau solde: ${balance}💸.`
          );
        }, rewardInterval);
      }
    }
  },
};
