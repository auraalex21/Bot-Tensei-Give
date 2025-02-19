import { SlashCommandBuilder } from "discord.js";
import { QuickDB } from "quick.db";

const db = new QuickDB();
const economyTable = db.table("economy");

export const data = new SlashCommandBuilder()
  .setName("transfermoney")
  .setDescription("Transférer de l'argent à un autre utilisateur")
  .addUserOption((option) =>
    option
      .setName("destinataire")
      .setDescription("L'utilisateur à qui transférer de l'argent")
      .setRequired(true)
  )
  .addIntegerOption((option) =>
    option
      .setName("montant")
      .setDescription("Le montant d'argent à transférer")
      .setRequired(true)
  );

export async function execute(interaction) {
  const senderId = interaction.user.id;

  if (senderId !== "378998346712481812") {
    return interaction.reply({
      content: "❌ Vous n'avez pas la permission d'utiliser cette commande.",
      ephemeral: true,
    });
  }

  const recipient = interaction.options.getUser("destinataire");
  const amount = interaction.options.getInteger("montant");

  if (recipient.id === senderId) {
    return interaction.reply({
      content: "❌ Vous ne pouvez pas vous envoyer de l'argent à vous-même.",
      ephemeral: true,
    });
  }

  if (amount <= 0) {
    return interaction.reply({
      content: "❌ Le montant doit être positif.",
      ephemeral: true,
    });
  }

  let senderBalance = (await economyTable.get(`balance_${senderId}`)) || 0;
  if (senderBalance < amount) {
    return interaction.reply({
      content: "❌ Vous n'avez pas assez d'argent pour effectuer ce transfert.",
      ephemeral: true,
    });
  }

  let recipientBalance =
    (await economyTable.get(`balance_${recipient.id}`)) || 0;

  await economyTable.set(`balance_${senderId}`, senderBalance - amount);
  await economyTable.set(`balance_${recipient.id}`, recipientBalance + amount);

  await interaction.reply(
    `💸 **${amount}** a été transféré à **${
      recipient.username
    }**. Votre nouveau solde: **${senderBalance - amount}💸**.`
  );
}
