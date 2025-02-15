import { QuickDB } from "quick.db";
import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} from "discord.js";

const db = new QuickDB();

export default async (client, interaction) => {
  if (!interaction.isCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) return;

  try {
    console.log(`Commande reçue : ${interaction.commandName}`);
    await command.execute(interaction);
  } catch (error) {
    console.error(error);

    if (interaction.replied || interaction.deferred) {
      try {
        await interaction.followUp({
          content: "Il y a eu une erreur en exécutant cette commande.",
          ephemeral: true,
        });
      } catch (followUpError) {
        console.error("Erreur lors de l'envoi du follow-up :", followUpError);
      }
    } else {
      try {
        await interaction.reply({
          content: "Il y a eu une erreur en exécutant cette commande.",
          ephemeral: true,
        });
      } catch (replyError) {
        console.error("Erreur lors de l'envoi de la réponse :", replyError);
      }
    }
  }
};
