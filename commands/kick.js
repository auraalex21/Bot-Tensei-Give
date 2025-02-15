import {
  SlashCommandBuilder,
  AttachmentBuilder,
  PermissionsBitField,
} from "discord.js";
import { createCanvas } from "canvas";

export const data = new SlashCommandBuilder()
  .setName("kick")
  .setDescription("Expulser un utilisateur")
  .addUserOption((option) =>
    option
      .setName("utilisateur")
      .setDescription("L'utilisateur à expulser")
      .setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName("raison")
      .setDescription("La raison de l'expulsion")
      .setRequired(false)
  );

export async function execute(interaction) {
  try {
    await interaction.deferReply({ ephemeral: true });

    if (
      !interaction.member.permissions.has(PermissionsBitField.Flags.KickMembers)
    ) {
      return interaction.editReply({
        content: "❌ Vous n'avez pas la permission d'expulser des membres.",
        ephemeral: true,
      });
    }

    const user = interaction.options.getUser("utilisateur");
    const reason =
      interaction.options.getString("raison") || "Aucune raison fournie";

    const member = interaction.guild.members.cache.get(user.id);
    if (!member) {
      return interaction.editReply({
        content: "❌ Utilisateur non trouvé.",
        ephemeral: true,
      });
    }

    await member.kick(reason);

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
    ctx.strokeStyle = "#FFA500";
    ctx.lineWidth = 8;
    ctx.roundRect(10, 10, width - 20, height - 20, 20);
    ctx.stroke();

    // Texte principal
    ctx.font = "bold 32px Arial"; // Use a default font
    ctx.fillStyle = "#FFA500";
    ctx.fillText(`🚪 Expulsion`, 50, 60);

    ctx.font = "bold 26px Arial"; // Use a default font
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(`👤 Utilisateur: ${user.tag}`, 50, 120);
    ctx.fillText(`📌 Raison: ${reason}`, 50, 160);
    ctx.fillText(`🔨 Modérateur: ${interaction.user.tag}`, 50, 200);

    const buffer = canvas.toBuffer();
    const attachment = new AttachmentBuilder(buffer, {
      name: "kick-info.png",
    });

    await interaction.editReply({ files: [attachment] });
    console.log(`✅ ${user.tag} a été expulsé. Raison : ${reason}`);
  } catch (error) {
    console.error("❌ Erreur lors de l'exécution de la commande kick :", error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content:
          "❌ Une erreur s'est produite lors de l'exécution de cette commande.",
        ephemeral: true,
      });
    }
  }
}
