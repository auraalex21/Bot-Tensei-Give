import {
  addExperience,
  getUserLevel,
  incrementVoiceTime,
} from "../config/levels.js";
import { createCanvas, loadImage } from "canvas";
import { AttachmentBuilder, Events } from "discord.js";

export default {
  name: Events.VoiceStateUpdate,
  async execute(client, oldState, newState) {
    console.log(
      `Mise à jour de l'état vocal : ${oldState.channelId} -> ${newState.channelId}`
    );
    if (newState.member.user.bot) return;

    const excludedChannels = [
      "1339588778909765712",
      "1340010734750535691",
      "1339589443870265385",
    ];
    if (excludedChannels.includes(newState.channelId)) return;

    const guildId = newState.guild.id;
    const userId = newState.member.user.id;

    if (!oldState.channelId && newState.channelId) {
      // L'utilisateur a rejoint un canal vocal
      const interval = setInterval(async () => {
        if (
          !newState.channelId ||
          excludedChannels.includes(newState.channelId)
        ) {
          clearInterval(interval);
          return;
        }

        const expGained = 30;
        const leveledUp = await addExperience(
          userId,
          guildId,
          expGained,
          client
        );

        await incrementVoiceTime(userId, guildId, 60); // Increment voice time by 60 seconds

        if (leveledUp) {
          const userLevel = await getUserLevel(
            newState.member.user.id,
            newState.guild.id
          );
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

            // Fond avec dégradé
            const gradient = ctx.createLinearGradient(0, 0, width, height);
            gradient.addColorStop(0, "#141E30");
            gradient.addColorStop(1, "#243B55");
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);

            // Chargement de l'avatar
            const avatarURL = newState.member.user.displayAvatarURL({
              format: "png",
              size: 128,
            });
            let avatar;
            try {
              avatar = await loadImage(avatarURL);
            } catch (err) {
              console.error("Erreur de chargement de l'avatar:", err);
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
            ctx.fillText(
              newState.member.user.tag,
              padding * 2 + avatarSize,
              height / 3
            );
            ctx.shadowBlur = 0;

            // Texte du niveau
            ctx.font = "bold 28px Arial";
            ctx.fillStyle = "#FFD700";
            ctx.fillText(
              `Niveau ${userLevel.level}`,
              padding * 2 + avatarSize,
              height / 2
            );

            // Texte motivant
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
              content: `🎉 ${newState.member}, vous avez atteint le niveau **${userLevel.level}** !`,
              files: [attachment],
            });
          }
        }
      }, 60000); // Ajout de l'expérience toutes les 60 secondes
    }
  },
};
