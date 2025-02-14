const { SlashCommandBuilder, PermissionsBitField } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setup-reglement")
    .setDescription("Configurer le message de règlement"),

  async execute(interaction) {
    // Vérifier les permissions de l'utilisateur
    if (
      !interaction.member.permissions.has(
        PermissionsBitField.Flags.ManageMessages
      )
    ) {
      return interaction.reply({
        content:
          ":x: Vous devez avoir les permissions de gérer les messages pour utiliser cette commande.",
        ephemeral: true,
      });
    }

    const reglementMessage = await interaction.channel.send({
      content: "Veuillez lire le règlement et réagir avec ✅ pour accepter.",
    });

    await reglementMessage.react("✅");

    interaction.reply({
      content: "Message de règlement configuré.",
      ephemeral: true,
    });
  },
};
