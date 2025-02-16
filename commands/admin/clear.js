import { SlashCommandBuilder, AttachmentBuilder } from "discord.js";
import { createCanvas } from "canvas";

export const data = new SlashCommandBuilder()
  .setName("clear")
  .setDescription("Effacer un certain nombre de messages")
  .addIntegerOption((option) =>
    option
      .setName("nombre")
      .setDescription("Le nombre de messages à effacer")
      .setRequired(true)
  );

export async function execute(interaction) {
  try {
    await interaction.deferReply({ ephemeral: true });

    const roleId = "1339230333953904751";
    const number = interaction.options.getInteger("nombre");

    if (!interaction.member.roles.cache.has(roleId)) {
      return interaction.editReply({
        content: "❌ Vous n'avez pas la permission d'utiliser cette commande.",
        ephemeral: true,
      });
    }

    if (number < 1 || number > 100) {
      return interaction.editReply({
        content: "❌ Vous devez spécifier un nombre entre 1 et 100.",
        ephemeral: true,
      });
    }

    const messages = await interaction.channel.messages.fetch({
      limit: number,
    });
    await interaction.channel.bulkDelete(messages, true);

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
    ctx.fillText(`🧹 Nettoyage terminé`, 50, 60);

    ctx.font = "bold 26px Arial"; // Use a default font
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(`📌 Messages supprimés: ${number}`, 50, 120);
    ctx.fillText(`👤 Modérateur: ${interaction.user.tag}`, 50, 160);

    const buffer = canvas.toBuffer();
    const attachment = new AttachmentBuilder(buffer, {
      name: "clear-info.png",
    });

    await interaction.editReply({ files: [attachment] });
    console.log(
      `✅ ${number} message(s) supprimé(s) par ${interaction.user.tag}`
    );
  } catch (error) {
    console.error(
      "❌ Erreur lors de l'exécution de la commande clear :",
      error
    );
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content:
          "❌ Une erreur s'est produite lors de l'exécution de cette commande.",
        ephemeral: true,
      });
    }
  }
}
