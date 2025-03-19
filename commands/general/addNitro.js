import { SlashCommandBuilder, AttachmentBuilder } from "discord.js";
import { QuickDB } from "quick.db";
import { createCanvas } from "canvas";

const db = new QuickDB();
const nitroTable = db.table("nitro");

export const data = new SlashCommandBuilder()
  .setName("add-nitro")
  .setDescription("Ajoute un code Nitro dans la base de données.")
  .addStringOption((option) =>
    option
      .setName("code")
      .setDescription("Le code Nitro à ajouter.")
      .setRequired(true)
  )
  .addIntegerOption((option) =>
    option
      .setName("stock")
      .setDescription("Le nombre de Nitro à ajouter au stock.")
      .setRequired(true)
  );

export async function execute(interaction) {
  console.log(
    `📩 Commande reçue : add-nitro - Interaction ID: ${interaction.id}`
  );

  try {
    await interaction.deferReply({ ephemeral: true });

    const userId = interaction.user.id;

    // Vérifie si l'utilisateur est autorisé
    if (userId !== "378998346712481812") {
      return await interaction.editReply({
        content: "❌ Vous n'êtes pas autorisé à utiliser cette commande.",
      });
    }

    const code = interaction.options.getString("code");
    const stock = interaction.options.getInteger("stock");

    // Sauvegarde dans la base de données
    await nitroTable.set("code", code);
    await nitroTable.set("stock", stock);

    // Création du canvas
    const width = 800;
    const height = 400;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Fond
    ctx.fillStyle = "#1E1E2E";
    ctx.fillRect(0, 0, width, height);

    // Bordure
    ctx.strokeStyle = "#FF5733";
    ctx.lineWidth = 8;
    ctx.strokeRect(10, 10, width - 20, height - 20);

    // Texte principal
    ctx.font = "bold 36px Arial";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText("🎉 Code Nitro Ajouté !", 40, 60);

    // Texte Code
    ctx.font = "bold 26px Arial";
    ctx.fillStyle = "#FFD700";
    ctx.fillText("🔑 Code:", 40, 140);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(code, 200, 140);

    // Texte Stock
    ctx.fillStyle = "#FFD700";
    ctx.fillText("📦 Stock:", 40, 240);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(`${stock} unité(s)`, 200, 240);

    // Conversion en buffer
    const buffer = canvas.toBuffer();
    const attachment = new AttachmentBuilder(buffer, { name: "nitro.png" });

    await interaction.editReply({
      content: `✅ Le code Nitro a été ajouté avec succès !`,
      files: [attachment],
    });

    console.log(`✅ Code Nitro ajouté : ${code} avec un stock de ${stock}`);
  } catch (error) {
    console.error(
      "❌ Erreur lors de l'exécution de la commande add-nitro :",
      error
    );

    if (!interaction.replied && !interaction.deferred) {
      try {
        await interaction.reply({
          content:
            "🚨 Une erreur s'est produite lors de l'exécution de la commande.",
          ephemeral: true,
        });
      } catch (replyError) {
        console.error(
          "❌ Impossible d'envoyer un message d'erreur :",
          replyError
        );
      }
    }
  }
}
