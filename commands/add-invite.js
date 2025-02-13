const Discord = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
  description:
    "Ajouter une invitation à un utilisateur (réservé à un utilisateur spécifique)",

  options: [
    {
      name: "utilisateur",
      description: "L'utilisateur à qui ajouter une invitation",
      type: Discord.ApplicationCommandOptionType.User,
      required: true,
    },
    {
      name: "nombre",
      description: "Le nombre d'invitations à ajouter",
      type: Discord.ApplicationCommandOptionType.Integer,
      required: true,
    },
  ],

  run: async (client, interaction) => {
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
