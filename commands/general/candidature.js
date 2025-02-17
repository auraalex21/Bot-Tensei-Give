import {
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from "discord.js";

const activeInteractions = new Set();

export const data = new SlashCommandBuilder()
  .setName("candidature")
  .setDescription("Envoyer une candidature de staff");

export async function execute(interaction) {
  if (activeInteractions.has(interaction.user.id)) return;
  activeInteractions.add(interaction.user.id);

  try {
    const modal = new ModalBuilder()
      .setCustomId("candidatureModal")
      .setTitle("📩 Candidature de Staff");

    const pseudoInput = new TextInputBuilder()
      .setCustomId("pseudoInput")
      .setLabel("Votre Pseudo")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const experienceInput = new TextInputBuilder()
      .setCustomId("experienceInput")
      .setLabel("Expérience en modération")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    const motivationInput = new TextInputBuilder()
      .setCustomId("motivationInput")
      .setLabel("Pourquoi devenir staff ?")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(pseudoInput),
      new ActionRowBuilder().addComponents(experienceInput),
      new ActionRowBuilder().addComponents(motivationInput)
    );

    await interaction.showModal(modal);
  } catch (error) {
    console.error("Erreur d'affichage du modal:", error);
  } finally {
    setTimeout(() => activeInteractions.delete(interaction.user.id), 5000);
  }
}

export async function handleModalSubmit(interaction) {
  try {
    let pseudo = interaction.fields.getTextInputValue("pseudoInput");
    const experience = interaction.fields.getTextInputValue("experienceInput");
    const motivation = interaction.fields.getTextInputValue("motivationInput");

    if (pseudo.length > 20) pseudo = pseudo.slice(0, 17) + "...";

    // 📌 Création de l'embed
    const embed = new EmbedBuilder()
      .setColor("#00A2FF")
      .setTitle("📩 Nouvelle Candidature de Staff")
      .addFields(
        { name: "👤 Pseudo", value: pseudo, inline: false },
        {
          name: "📌 Expérience en modération",
          value: experience,
          inline: false,
        },
        { name: "🔥 Motivation", value: motivation, inline: false }
      )
      .setFooter({
        text: `Candidature envoyée par ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setTimestamp();

    // 🔘 Boutons d'acceptation/refus
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("acceptCandidature")
        .setLabel("✅ Accepter")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("rejectCandidature")
        .setLabel("❌ Refuser")
        .setStyle(ButtonStyle.Danger)
    );

    // 📢 Envoi de l'embed dans le bon canal
    const channel = interaction.client.channels.cache.get("659699739532460042");
    if (channel) {
      await channel.send({ embeds: [embed], components: [row] });
      await interaction.reply({
        content: "✅ Votre candidature a été envoyée avec succès.",
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: "❌ Erreur: Salon introuvable.",
        ephemeral: true,
      });
    }
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi de la candidature:", error);
    await interaction.reply({
      content:
        "❌ Une erreur est survenue lors de l'envoi de votre candidature.",
      ephemeral: true,
    });
  }
}
