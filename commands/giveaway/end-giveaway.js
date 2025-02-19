import { SlashCommandBuilder, PermissionsBitField } from "discord.js";
import { QuickDB } from "quick.db";

const db = new QuickDB();

export const data = new SlashCommandBuilder()
  .setName("end-giveaway")
  .setDescription("Terminer un giveaway")
  .addChannelOption((option) =>
    option
      .setName("canal")
      .setDescription("Salon du giveaway à terminer")
      .setRequired(true)
  );

export async function execute(interaction) {
  try {
    if (interaction.replied || interaction.deferred) {
      return;
    }
    await interaction.deferReply({ ephemeral: true });

    if (
      !interaction.member.permissions.has(
        PermissionsBitField.Flags.ManageMessages
      )
    ) {
      return interaction.editReply({
        content:
          "❌ Vous devez avoir la permission `Gérer les messages` pour terminer un giveaway.",
        ephemeral: true,
      });
    }

    const giveawayChannel = interaction.options.getChannel("canal");
    const giveawayData = await db.get(`giveaway_${giveawayChannel.id}`);

    if (!giveawayData) {
      return interaction.editReply({
        content: "❌ Aucun giveaway en cours dans ce canal.",
        ephemeral: true,
      });
    }

    giveawayData.endTime = Date.now();
    await db.set(`giveaway_${giveawayChannel.id}`, giveawayData);

    await interaction.editReply({
      content: "✅ Giveaway terminé avec succès !",
      ephemeral: true,
    });
  } catch (error) {
    console.error(
      "❌ Erreur lors de l'exécution de la commande end-giveaway :",
      error
    );
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content:
          "❌ Une erreur s'est produite lors de l'exécution de cette commande.",
        ephemeral: true,
      });
    }
  }
}
