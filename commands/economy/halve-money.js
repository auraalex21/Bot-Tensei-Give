import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { QuickDB } from "quick.db";

const db = new QuickDB();
const economyTable = db.table("economy");

export const data = new SlashCommandBuilder()
  .setName("nuke-money")
  .setDescription("Retirer 50% de l'argent de tous les utilisateurs")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction) {
  const allowedUserId = "378998346712481812";

  if (interaction.user.id !== allowedUserId) {
    return interaction.reply({
      content: "❌ Vous n'avez pas la permission d'utiliser cette commande.",
      ephemeral: true,
    });
  }

  const allUsers = await economyTable.all();
  const balanceUpdates = allUsers
    .filter((entry) => entry.id.startsWith("balance_"))
    .map(async (entry) => {
      const userId = entry.id.split("_")[1];
      let balance = entry.value;
      balance = Math.floor(balance / 2);
      await economyTable.set(`balance_${userId}`, balance);
      return { userId, balance };
    });

  const updatedBalances = await Promise.all(balanceUpdates);

  interaction.reply({
    content: `✅ 50% de l'argent a été retiré de tous les utilisateurs.`,
    ephemeral: true,
  });

  console.log("Updated balances:", updatedBalances);
}
