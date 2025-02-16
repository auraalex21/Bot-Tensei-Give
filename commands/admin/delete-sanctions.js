import { SlashCommandBuilder, AttachmentBuilder } from "discord.js";
import { QuickDB } from "quick.db";
import { createCanvas } from "canvas";

const db = new QuickDB();

export const data = new SlashCommandBuilder()
  .setName("delete-sanctions")
  .setDescription("Supprimer une ou toutes les sanctions d'un utilisateur")
  .addUserOption((option) =>
    option
      .setName("utilisateur")
      .setDescription("L'utilisateur dont vous voulez supprimer la sanction")
      .setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName("type")
      .setDescription("Le type de sanction à supprimer")
      .setRequired(true)
      .addChoices(
        { name: "Warn", value: "warnings" },
        { name: "Kick", value: "kicks" },
        { name: "Timeout", value: "timeouts" },
        { name: "Ban", value: "bans" }
      )
  )
  .addStringOption((option) =>
    option
      .setName("index")
      .setDescription(
        "L'index de la sanction à supprimer (commence à 1) ou 'all' pour tout supprimer"
      )
      .setRequired(true)
  );

export async function execute(interaction) {
  try {
    await interaction.deferReply({ flags: 64 }); // Use flags instead of ephemeral

    const user = interaction.options.getUser("utilisateur");
    const type = interaction.options.getString("type");
    const index = interaction.options.getString("index");

    let sanctions = (await db.get(`${type}_${user.id}`)) || [];

    if (index.toLowerCase() === "all") {
      sanctions = [];
    } else {
      const sanctionIndex = parseInt(index) - 1;
      if (
        isNaN(sanctionIndex) ||
        sanctionIndex < 0 ||
        sanctionIndex >= sanctions.length
      ) {
        return interaction.editReply({
          content: "❌ Index de sanction invalide.",
          flags: 64, // Use flags instead of ephemeral
        });
      }
      sanctions.splice(sanctionIndex, 1);
    }

    await db.set(`${type}_${user.id}`, sanctions);

    const width = 700;
    const height = 250;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Fond avec un dégradé bleu foncé
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#0A192F");
    gradient.addColorStop(1, "#001F3F");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Bordure stylisée
    ctx.strokeStyle = "#00A2FF";
    ctx.lineWidth = 8;
    ctx.roundRect(10, 10, width - 20, height - 20, 20);
    ctx.stroke();

    // Texte principal
    ctx.font = "bold 32px Arial"; // Use a default font
    ctx.fillStyle = "#00A2FF";
    ctx.fillText(
      `🛑 Sanction${index.toLowerCase() === "all" ? "s" : ""} supprimée${
        index.toLowerCase() === "all" ? "s" : ""
      }`,
      50,
      60
    );

    ctx.font = "bold 26px Arial"; // Use a default font
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(`👤 Utilisateur: ${user.tag}`, 50, 120);
    ctx.fillText(
      `✅ La sanction${
        index.toLowerCase() === "all" ? "s" : ""
      } a été supprimée${index.toLowerCase() === "all" ? "s" : ""}`,
      50,
      160
    );

    const buffer = canvas.toBuffer();
    const attachment = new AttachmentBuilder(buffer, {
      name: "delete-sanction.png",
    });

    await interaction.editReply({ files: [attachment] });
    console.log(
      `✅ Sanction${index.toLowerCase() === "all" ? "s" : ""} supprimée${
        index.toLowerCase() === "all" ? "s" : ""
      } pour ${user.tag}`
    );
  } catch (error) {
    console.error(
      "❌ Erreur lors de l'exécution de la commande delete-sanctions :",
      error
    );
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content:
          "❌ Une erreur s'est produite lors de l'exécution de cette commande.",
        flags: 64, // Use flags instead of ephemeral
      });
    }
  }
}
