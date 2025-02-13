const Discord = require("discord.js");

module.exports = {
  description: "Supprimer un nombre spécifié de messages",

  options: [
    {
      name: "nombre",
      description: "Le nombre de messages à supprimer",
      type: Discord.ApplicationCommandOptionType.Integer,
      required: true,
    },
  ],

  run: async (client, interaction) => {
    const roleId = "1339230333953904751";
    const number = interaction.options.getInteger("nombre");

    if (!interaction.member.roles.cache.has(roleId)) {
      return interaction.reply({
        content: ":x: Vous n'avez pas la permission d'utiliser cette commande.",
        ephemeral: true,
      });
    }

    if (number < 1 || number > 1000000) {
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
