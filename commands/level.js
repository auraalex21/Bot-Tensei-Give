import { SlashCommandBuilder } from "discord.js";
import { QuickDB } from "quick.db";
import { getUserLevel } from "../config/levels.js"; // Ensure this path is correct

const db = new QuickDB();

export default {
  data: new SlashCommandBuilder()
    .setName("level")
    .setDescription("Afficher le niveau d'un utilisateur")
    .addUserOption((option) =>
      option
        .setName("utilisateur")
        .setDescription("L'utilisateur dont vous voulez voir le niveau")
        .setRequired(true)
    ),

  async execute(interaction) {
    const user = interaction.options.getUser("utilisateur");
    const guildId = interaction.guild.id;

    const userData = await getUserLevel(user.id, guildId);

    if (!userData) {
      return interaction.reply({
        content: `:x: Aucune donnée trouvée pour ${user.tag}.`,
        ephemeral: true,
      });
    }

    interaction.reply({
      content: `${user.tag} est au niveau ${userData.level} avec ${userData.exp} points d'expérience.`,
      ephemeral: true,
    });
  },
};
