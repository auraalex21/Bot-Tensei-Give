import {
  addExperience,
  getUserLevel,
  incrementVoiceTime,
} from "../config/levels.js";
import { Events } from "discord.js";

const voiceTimes = new Map();
const voiceIntervals = new Map(); // Stocke les intervalles actifs

export default {
  name: Events.VoiceStateUpdate,
  async execute(client, oldState, newState) {
    console.log(
      `🔊 Mise à jour de l'état vocal : ${oldState.channelId} -> ${newState.channelId}`
    );

    if (newState.member.user.bot) return;

    const excludedChannels = [
      "1339588778909765712",
      "1340010734750535691",
      "1339589443870265385",
    ];
    if (newState.channelId && excludedChannels.includes(newState.channelId))
      return;

    const guildId = newState.guild.id;
    const userId = newState.member.user.id;

    if (!oldState.channelId && newState.channelId) {
      console.log(`[VOIX] ${userId} a rejoint le vocal.`);
      voiceTimes.set(userId, Date.now());

      // ✅ Démarrer un intervalle pour mise à jour continue
      const interval = setInterval(async () => {
        const currentChannel =
          newState.guild.members.cache.get(userId)?.voice.channelId;

        if (!currentChannel || excludedChannels.includes(currentChannel)) {
          clearInterval(interval);
          voiceIntervals.delete(userId);
          console.log(`[VOIX] Arrêt de la mise à jour pour ${userId}`);
          return;
        }

        await incrementVoiceTime(userId, guildId, 60000); // Ajout de 1 minute
        await addExperience(userId, guildId, 1, client); // Ajout d'XP

        console.log(`[VOIX] ${userId} a gagné 1 minute.`);
      }, 60000); // Toutes les 60 secondes

      voiceIntervals.set(userId, interval);
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

        if (!currentChannel || excludedChannels.includes(currentChannel)) {
          clearInterval(interval);
          voiceIntervals.delete(userId);
          console.log(`[VOIX] Arrêt de la mise à jour pour ${userId}`);
          return;
        }

        await incrementVoiceTime(userId, guildId, 60000);
        await addExperience(userId, guildId, 1, client);

        console.log(`[VOIX] ${userId} a gagné 1 minute.`);
      }, 60000);

      voiceIntervals.set(userId, interval);
    }
  },
};
