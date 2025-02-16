import {
  addExperience,
  setLastMessageTime,
  getLastMessageTime,
  getUserLevel,
  incrementMessageCount,
} from "../config/levels.js";
import { AttachmentBuilder, Events } from "discord.js";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

// Modèle IA amélioré (meilleure cohérence des réponses)
const HUGGING_FACE_API_URL =
  "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.1";
const MAX_MESSAGE_LENGTH = 2000;

// Liste de mots inappropriés à filtrer
const inappropriateContent = ["badword1", "badword2", "badword3"];

function containsInappropriateContent(text) {
  return inappropriateContent.some((word) => text.includes(word));
}

export default {
  name: Events.MessageCreate,
  async execute(client, message) {
    if (message.author.bot) return;

    const botMention = `<@${client.user.id}>`;
    if (message.content.includes(botMention)) {
      const prompt = message.content.replace(botMention, "").trim();

      if (prompt.length === 0) {
        return message.reply("Comment puis-je vous aider ?");
      }

      // Indiquer que le bot réfléchit
      const thinkingMessage = await message.reply("✍️ Réflexion en cours...");

      try {
        const response = await axios.post(
          HUGGING_FACE_API_URL,
          {
            inputs: prompt,
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.HUGGING_FACE_API_KEY}`,
            },
          }
        );

        // Vérifier si la réponse est valide
        if (
          !response.data ||
          !response.data[0] ||
          !response.data[0].generated_text
        ) {
          throw new Error("Réponse invalide de l'API.");
        }

        let reply = response.data[0].generated_text.trim();

        // Vérifier la cohérence de la réponse
        if (reply.length < 5 || reply.includes("error")) {
          reply = "Je ne suis pas sûr de comprendre. Peux-tu reformuler ?";
        }

        // Vérifier si la réponse contient du contenu inapproprié
        if (containsInappropriateContent(reply)) {
          reply = "Désolé, je ne peux pas répondre à cela.";
        }

        // Limiter la longueur du message pour Discord
        if (reply.length > MAX_MESSAGE_LENGTH) {
          reply = reply.substring(0, MAX_MESSAGE_LENGTH - 3) + "...";
        }

        await thinkingMessage.edit(reply);
      } catch (error) {
        console.error(
          "❌ Erreur lors de la génération de la réponse IA :",
          error
        );
        await thinkingMessage.edit(
          "Désolé, je n'ai pas pu générer une réponse."
        );
      }
    }

    // Gestion de l'expérience et des niveaux
    const guildId = message.guild.id;
    const userId = message.author.id;
    const lastMessageTime = await getLastMessageTime(userId, guildId);
    const now = Date.now();

    if (lastMessageTime && now - lastMessageTime < 3000) {
      return;
    }

    await setLastMessageTime(userId, guildId, now);
    const exp = Math.floor(Math.random() * 10) + 1;
    const leveledUp = await addExperience(userId, guildId, exp, client);
    await incrementMessageCount(userId, guildId);

    if (leveledUp) {
      const userLevel = await getUserLevel(userId, guildId);
      const levelUpChannelId = "1340011943733366805";
      const levelUpChannel = client.channels.cache.get(levelUpChannelId);

      if (levelUpChannel) {
        const width = 700;
        const height = 250;
        const padding = 30;
        const avatarSize = 120;

        // Création du canvas
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext("2d");

        // Fond avec dégradé et texture
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, "#141E30");
        gradient.addColorStop(1, "#243B55");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Chargement de l'avatar
        const avatarURL = message.author.displayAvatarURL({
          format: "png",
          size: 128,
        });
        let avatar;
        try {
          avatar = await loadImage(avatarURL);
        } catch (err) {
          console.error("Failed to load avatar image:", err);
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

        // Avatar en cercle
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
        ctx.fillText(message.author.tag, padding * 2 + avatarSize, height / 3);
        ctx.shadowBlur = 0;

        // Texte du niveau
        ctx.font = "bold 28px Arial";
        ctx.fillStyle = "#FFD700";
        ctx.fillText(
          `Niveau ${userLevel.level}`,
          padding * 2 + avatarSize,
          height / 2
        );

        // Convertir le canvas en buffer
        const buffer = canvas.toBuffer();
        const attachment = new AttachmentBuilder(buffer, {
          name: "level-up.png",
        });

        // Envoyer le message avec l'image
        levelUpChannel.send({
          content: `🎉 ${message.author} a atteint le niveau ${userLevel.level} ! Félicitations !`,
          files: [attachment],
        });
      }
    }
  },
};
