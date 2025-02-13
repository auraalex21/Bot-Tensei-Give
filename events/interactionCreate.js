module.exports = (client, interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) {
    return interaction.reply({
      content: `Commande \`${interaction.commandName}\` non trouvée.`,
      ephemeral: true,
    });
  }

  command.run(client, interaction);
};
