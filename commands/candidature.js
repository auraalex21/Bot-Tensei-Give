const {
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("candidature")
    .setDescription("Soumettre une candidature"),

  async execute(interaction) {
    const modal = new ModalBuilder()
      .setCustomId("candidatureModal")
      .setTitle("Soumettre une candidature");

    const nameInput = new TextInputBuilder()
      .setCustomId("nameInput")
      .setLabel("Votre Pseudo")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const experienceInput = new TextInputBuilder()
      .setCustomId("experienceInput")
      .setLabel("Votre expérience")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    const motivationInput = new TextInputBuilder()
      .setCustomId("motivationInput")
      .setLabel("Votre motivation")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(nameInput),
      new ActionRowBuilder().addComponents(experienceInput),
      new ActionRowBuilder().addComponents(motivationInput)
    );

    await interaction.showModal(modal);
  },
};
