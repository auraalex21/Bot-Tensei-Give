import { SlashCommandBuilder, AttachmentBuilder } from "discord.js";
import { QuickDB } from "quick.db";
import { createCanvas, loadImage } from "canvas";
import fs from "fs";
import path from "path";
import fetch from "node-fetch";

// Initialisation de la base de données
const db = new QuickDB();
const economyTable = db.table("economy");

// ID de l'utilisateur à exclure du leaderboard
const excludedUserId = "378998346712481812";

// Définition de la commande
export const data = new SlashCommandBuilder()
  .setName("leaderboard-money")
  .setDescription("Afficher le classement des utilisateurs par argent.");

export async function execute(interaction) {
  try {
    if (!interaction.isCommand()) return;

    // ✅ Empêche l'expiration de l'interaction en la différant immédiatement
    await interaction.deferReply();

    // 🔄 Récupération des utilisateurs et tri par balance
    const allUsers = await economyTable.all();
    console.log("All Users:", allUsers); // Log all users before filtering and sorting

    const sortedUsers = allUsers
      .filter(
        (entry) =>
          entry.id.startsWith("balance_") &&
          entry.id.split("_")[1] !== excludedUserId &&
          typeof entry.value === "number"
      )
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10

    console.log("Sorted Users:", sortedUsers); // Log sorted users

    // 📌 Vérifier si le classement est vide
    if (sortedUsers.length === 0) {
      return await interaction.editReply(
        "❌ Aucun utilisateur n'a d'argent enregistré."
      );
    }

    // 📐 Définition des dimensions du canvas
    const width = 800;
    const height = 600;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // 🎨 **Remplir le fond avec une couleur noire**
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, width, height);

    // 🏆 **Affichage du titre**
    ctx.font = "bold 40px Arial";
    ctx.fillStyle = "#FFD700";
    ctx.fillText("💰 Classement des Riches", 50, 50);

    // 📊 **Affichage des joueurs**
    ctx.font = "bold 20px Arial";
    ctx.fillStyle = "#FFFFFF";
    for (let i = 0; i < sortedUsers.length; i++) {
      const userId = sortedUsers[i].id.split("_")[1];
      const user = await interaction.client.users.fetch(userId);
      const balance = sortedUsers[i].value;
      const y = 100 + i * 45;

      // 🎨 **Fond semi-transparent**
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(40, y - 20, 720, 35);

      // 🏆 **Affichage du nom et de la balance**
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(`${i + 1}. ${user.username}`, 50, y);
      ctx.fillText(`💸 ${balance}`, 600, y);
    }

    // 📷 **Conversion du Canvas en image**
    const imageBuffer = canvas.toBuffer();
    const attachment = new AttachmentBuilder(imageBuffer, {
      name: "leaderboard.png",
    });

    // ✅ Modifier la réponse initiale avec l'image finale
    await interaction.editReply({
      content: "🏆 Voici le classement des plus riches !",
      files: [attachment],
    });
  } catch (error) {
    console.error("❌ Erreur lors de l'affichage du leaderboard:", error);

    // ✅ Vérification avant d'éditer la réponse (évite l'erreur "Interaction has already been acknowledged")
    if (interaction.deferred) {
      await interaction.editReply(
        "❌ Une erreur s'est produite lors de l'affichage du leaderboard."
      );
    }
  }
}
