import {
  SlashCommandBuilder,
  AttachmentBuilder,
  PermissionsBitField,
} from "discord.js";
import { QuickDB } from "quick.db";
import { createCanvas } from "canvas";

const db = new QuickDB();

export const data = new SlashCommandBuilder()
  .setName("timeout")
  .setDescription("Mettre un utilisateur en timeout")
  .addUserOption((option) =>
    option
      .setName("utilisateur")
      .setDescription("L'utilisateur à mettre en timeout")
      .setRequired(true)
  )
  .addIntegerOption((option) =>
    option
      .setName("durée")
      .setDescription("La durée du timeout (en minutes)")
      .setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName("raison")
      .setDescription("La raison du timeout")
      .setRequired(false)
  );

export async function execute(interaction) {
  try {
    await interaction.deferReply({ ephemeral: true });

    if (
      !interaction.member.permissions.has(
        PermissionsBitField.Flags.ModerateMembers
      )
    ) {
      return interaction.editReply({
        content:
          "❌ Vous n'avez pas la permission de mettre des membres en timeout.",
        ephemeral: true,
      });
    }

    const user = interaction.options.getUser("utilisateur");
    const duration = interaction.options.getInteger("durée");
    const reason =
      interaction.options.getString("raison") || "Aucune raison fournie";

    const member = interaction.guild.members.cache.get(user.id);
    if (!member) {
      return interaction.editReply({
        content: "❌ Utilisateur non trouvé.",
        ephemeral: true,
      });
    }

    await member.timeout(duration * 60 * 1000, reason);
    const timeouts = (await db.get(`timeouts_${user.id}`)) || [];
    timeouts.push({
      reason,
      date: new Date().toISOString(),
      moderatorId: interaction.user.id,
    });
    await db.set(`timeouts_${user.id}`, timeouts);

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
    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 8;
    ctx.roundRect(10, 10, width - 20, height - 20, 20);
    ctx.stroke();

    // Texte principal
    ctx.font = "bold 32px Poppins";
    ctx.fillStyle = "#FFD700";
    ctx.fillText(`⏳ Timeout Appliqué`, 50, 60);

    ctx.font = "bold 26px Poppins";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(`👤 Utilisateur: ${user.tag}`, 50, 120);
    ctx.fillText(`⏱ Durée: ${duration} minute(s)`, 50, 160);
    ctx.fillText(`📌 Raison: ${reason}`, 50, 200);

    const buffer = canvas.toBuffer();
    const attachment = new AttachmentBuilder(buffer, {
      name: "timeout-info.png",
    });

    await interaction.editReply({ files: [attachment] });
    console.log(
      `✅ ${user.tag} a été mis en timeout pour ${duration} minute(s). Raison : ${reason}`
    );
  } catch (error) {
    console.error(
      "❌ Erreur lors de l'exécution de la commande timeout :",
      error
    );
    await interaction.editReply({
      content:
        "❌ Une erreur s'est produite lors de l'exécution de cette commande.",
      ephemeral: true,
    });
  }
}
