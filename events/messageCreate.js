import {
  addExperience,
  setLastMessageTime,
  getLastMessageTime,
  getUserLevel,
  incrementMessageCount,
} from "../config/levels.js";
import { createCanvas, loadImage } from "canvas";
import { AttachmentBuilder, Events } from "discord.js";
import { QuickDB } from "quick.db";

const db = new QuickDB();
const economyTable = db.table("economy");

const rewardChannelId = "1339234268907573250";
const levelUpChannelId = "1340011943733366805";

const minMessageReward = 10;
const maxMessageReward = 15;
const blacklistDuration = 5 * 60 * 1000; // 5 minutes
const spamThreshold = 3; // Seuil de spam
const spamInterval = 1000; // Intervalle en ms

const userBlacklist = new Map();
const userMessageTimestamps = new Map(); // Stocke les messages récents

export default {
  name: Events.MessageCreate,
  async execute(client, message) {
    if (message.author.bot) return;

    const userId = message.author.id;
    const guildId = message.guild.id;
    const now = Date.now();

    console.log(
      `📩 Message reçu de ${message.author.tag} dans ${message.channel.id}`
    );

    // 🚫 Vérifier si l'utilisateur est blacklisté
    if (userBlacklist.has(userId)) {
      const blacklistInfo = userBlacklist.get(userId);
      if (now - blacklistInfo.timestamp < blacklistDuration) {
        console.log(`🚫 ${message.author.username} est encore blacklisté.`);
        if (!blacklistInfo.messageSent) {
          message.channel.send(
            `${message.author}, tu es blacklisté pour spam pendant 5 minutes.`
          );
          blacklistInfo.messageSent = true;
        }
        return;
      } else {
        userBlacklist.delete(userId);
        console.log(
          `✅ ${message.author.username} a été retiré de la liste noire.`
        );
      }
    }

    // 📡 Détection du spam
    if (!userMessageTimestamps.has(userId)) {
      userMessageTimestamps.set(userId, []);
    }

    const timestamps = userMessageTimestamps.get(userId);
    timestamps.push(now);

    // Nettoyer les anciens messages hors de l'intervalle de spam
    while (timestamps.length > 0 && now - timestamps[0] > spamInterval) {
      timestamps.shift();
    }

    // Vérification du seuil de spam
    if (timestamps.length >= spamThreshold) {
      userBlacklist.set(userId, { timestamp: now, messageSent: false });
      console.log(`🚫 ${message.author.username} a été blacklisté pour spam.`);
      message.channel.send(
        `${message.author}, arrête de spammer ! Tu es blacklisté pour 5 minutes.`
      );

      userMessageTimestamps.delete(userId); // Reset des timestamps
      return;
    }

    await setLastMessageTime(userId, guildId, now);

    // 🎮 Gagner de l'XP et de l'argent si l'utilisateur n'est pas blacklisté
    if (message.channel.id === rewardChannelId) {
      console.log(`⭐ Ajout d'expérience pour ${message.author.username}`);

      const exp = Math.floor(Math.random() * 10) + 20;
      const leveledUp = await addExperience(userId, guildId, exp, client);
      await incrementMessageCount(userId, guildId);

      if (leveledUp) {
        const userLevel = await getUserLevel(userId, guildId);
        let balance = (await economyTable.get(`balance_${userId}`)) || 0;
        const levelUpReward = 100 * userLevel.level;
        balance += levelUpReward;
        await economyTable.set(`balance_${userId}`, balance);

        const levelUpChannel = client.channels.cache.get(levelUpChannelId);
        if (levelUpChannel) {
          const levelUpImage = await generateLevelUpImage(
            message.author,
            userLevel.level
          );
          levelUpChannel.send({
            content: `🎉 ${message.author.username} a atteint le niveau ${userLevel.level} et a gagné ${levelUpReward} pièces !`,
            files: [levelUpImage],
          });
        }
      }
    }

    if (!message.author.bot && message.channel.id === rewardChannelId) {
      const reward =
        Math.floor(Math.random() * (maxMessageReward - minMessageReward + 1)) +
        minMessageReward;
      let balance = (await economyTable.get(`balance_${userId}`)) || 0;
      balance += reward;
      await economyTable.set(`balance_${userId}`, balance);

      console.log(
        `💰 ${message.author.username} a gagné ${reward} 💰. Nouveau solde : ${balance}.`
      );
    }
  },
};

// 🎨 Générer une image de montée de niveau
async function generateLevelUpImage(user, level) {
  const width = 700,
    height = 250,
    padding = 30,
    avatarSize = 120;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // 🎨 Fond avec dégradé
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#141E30");
  gradient.addColorStop(1, "#243B55");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // 🖼️ Charger l'avatar
  const avatarURL = user.displayAvatarURL({ format: "png", size: 128 });
  let avatar;
  try {
    avatar = await loadImage(avatarURL);
  } catch (err) {
    console.error("Erreur de chargement de l'avatar:", err);
    avatar = await loadImage("https://cdn.discordapp.com/embed/avatars/0.png");
  }

  // ✨ Contour lumineux
  ctx.save();
  ctx.beginPath();
  ctx.arc(
    padding + avatarSize / 2,
    height / 2,
    avatarSize / 2 + 10,
    0,
    Math.PI * 2
  );
  ctx.fillStyle = "#FFD700";
  ctx.shadowColor = "#FFD700";
  ctx.shadowBlur = 15;
  ctx.fill();
  ctx.closePath();
  ctx.restore();

  // 🖼️ Avatar circulaire
  ctx.save();
  ctx.beginPath();
  ctx.arc(padding + avatarSize / 2, height / 2, avatarSize / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(
    avatar,
    padding,
    height / 2 - avatarSize / 2,
    avatarSize,
    avatarSize
  );
  ctx.restore();

  // 🏆 Texte stylisé
  ctx.font = "bold 35px Arial";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(user.tag, padding * 2 + avatarSize, height / 3);

  ctx.font = "bold 28px Arial";
  ctx.fillStyle = "#FFD700";
  ctx.fillText(`Niveau ${level}`, padding * 2 + avatarSize, height / 2);

  // 🔥 Effet final
  ctx.font = "italic 22px Arial";
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText(
    "🚀 Continuez comme ça !",
    padding * 2 + avatarSize,
    height - padding
  );

  return new AttachmentBuilder(canvas.toBuffer(), { name: "level-up.png" });
}
