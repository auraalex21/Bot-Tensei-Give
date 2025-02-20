import { SlashCommandBuilder, AttachmentBuilder } from "discord.js";
import { QuickDB } from "quick.db";
import { createCanvas, loadImage } from "canvas";

const db = new QuickDB();
const economyTable = db.table("economy");
const excludedUserId = "ID_DU_UTILISATEUR_A_EXCLURE"; // Remplacez par l'ID de l'utilisateur à exclure

export const data = new SlashCommandBuilder()
  .setName("leaderboard-money")
  .setDescription("Afficher le classement des utilisateurs par argent.");

export async function execute(interaction) {
  try {
    await interaction.deferReply(); // Évite l'expiration de l'interaction

    const allUsers = await economyTable.all();
    const sortedUsers = allUsers
      .filter(
        (entry) =>
          entry.id.startsWith("balance_") &&
          entry.id.split("_")[1] !== excludedUserId
      )
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    const width = 800;
    const height = 600;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Arrière-plan galaxie bleue
    const background = await loadImage(
      "https://cdn.discordapp.com/attachments/1339309785400737853/1341659383326838845/Tensei.png?ex=67b775eb&is=67b6246b&hm=3f5efc89e4b390d2eacb0cdc08c65742f890ed8e0bd4667e4e65a5adc177dacf&"
    );
    ctx.drawImage(background, 0, 0, width, height);

    // Titre du leaderboard
    ctx.font = "bold 40px Arial";
    ctx.fillStyle = "#FFD700";
    ctx.fillText("💰 Classement des Riches", 50, 50);

    // Affichage des utilisateurs
    ctx.font = "bold 20px Arial";
    ctx.fillStyle = "#FFFFFF";
    for (let i = 0; i < sortedUsers.length; i++) {
      const userId = sortedUsers[i].id.split("_")[1];
      const user = await interaction.client.users.fetch(userId);
      const balance = sortedUsers[i].value;
      const y = 100 + i * 45;

      // Fond semi-transparent pour améliorer la lisibilité
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(40, y - 20, 720, 35);

      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(`${i + 1}. ${user.username}`, 50, y);
      ctx.fillText(`💸 ${balance}`, 600, y);
    }

    const buffer = canvas.toBuffer();
    const attachment = new AttachmentBuilder(buffer, {
      name: "leaderboard.png",
    });

    await interaction.editReply({ files: [attachment] });
  } catch (error) {
    console.error("❌ Erreur lors de l'affichage du leaderboard :", error);
    if (interaction.deferred) {
      await interaction.editReply({
        content:
          "❌ Une erreur s'est produite lors de l'affichage du leaderboard.",
      });
    } else if (!interaction.replied) {
      await interaction.reply({
        content:
          "❌ Une erreur s'est produite lors de l'affichage du leaderboard.",
        ephemeral: true,
      });
    }
  }
}
