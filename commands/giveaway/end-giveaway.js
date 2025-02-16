import { SlashCommandBuilder, AttachmentBuilder } from "discord.js";
import { QuickDB } from "quick.db";
import { createCanvas } from "canvas";

const db = new QuickDB();

export const data = new SlashCommandBuilder()
  .setName("end-giveaway")
  .setDescription("Terminer un giveaway")
  .addStringOption((option) =>
    option
      .setName("giveaway_id")
      .setDescription("L'ID du giveaway à terminer")
      .setRequired(true)
  );

export async function execute(interaction) {
  try {
    await interaction.deferReply({ ephemeral: true });

    const giveawayId = interaction.options.getString("giveaway_id");
    const giveaway = await db.get(`giveaways.${giveawayId}`);

    if (!giveaway) {
      return interaction.editReply({
        content: "❌ Giveaway non trouvé.",
        ephemeral: true,
      });
    }

    interaction.client.giveawaysManager.end(giveawayId);

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
    ctx.strokeStyle = "#FF0000";
    ctx.lineWidth = 8;
    ctx.roundRect(10, 10, width - 20, height - 20, 20);
    ctx.stroke();

    // Texte principal
    ctx.font = "bold 32px Poppins";
    ctx.fillStyle = "#FF0000";
    ctx.fillText(`🎁 Giveaway Terminé`, 50, 60);

    ctx.font = "bold 26px Poppins";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(`🏆 ID: ${giveawayId}`, 50, 120);
    ctx.fillText(`🎁 Prix: ${giveaway.prize}`, 50, 160);
    ctx.fillText(`📢 Canal: ${giveaway.channel}`, 50, 200);

    const buffer = canvas.toBuffer();
    const attachment = new AttachmentBuilder(buffer, {
      name: "end-giveaway.png",
    });

    await interaction.editReply({ files: [attachment] });

    console.log(`✅ Giveaway avec l'ID ${giveawayId} terminé.`);
  } catch (error) {
    console.error(
      "❌ Erreur lors de l'exécution de la commande end-giveaway :",
      error
    );
    await interaction.editReply({
      content:
        "❌ Une erreur s'est produite lors de l'exécution de cette commande.",
      ephemeral: true,
    });
  }
}
