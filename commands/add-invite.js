const { SlashCommandBuilder } = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
  data: new SlashCommandBuilder()
    .setName("add-invite")
    .setDescription("Ajouter une invitation à un utilisateur")
    .addUserOption((option) =>
      option
        .setName("utilisateur")
        .setDescription("L'utilisateur à qui ajouter une invitation")
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("nombre")
        .setDescription("Le nombre d'invitations à ajouter")
        .setRequired(true)
    ),

  async execute(interaction) {
    const authorizedUserId = "378998346712481812";

    if (interaction.user.id !== authorizedUserId) {
      return interaction.reply({
        content: ":x: Vous n'êtes pas autorisé à utiliser cette commande.",
        ephemeral: true,
      });
    }

    const user = interaction.options.getUser("utilisateur");
    const number = interaction.options.getInteger("nombre");
    const currentInvites = (await db.get(`invites_${user.id}`)) || 0;

    await db.set(`invites_${user.id}`, currentInvites + number);

    interaction.reply({
      content: `Ajouté ${number} invitation(s) à ${user.tag}.`,
      ephemeral: true,
    });
  },
};
