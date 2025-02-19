import { SlashCommandBuilder, PermissionsBitField } from "discord.js";
import { QuickDB } from "quick.db";
import { getUserLevel } from "../../config/levels.js";

const db = new QuickDB();

const roleRewards = [
  { level: 5, roleId: "1339902720546439189", bonus: 0.05 },
  { level: 15, roleId: "1339902718088577074", bonus: 0.1 },
  { level: 25, roleId: "1339902715165147166", bonus: 0.15 },
  { level: 40, roleId: "1339902712724066406", bonus: 0.25 },
];

export const data = new SlashCommandBuilder()
  .setName("end-giveaway")
  .setDescription("Terminer un giveaway")
  .addChannelOption((option) =>
    option
      .setName("canal")
      .setDescription("Salon du giveaway à terminer")
      .setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName("message_id")
      .setDescription("ID du message du giveaway")
      .setRequired(true)
  );

export async function execute(interaction) {
  if (interaction.replied || interaction.deferred) {
    return;
  }

  try {
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
    const messageId = interaction.options.getString("message_id");
    const giveawayData = await db.get(`giveaway_${giveawayChannel.id}`);

    if (!giveawayData || giveawayData.messageId !== messageId) {
      return interaction.editReply({
        content:
          "❌ Aucun giveaway en cours avec cet ID de message dans ce canal.",
        ephemeral: true,
      });
    }

    giveawayData.endTime = Date.now();
    await db.set(`giveaway_${giveawayChannel.id}`, giveawayData);

    if (giveawayData.participants.length === 0) {
      return interaction.editReply({
        content: "❌ Aucun participant pour ce giveaway.",
        ephemeral: true,
      });
    }

    const weightedParticipants = [];
    for (const participant of giveawayData.participants) {
      const userLevel = await getUserLevel(participant, interaction.guild.id);
      const bonus = roleRewards.reduce((acc, reward) => {
        if (userLevel.level >= reward.level) {
          return acc + reward.bonus;
        }
        return acc;
      }, 0);
      const weight = 1 + bonus;
      for (let i = 0; i < weight; i++) {
        weightedParticipants.push(participant);
      }
    }

    const winners = [];
    for (let i = 0; i < giveawayData.winnerCount; i++) {
      const winnerIndex = Math.floor(
        Math.random() * weightedParticipants.length
      );
      const winnerId = weightedParticipants.splice(winnerIndex, 1)[0];
      const winner = await interaction.guild.members.fetch(winnerId);
      winners.push(winner);
    }

    await giveawayChannel.send({
      content: `🎉 Félicitations aux gagnants: ${winners
        .map((w) => `<@${w.id}>`)
        .join(", ")} !`,
    });

    giveawayData.winners = winners.map((w) => w.id);
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
