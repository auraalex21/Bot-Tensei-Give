import { SlashCommandBuilder, AttachmentBuilder } from "discord.js";
import { createCanvas, loadImage } from "canvas";
import { QuickDB } from "quick.db";

const db = new QuickDB();

export const data = new SlashCommandBuilder()
  .setName("status")
  .setDescription("Affiche un statut détaillé façon Solo Leveling")
  .addUserOption((option) =>
    option.setName("target").setDescription("L'utilisateur ciblé")
  );

export async function execute(interaction) {
  try {
    await interaction.deferReply();
    const user = interaction.options.getUser("target") || interaction.user;
    const guildId = interaction.guild.id;
    const userData = await getUserData(user.id, guildId);

    if (!userData) {
      return interaction.editReply({
        content: "❌ Impossible de récupérer les données de l'utilisateur.",
      });
    }

    const canvas = createCanvas(900, 600);
    const ctx = canvas.getContext("2d");

    if (!(await drawBackground(ctx))) {
      return interaction.editReply({
        content: "❌ Impossible de charger l'image de fond.",
      });
    }

    drawUserInfo(ctx, user, userData);
    const avatar = await loadUserAvatar(user);
    drawAvatar(ctx, avatar);

    const attachment = new AttachmentBuilder(canvas.toBuffer(), {
      name: "status.png",
    });

    await interaction.editReply({ files: [attachment] });
  } catch (error) {
    console.error("❌ Erreur lors de l'affichage du status :", error);
    await interaction.editReply({ content: "❌ Une erreur est survenue." });
  }
}

async function getUserData(userId, guildId) {
  try {
    return { rank: "Débutant", level: 1 };
  } catch (error) {
    console.error(
      "❌ Erreur lors de la récupération des données utilisateur :",
      error
    );
    return null;
  }
}

async function drawBackground(ctx) {
  try {
    const background = await loadImage(
      "https://cdn.discordapp.com/attachments/1121875669807267891/1341562021270786140/IMG_1419.png?ex=67ba66fe&is=67b9157e&hm=badbb8e267793f17a7f4c804c1cb2945c5700cc81d662d5ccccfc7e3b34e82dc&"
    );
    ctx.drawImage(background, 0, 0, 900, 600);
    return true;
  } catch (error) {
    console.error("❌ Erreur de chargement de l'image de fond :", error);
    return false;
  }
}

async function loadUserAvatar(user) {
  try {
    return await loadImage(
      user.displayAvatarURL({ extension: "png", size: 256 })
    );
  } catch (error) {
    console.error("❌ Erreur de chargement de l'avatar :", error);
    return await loadImage("https://cdn.discordapp.com/embed/avatars/0.png");
  }
}

function drawAvatar(ctx, avatar) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(90, 90, 65, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(avatar, 50, 50, 130, 130);
  ctx.restore();
}

function drawUserInfo(ctx, user, userData) {
  ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
  ctx.fillRect(40, 40, 820, 520);
  ctx.strokeStyle = "#FFD700";
  ctx.lineWidth = 4;
  ctx.strokeRect(40, 40, 820, 520);

  ctx.fillStyle = "#FFD700";
  ctx.font = "bold 42px Arial";
  ctx.shadowColor = "#FFD700";
  ctx.shadowBlur = 15;
  ctx.fillText("STATUS", 360, 80);
  ctx.shadowBlur = 0;

  const sections = [
    { label: "Nom", value: user.username, x: 150, y: 140 },
    { label: "ID", value: user.id, x: 150, y: 180 },
    { label: "Titre", value: userData.rank, x: 150, y: 260 },
    { label: "Niveau", value: userData.level, x: 150, y: 300 },
  ];

  sections.forEach((section) => {
    ctx.fillStyle = "#FFA500";
    ctx.font = "bold 30px Arial";
    ctx.fillText(`${section.label} :`, section.x, section.y);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 28px Arial";
    ctx.fillText(section.value, section.x + 250, section.y);
  });
}
