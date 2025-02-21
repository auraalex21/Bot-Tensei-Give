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
const minMessageReward = 30;
const maxMessageReward = 50;
const blacklistDuration = 5 * 60 * 1000; // 5 minutes en millisecondes
const spamThreshold = 3; // Nombre de messages considérés comme du spam
const spamInterval = 3000; // 3 secondes en millisecondes

const userBlacklist = new Map();

export default {
  name: Events.MessageCreate,
  async execute(client, message) {
    if (message.author.bot) return;

    const guildId = message.guild.id;
    const userId = message.author.id;

    // Vérifier si l'utilisateur est sur liste noire
    if (userBlacklist.has(userId)) {
      const blacklistInfo = userBlacklist.get(userId);
      if (Date.now() - blacklistInfo.timestamp < blacklistDuration) {
        return; // Ne pas exécuter le reste du code si l'utilisateur est sur liste noire
      } else {
        userBlacklist.delete(userId); // Retirer de la liste noire après la durée
      }
    }

    const lastMessageTime = await getLastMessageTime(userId, guildId);
    const now = Date.now();

    // Vérifier le spam
    if (lastMessageTime && now - lastMessageTime < spamInterval) {
      if (userBlacklist.has(userId)) {
        const blacklistInfo = userBlacklist.get(userId);
        blacklistInfo.count += 1;
        if (blacklistInfo.count >= spamThreshold) {
          blacklistInfo.timestamp = now;
          console.log(
            `🚫 ${message.author.username} a été mis sur BlackListe pour spam.`
          );
          return;
        }
      } else {
        userBlacklist.set(userId, { count: 1, timestamp: now });
      }
    } else {
      userBlacklist.set(userId, { count: 1, timestamp: now });
    }

    await setLastMessageTime(userId, guildId, now);

    // Ajouter de l'expérience à l'utilisateur
    if (message.channel.id === rewardChannelId) {
      const exp = Math.floor(Math.random() * 10) + 20; // Expérience aléatoire entre 20 et 30
      const leveledUp = await addExperience(userId, guildId, exp, client);

      // Incrémenter le nombre de messages
      await incrementMessageCount(userId, guildId);

      if (leveledUp) {
        const userLevel = await getUserLevel(userId, guildId);
        const levelUpChannelId = "1340011943733366805";
        const levelUpChannel = client.channels.cache.get(levelUpChannelId);

        // Ajouter des gains d'argent lors de la montée de niveau
        let balance = (await economyTable.get(`balance_${userId}`)) || 0;
        const levelUpReward = 100 * userLevel.level; // Définir le gain d'argent par niveau
        balance += levelUpReward;
        await economyTable.set(`balance_${userId}`, balance);

        if (levelUpChannel) {
          const width = 700;
          const height = 250;
          const padding = 30;
          const avatarSize = 120;

          // Créer le canvas
          const canvas = createCanvas(width, height);
          const ctx = canvas.getContext("2d");

          // Fond avec dégradé et texture
          const gradient = ctx.createLinearGradient(0, 0, width, height);
          gradient.addColorStop(0, "#141E30");
          gradient.addColorStop(1, "#243B55");
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, width, height);

          // Charger l'avatar
          const avatarURL = message.author.displayAvatarURL({
            format: "png",
            size: 128,
          });
          let avatar;
          try {
            avatar = await loadImage(avatarURL);
          } catch (err) {
            console.error("Échec du chargement de l'image de l'avatar:", err);
            avatar = await loadImage(
              "https://cdn.discordapp.com/embed/avatars/0.png"
            );
          }

          // Contour lumineux autour de l'avatar
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

          // Avatar circulaire
          ctx.save();
          ctx.beginPath();
          ctx.arc(
            padding + avatarSize / 2,
            height / 2,
            avatarSize / 2,
            0,
            Math.PI * 2
          );
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

          // Nom d'utilisateur stylisé
          ctx.font = "bold 35px Arial";
          ctx.fillStyle = "#ffffff";
          ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
          ctx.shadowBlur = 5;
          ctx.fillText(
            message.author.tag,
            padding * 2 + avatarSize,
            height / 3
          );
          ctx.shadowBlur = 0;

          // Texte de niveau
          ctx.font = "bold 28px Arial";
          ctx.fillStyle = "#FFD700";
          ctx.fillText(
            `Niveau ${userLevel.level}`,
            padding * 2 + avatarSize,
            height / 2
          );

          // Animation lumineuse optionnelle autour du texte
          ctx.font = "italic 22px Arial";
          ctx.fillStyle = "#FFFFFF";
          ctx.fillText(
            "🚀 Continuez comme ça !",
            padding * 2 + avatarSize,
            height - padding
          );

          // Convertir le canvas en buffer
          const buffer = canvas.toBuffer();
          const attachment = new AttachmentBuilder(buffer, {
            name: "level-up.png",
          });

          // Envoyer le message avec l'image
          levelUpChannel.send({
            content: `🎉 ${message.author.username} a atteint le niveau ${userLevel.level} et a gagné ${levelUpReward} pièces !`,
            files: [attachment],
          });
        }
      }
    }

    if (message.channel.id === rewardChannelId && !message.author.bot) {
      const reward =
        Math.floor(Math.random() * (maxMessageReward - minMessageReward + 1)) +
        minMessageReward;
      let balance = (await economyTable.get(`balance_${userId}`)) || 0;
      balance += reward;
      await economyTable.set(`balance_${userId}`, balance);

      console.log(
        `💸 ${message.author.username} a gagné ${reward} pour avoir envoyé un message. Nouveau solde: ${balance}💸.`
      );
    }
  },
};
