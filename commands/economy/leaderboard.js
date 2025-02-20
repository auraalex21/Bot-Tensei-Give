import { SlashCommandBuilder, AttachmentBuilder } from "discord.js";
import { QuickDB } from "quick.db";
import { createCanvas, loadImage } from "canvas";

const db = new QuickDB();
const economyTable = db.table("economy");

export const data = new SlashCommandBuilder()
  .setName("leaderboard")
  .setDescription("Afficher le classement des utilisateurs par argent.");

export async function execute(interaction) {
  try {
    await interaction.deferReply(); // Évite l'expiration de l'interaction

    const allUsers = await economyTable.all();
    const sortedUsers = allUsers
      .filter((entry) => entry.id.startsWith("balance_"))
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
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content:
          "❌ Une erreur s'est produite lors de l'affichage du leaderboard.",
        ephemeral: true,
      });
    }
  }
}
