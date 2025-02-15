import {
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("candidature")
  .setDescription("Soumettre une candidature");

export async function execute(interaction) {
  const modal = new ModalBuilder()
    .setCustomId("candidatureModal")
    .setTitle("Soumettre une candidature");

  const nameInput = new TextInputBuilder()
    .setCustomId("nameInput")
    .setLabel("Votre Pseudo")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const ageInput = new TextInputBuilder()
    .setCustomId("ageInput")
    .setLabel("Votre âge")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const experienceInput = new TextInputBuilder()
    .setCustomId("experienceInput")
    .setLabel("Votre expérience")
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true);

  const firstActionRow = new ActionRowBuilder().addComponents(nameInput);
  const secondActionRow = new ActionRowBuilder().addComponents(ageInput);
  const thirdActionRow = new ActionRowBuilder().addComponents(experienceInput);

  modal.addComponents(firstActionRow, secondActionRow, thirdActionRow);

  try {
    await interaction.deferReply({ ephemeral: true });
    await interaction.showModal(modal);
    await interaction.followUp({
      content: "Le modal a été affiché avec succès.",
      ephemeral: true,
    });
  } catch (error) {
    console.error("Erreur lors de l'affichage du modal :", error);

    if (interaction.replied || interaction.deferred) {
      try {
        await interaction.followUp({
          content: "Il y a eu une erreur en affichant le modal.",
          ephemeral: true,
        });
      } catch (followUpError) {
        console.error("Erreur lors de l'envoi du follow-up :", followUpError);
      }
    } else {
      try {
        await interaction.reply({
          content: "Il y a eu une erreur en affichant le modal.",
          ephemeral: true,
        });
      } catch (replyError) {
        console.error("Erreur lors de l'envoi de la réponse :", replyError);
      }
    }
  }
}
