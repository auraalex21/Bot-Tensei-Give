import { SlashCommandBuilder, AttachmentBuilder } from "discord.js";
import { createCanvas, loadImage } from "canvas";
import { QuickDB } from "quick.db";
// import { getUserLevel, roleRewards } from "../../config/levels.js";

const db = new QuickDB();
// const economyTable = db.table("economy");

export const data = new SlashCommandBuilder()
  .setName("status")
  .setDescription("Affiche le statut de l'utilisateur façon Solo Leveling")
  .addUserOption((option) =>
    option.setName("target").setDescription("L'utilisateur ciblé")
  );

export async function execute(interaction) {
  try {
    await interaction.deferReply({ flags: 0 }).catch(() => {});

    const user = interaction.options.getUser("target") || interaction.user;
    const guildId = interaction.guild.id;
    const userData = await getUserDataFromDB(user.id, guildId);

    if (!userData) {
      await interaction.editReply({
        content: "❌ Impossible de récupérer les données de l'utilisateur.",
      });
      return;
    }

    async function getUserDataFromDB(userId, guildId) {
      // Implement the function to fetch user data from the database
      // This is a placeholder implementation
      return {
        rank: "Novice",
        level: 1,
      };
    }

    const canvas = createCanvas(900, 550);
    const ctx = canvas.getContext("2d");

    const backgroundLoaded = await drawBackground(ctx);
    if (!backgroundLoaded) {
      await interaction.editReply({
        content: "❌ Impossible de charger l'image de fond.",
      });
      return;
    }

    const avatar = await loadUserAvatar(user);
    drawAvatar(ctx, avatar);
    drawEnhancedUserInfo(ctx, user, userData);

    const attachment = new AttachmentBuilder(canvas.toBuffer(), {
      name: "status.png",
    });

    await interaction.editReply({ files: [attachment] }).catch(console.error);
  } catch (error) {
    console.error("❌ Erreur lors de l'affichage du status :", error);
    await interaction
      .editReply({ content: "❌ Une erreur est survenue." })
      .catch(console.error);
  }
}

async function drawBackground(ctx) {
  try {
    const background = await loadImage(
      "https://cdn.discordapp.com/attachments/1121875669807267891/1341562021270786140/IMG_1419.png?ex=67b86cbe&is=67b71b3e&hm=b43adf14090989c17087ae0a924f0909b80d1e98af90f34f3a17da1e7a699a49&"
    );
    ctx.drawImage(background, 0, 0, 900, 550);
    return true;
  } catch (error) {
    console.error("❌ Erreur de chargement de l'image de fond :", error);
    return false;
  }
}

async function loadUserAvatar(user) {
  try {
    const avatarURL = user.displayAvatarURL({ extension: "png", size: 256 });
    return await loadImage(avatarURL);
  } catch (error) {
    console.error("❌ Erreur de chargement de l'avatar :", error);
    return await loadImage(
      "https://cdn.discordapp.com/attachments/1121875669807267891/1341562021270786140/IMG_1419.png?ex=67b86cbe&is=67b71b3e&hm=b43adf14090989c17087ae0a924f0909b80d1e98af90f34f3a17da1e7a699a49&"
    );
  }
}

function drawAvatar(ctx, avatar) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(115, 115, 65, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(avatar, 50, 50, 130, 130);
  ctx.restore();
}

function drawEnhancedUserInfo(ctx, user, userData) {
  ctx.fillStyle = "rgba(10, 10, 60, 0.85)";
  ctx.fillRect(50, 50, 800, 450);

  ctx.fillStyle = "#FFD700";
  ctx.font = "bold 40px Arial";
  ctx.fillText("STATUS", 360, 90);

  const sections = [
    { label: "Nom", value: user.username, x: 100, y: 140 },
    { label: "ID", value: user.id, x: 100, y: 180 },
    { label: "Job", value: "Aventurier", x: 100, y: 220 },
    { label: "Titre", value: userData.rank, x: 100, y: 260 },
    { label: "Niveau", value: userData.level, x: 100, y: 300 },
    { label: "Fatigue", value: "0", x: 100, y: 340 },
  ];

  const stats = [
    { label: "Force", value: "10", x: 500, y: 140 },
    { label: "Agilité", value: "8", x: 500, y: 180 },
    { label: "Vitalité", value: "12", x: 500, y: 220 },
    { label: "Intelligence", value: "9", x: 500, y: 260 },
    { label: "Sens", value: "7", x: 500, y: 300 },
    { label: "Points Restants", value: "5", x: 500, y: 340 },
  ];

  sections.forEach((section) => {
    ctx.fillStyle = "#FFA500";
    ctx.font = "bold 26px Arial";
    ctx.fillText(`${section.label} :`, section.x, section.y);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(section.value, section.x + 200, section.y);
  });

  stats.forEach((stat) => {
    ctx.fillStyle = "#87CEEB";
    ctx.font = "bold 26px Arial";
    ctx.fillText(`${stat.label} :`, stat.x, stat.y);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(stat.value, stat.x + 150, stat.y);
  });
}
