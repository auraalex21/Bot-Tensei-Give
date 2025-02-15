export default (client) => {
  console.log(
    `Prêt en tant que ${client.user.tag} pour servir dans ${client.channels.cache.size} canaux sur ${client.guilds.cache.size} serveurs, pour un total de ${client.users.cache.size} utilisateurs.`
  );

  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    }
  });
};
