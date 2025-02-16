import {
  SlashCommandBuilder,
  AttachmentBuilder,
  PermissionsBitField,
} from "discord.js";
import { QuickDB } from "quick.db";
import { createCanvas } from "canvas";

const db = new QuickDB();

export const data = new SlashCommandBuilder()
  .setName("ban")
  .setDescription("Bannir un utilisateur")
  .addUserOption((option) =>
    option
      .setName("utilisateur")
      .setDescription("L'utilisateur à bannir")
      .setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName("raison")
      .setDescription("La raison du bannissement")
      .setRequired(false)
  );

export async function execute(interaction) {
  try {
    await interaction.deferReply({ ephemeral: true });

    if (
      !interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)
    ) {
      return interaction.editReply({
        content: "❌ Vous n'avez pas la permission de bannir des membres.",
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

    await member.ban({ reason });
    const bans = (await db.get(`bans_${user.id}`)) || [];
    bans.push({
      reason,
      date: new Date().toISOString(),
      moderatorId: interaction.user.id,
    });
    await db.set(`bans_${user.id}`, bans);

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
    ctx.fillText(`⛔ Bannissement`, 50, 60);

    ctx.font = "bold 26px Poppins";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(`👤 Utilisateur: ${user.tag}`, 50, 120);
    ctx.fillText(`📌 Raison: ${reason}`, 50, 160);
    ctx.fillText(`🔨 Modérateur: ${interaction.user.tag}`, 50, 200);

    const buffer = canvas.toBuffer();
    const attachment = new AttachmentBuilder(buffer, {
      name: "ban-info.png",
    });

    await interaction.editReply({ files: [attachment] });
    console.log(`✅ ${user.tag} a été banni pour la raison : ${reason}`);
  } catch (error) {
    console.error("❌ Erreur lors de l'exécution de la commande ban :", error);
    await interaction.editReply({
      content:
        "❌ Une erreur s'est produite lors de l'exécution de cette commande.",
      ephemeral: true,
    });
  }
}
