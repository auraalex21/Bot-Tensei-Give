import {
  SlashCommandBuilder,
  AttachmentBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { QuickDB } from "quick.db";
import { createCanvas } from "canvas";

const db = new QuickDB();

export const data = new SlashCommandBuilder()
  .setName("user-info")
  .setDescription("Afficher les informations d'un utilisateur")
  .addUserOption((option) =>
    option
      .setName("utilisateur")
      .setDescription("L'utilisateur dont vous voulez voir les informations")
      .setRequired(false)
  );

export async function execute(interaction) {
  try {
    await interaction.deferReply({ ephemeral: true });

    const user = interaction.options.getUser("utilisateur") || interaction.user;
    const member = interaction.guild
      ? interaction.guild.members.cache.get(user.id)
      : null;

    if (!user) {
      await interaction.editReply({
        content: "❌ Erreur : Utilisateur non trouvé.",
        ephemeral: true,
      });
      return;
    }

    if (!interaction.member.roles.cache.has("1339302664692826193")) {
      return interaction.editReply({
        content:
          "❌ Vous n'avez pas la permission de voir les sanctions des utilisateurs.",
        ephemeral: true,
      });
    }

    const warnings = (await db.get(`warnings_${user.id}`)) || [];
    const kicks = (await db.get(`kicks_${user.id}`)) || 0;
    const timeouts = (await db.get(`timeouts_${user.id}`)) || 0;
    const bans = (await db.get(`bans_${user.id}`)) || 0;

    const width = 800;
    const height = 500;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Fond en dégradé
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
    ctx.fillText(`📋 Sanctions de ${user.tag}`, 50, 60);

    ctx.font = "bold 24px Arial"; // Use a default font
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(`🔹 Avertissements: ${warnings.length}`, 50, 120);
    ctx.fillText(`🔹 Expulsions: ${kicks}`, 50, 160);
    ctx.fillText(`🔹 Timeouts: ${timeouts}`, 50, 200);
    ctx.fillText(`🔹 Bannissements: ${bans}`, 50, 240);

    const buffer = canvas.toBuffer();
    const attachment = new AttachmentBuilder(buffer, {
      name: "user-info.png",
    });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("show_warnings")
        .setLabel("📜 Avertissements")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("show_kicks")
        .setLabel("🚪 Expulsions")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("show_timeouts")
        .setLabel("⏳ Timeouts")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("show_bans")
        .setLabel("⛔ Bannissements")
        .setStyle(ButtonStyle.Primary)
    );

    const reply = await interaction.editReply({
      files: [attachment],
      components: [row],
    });

    const collector = reply.createMessageComponentCollector({ time: 60000 });

    collector.on("collect", async (buttonInteraction) => {
      if (buttonInteraction.user.id !== interaction.user.id) return;

      let messageContent = "";
      switch (buttonInteraction.customId) {
        case "show_warnings":
          messageContent = warnings.length
            ? warnings
                .map(
                  (w, index) =>
                    `⚠️ ${index + 1}. Raison: ${
                      w.reason || "Non spécifiée"
                    }, Date: ${new Date(w.date).toLocaleString()}`
                )
                .join("\n")
            : "✅ Aucun avertissement.";
          break;
        case "show_kicks":
          messageContent = kicks
            ? `🚪 ${kicks} expulsion(s) effectuée(s).`
            : "✅ Aucune expulsion.";
          break;
        case "show_timeouts":
          messageContent = timeouts
            ? `⏳ ${timeouts} timeout(s) appliqué(s).`
            : "✅ Aucun timeout.";
          break;
        case "show_bans":
          messageContent = bans
            ? `⛔ ${bans} bannissement(s) enregistré(s).`
            : "✅ Aucun bannissement.";
          break;
      }

      await buttonInteraction.reply({
        content: messageContent,
        ephemeral: true,
      });
    });
  } catch (error) {
    console.error(
      "❌ Erreur lors de l'exécution de la commande user-info :",
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
