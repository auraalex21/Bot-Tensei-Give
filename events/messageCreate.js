import {
  addExperience,
  setLastMessageTime,
  getLastMessageTime,
  getUserLevel,
  incrementMessageCount,
} from "../config/levels.js";
import { createCanvas, loadImage } from "canvas";
import { AttachmentBuilder, Events, PermissionsBitField } from "discord.js";
import { QuickDB } from "quick.db";

const db = new QuickDB();
const economyTable = db.table("economy");

// 📌 Configurations
const rewardChannelId = "1339234268907573250";
const levelUpChannelId = "1340011943733366805";
const verificationChannelId = "1340366991038615592"; // ID du salon de vérification
const verificationRoleId = "1339298936099442759"; // ID du rôle à ajouter après vérification

// 🎰 Récompenses & Spam Protection
const minMessageReward = 10;
const maxMessageReward = 15;
const blacklistDuration = 5 * 60 * 1000; // 5 minutes
const spamThreshold = 3; // Seuil de spam
const spamInterval = 1000; // Intervalle en ms

const userBlacklist = new Map();
const userMessageTimestamps = new Map();
const userBonsoirWarnings = new Map();

export default {
  name: Events.MessageCreate,
  async execute(client, message) {
    if (message.author.bot) return;

    const userId = message.author.id;
    const guildId = message.guild.id;
    const now = Date.now();

    // Check if the message is "bonsoir" and the current time in Paris
    const parisTime = new Date().toLocaleString("en-US", {
      timeZone: "Europe/Paris",
    });
    const currentHour = new Date(parisTime).getHours();

    if (
      message.content.toLowerCase() === "bonsoir" &&
      currentHour >= 0 &&
      currentHour < 20
    ) {
      if (!userBonsoirWarnings.has(userId)) {
        userBonsoirWarnings.set(userId, 1);
        await message.channel.send(
          `${message.author}, ce n'est pas le soir. La prochaine fois, je te TO.`
        );
      } else {
        const warnings = userBonsoirWarnings.get(userId);
        if (warnings === 1) {
          userBonsoirWarnings.set(userId, 2);
          await message.channel.send(
            `${message.author}, ce n'est toujours pas le soir. La prochaine fois, je te TO.`
          );
        } else if (warnings === 2) {
          const member = message.guild.members.cache.get(userId);
          if (member) {
            await member.timeout(
              10 * 60 * 1000,
              "A dit 'bonsoir' plusieurs fois avant 16h"
            );
            await message.channel.send(
              `${message.author} a été mis en timeout pour 10 minutes.`
            );
          }
          userBonsoirWarnings.delete(userId);
        }
      }
      return;
    }

    console.log(
      `📩 Message reçu de ${message.author.tag} dans ${message.channel.id}`
    );

    // 📌 [1] Vérification Raid Protect
    if (message.channel.id === verificationChannelId) {
      const verificationCode = await db.get(`verificationCode_${userId}`);
      if (!verificationCode) return;

      if (message.content.trim() === verificationCode) {
        const member = message.guild.members.cache.get(userId);
        const role = message.guild.roles.cache.get(verificationRoleId);

        if (!role) {
          console.error("❌ Le rôle de vérification est introuvable !");
          return;
        }

        if (!member) {
          console.error("❌ Impossible de trouver le membre dans le serveur.");
          return;
        }

        // Vérifier si le bot a la permission d'ajouter des rôles
        const botMember = message.guild.members.cache.get(client.user.id);
        if (!botMember.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
          console.error("❌ Le bot n'a pas la permission d'ajouter des rôles.");
          return;
        }

        // Ajouter le rôle et confirmer la vérification
        await member.roles.add(role);
        await db.delete(`verificationCode_${userId}`);

        await message.channel.send(
          `✅ ${message.author}, vous avez été vérifié avec succès !`
        );
      } else {
        await message.channel.send(
          `❌ ${message.author}, le code est incorrect. Réessayez.`
        );
      }
      return;
    }

    // 🚫 [2] Vérifier si l'utilisateur est blacklisté pour spam
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

    // 📡 [3] Détection du spam
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

    // 🎮 [4] Gagner de l'XP et de l'argent si l'utilisateur n'est pas blacklisté
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

    // 💰 [5] Récompense d'argent pour l'envoi de messages
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

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#141E30");
  gradient.addColorStop(1, "#243B55");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  const avatarURL = user.displayAvatarURL({ format: "png", size: 128 });
  let avatar;
  try {
    avatar = await loadImage(avatarURL);
  } catch (err) {
    console.error("Erreur de chargement de l'avatar:", err);
    avatar = await loadImage("https://cdn.discordapp.com/embed/avatars/0.png");
  }

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

  ctx.font = "bold 35px Arial";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(user.tag, padding * 2 + avatarSize, height / 3);
  ctx.font = "bold 28px Arial";
  ctx.fillStyle = "#FFD700";
  ctx.fillText(`Niveau ${level}`, padding * 2 + avatarSize, height / 2);

  return new AttachmentBuilder(canvas.toBuffer(), { name: "level-up.png" });
}
