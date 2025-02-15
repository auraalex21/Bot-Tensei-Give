import { SlashCommandBuilder } from "discord.js";
import synchronizeSlashCommands from "discord-sync-commands";
import dotenv from "dotenv";

dotenv.config();

export const data = new SlashCommandBuilder()
  .setName("deploy")
  .setDescription("Synchroniser les commandes slash avec Discord");

export async function execute(interaction) {
  const client = interaction.client;

  try {
    await synchronizeSlashCommands(
      client,
      client.commands.map((c) => c.data.toJSON()),
      {
        debug: true,
        guildId: process.env.GUILD_ID,
      }
    );

    await interaction.reply({
      content: "✅ Commandes synchronisées avec succès.",
      ephemeral: true,
    });
  } catch (error) {
    console.error(
      "❌ Erreur lors de la synchronisation des commandes :",
      error
    );
    await interaction.reply({
      content: "❌ Erreur lors de la synchronisation des commandes.",
      ephemeral: true,
    });
  }
}
