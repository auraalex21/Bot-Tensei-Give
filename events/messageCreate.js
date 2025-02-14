const levels = require("../config/levels");
const { createCanvas, loadImage, registerFont } = require("canvas");
const Discord = require("discord.js");

module.exports = async (client, message) => {
  if (message.author.bot) return;

  const excludedChannels = [
    "1339588778909765712",
    "1340010734750535691",
    "1339589443870265385",
  ];
  if (excludedChannels.includes(message.channel.id)) return;

  const expGained = Math.floor(Math.random() * 10) + 5;
  const leveledUp = await levels.addExperience(
    message.author.id,
    message.guild.id,
    expGained,
    client
  );

  if (leveledUp) {
    const userLevel = await levels.getUserLevel(
      message.author.id,
      message.guild.id
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

      // Animation lumineuse autour du texte (optionnel)
      ctx.font = "italic 22px Arial";
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(
        "🚀 Continuez comme ça !",
        padding * 2 + avatarSize,
        height - padding
      );

      // Convertir le canvas en buffer
      const buffer = canvas.toBuffer();
      const attachment = new Discord.AttachmentBuilder(buffer, {
        name: "level-up.png",
      });

      // Envoyer le message avec l'image
      levelUpChannel.send({
        content: `🎉 ${message.author}, vous avez atteint le niveau **${userLevel.level}** !`,
        files: [attachment],
      });
    }
  }

  await levels.setLastMessageTime(
    message.author.id,
    message.guild.id,
    Date.now()
  );
};
