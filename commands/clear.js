const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("clear")
    .setDescription("Effacer un certain nombre de messages")
    .addIntegerOption((option) =>
      option
        .setName("nombre")
        .setDescription("Le nombre de messages à effacer")
        .setRequired(true)
    ),

  async execute(interaction) {
    const roleId = "1339230333953904751";
    const number = interaction.options.getInteger("nombre");

    if (!interaction.member.roles.cache.has(roleId)) {
      return interaction.reply({
        content: ":x: Vous n'avez pas la permission d'utiliser cette commande.",
        ephemeral: true,
      });
    }

    if (number < 1 || number > 100) {
      return interaction.reply({
        content: ":x: Vous devez spécifier un nombre entre 1 et 100.",
        ephemeral: true,
      });
    }

    const messages = await interaction.channel.messages.fetch({
      limit: number,
    });
    await interaction.channel.bulkDelete(messages, true);

    interaction.reply({
      content: `✅ ${number} message(s) supprimé(s).`,
      ephemeral: true,
    });
  },
};
