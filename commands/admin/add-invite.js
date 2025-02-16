import { SlashCommandBuilder, AttachmentBuilder } from "discord.js";
import { addInvite, getInvites } from "../../config/invites.js";
import { createCanvas } from "canvas";

export const data = new SlashCommandBuilder()
  .setName("add-invite")
  .setDescription("Ajouter un nombre d'invitations à un utilisateur")
  .addUserOption((option) =>
    option
      .setName("utilisateur")
      .setDescription("L'utilisateur à qui ajouter des invitations")
      .setRequired(true)
  )
  .addIntegerOption((option) =>
    option
      .setName("nombre")
      .setDescription("Le nombre d'invitations à ajouter")
      .setRequired(true)
  );

export async function execute(interaction) {
  try {
    await interaction.deferReply({ ephemeral: true });

    const user = interaction.options.getUser("utilisateur");
    const nombre = interaction.options.getInteger("nombre");

    if (!user) {
      await interaction.editReply({
        content: "❌ Erreur : Utilisateur non trouvé.",
        ephemeral: true,
      });
      return;
    }

    await addInvite(user.id, interaction.guild.id, nombre);
    const invites = await getInvites(user.id, interaction.guild.id);

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
    ctx.fillText(`🎉 Invitations mises à jour`, 50, 60);

    ctx.font = "bold 26px Arial"; // Use a default font
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(`👤 Utilisateur: ${user.tag}`, 50, 120);
    ctx.fillText(`➕ Ajout: ${nombre} invitations`, 50, 160);
    ctx.fillText(`📊 Total: ${invites} invitations`, 50, 200);

    const buffer = canvas.toBuffer();
    const attachment = new AttachmentBuilder(buffer, {
      name: "add-invite.png",
    });

    await interaction.editReply({ files: [attachment] });
    console.log(`✅ ${nombre} invitations ajoutées à ${user.tag}`);
  } catch (error) {
    console.error(
      "❌ Erreur lors de l'exécution de la commande add-invite :",
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
