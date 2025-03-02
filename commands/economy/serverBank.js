import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { QuickDB } from "quick.db";
import { execute as reloadBank } from "../../events/reloadBank.js";

const db = new QuickDB();
const economyTable = db.table("economy");
const serverBankKey = "server_bank_balance";
const initialBankBalance = 150000;
const cooldown = 60 * 60 * 1000; // 1 heure
const weeklyReset = 7 * 24 * 60 * 60 * 1000; // 1 semaine
let lastResetTime = Date.now();

// Initialisation de la banque du serveur
async function initializeBankBalance() {
  const bankBalance = await economyTable.get(serverBankKey);
  if (bankBalance === null) {
    await economyTable.set(serverBankKey, initialBankBalance);
  }
}

// Réinitialisation automatique chaque semaine
setInterval(async () => {
  await reloadBank();
  lastResetTime = Date.now();
}, weeklyReset);

// Appel de la fonction d'initialisation au démarrage
initializeBankBalance();

export const data = new SlashCommandBuilder()
  .setName("serverbank")
  .setDescription("Gérer la banque du serveur")
  .addSubcommand((subcommand) =>
    subcommand
      .setName("balance")
      .setDescription("Vérifier le solde de la banque du serveur")
  )
  .addSubcommand((subcommand) =>
    subcommand.setName("rob").setDescription("Braquer la banque du serveur")
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("fill")
      .setDescription("Remplir la banque du serveur")
      .addIntegerOption((option) =>
        option
          .setName("amount")
          .setDescription("Montant à ajouter à la banque du serveur")
          .setRequired(true)
      )
  );

export async function execute(interaction) {
  try {
    await initializeBankBalance();

    const subcommand = interaction.options.getSubcommand();
    const userId = interaction.user.id;
    const now = Date.now();

    if (subcommand === "balance") {
      const bankBalance = (await economyTable.get(serverBankKey)) || 0;
      const timeSinceLastReset = now - lastResetTime;
      const timeUntilNextReset = weeklyReset - timeSinceLastReset;
      const days = Math.floor(timeUntilNextReset / (24 * 60 * 60 * 1000));
      const hours = Math.floor(
        (timeUntilNextReset % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000)
      );
      const minutes = Math.floor(
        (timeUntilNextReset % (60 * 60 * 1000)) / (60 * 1000)
      );

      const embed = new EmbedBuilder()
        .setColor("#FFD700")
        .setTitle("💰 Solde de la Banque du Serveur")
        .setDescription(
          `Le solde actuel de la banque du serveur est de **${bankBalance}💸**.\n` +
            `La banque sera réinitialisée dans **${days} jours, ${hours} heures et ${minutes} minutes**.`
        );

      return interaction.reply({ embeds: [embed], ephemeral: true });
    } else if (subcommand === "rob") {
      const lastRobbed = (await economyTable.get(`last_robbed_${userId}`)) || 0;

      if (now - lastRobbed < cooldown) {
        const timeLeft = cooldown - (now - lastRobbed);
        const hours = Math.floor(timeLeft / (60 * 60 * 1000));
        const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));

        const embed = new EmbedBuilder()
          .setColor(0xff0000)
          .setTitle("Braquage de la Banque du Serveur")
          .setDescription(
            `❌ Vous avez déjà braqué la banque récemment. Réessayez dans ${hours} heures et ${minutes} minutes.`
          );

        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      let bankBalance = (await economyTable.get(serverBankKey)) || 0;

      if (bankBalance <= 0) {
        const embed = new EmbedBuilder()
          .setColor(0xff0000)
          .setTitle("Braquage de la Banque du Serveur")
          .setDescription(
            "❌ Il n'y a plus rien à prendre dans la banque du serveur."
          );

        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      const robAmount = Math.floor(Math.random() * (30000 - 10000 + 1)) + 10000;
      const amountStolen = Math.min(robAmount, bankBalance);
      bankBalance -= amountStolen;

      let userBalance = (await economyTable.get(`balance_${userId}`)) || 0;
      userBalance += amountStolen;

      await economyTable.set(serverBankKey, bankBalance);
      await economyTable.set(`balance_${userId}`, userBalance);
      await economyTable.set(`last_robbed_${userId}`, now);

      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle("Braquage de la Banque du Serveur")
        .setDescription(
          `✅ Vous avez volé **${amountStolen}💸**. Votre nouveau solde est de **${userBalance}💸**.`
        );

      return interaction.reply({ embeds: [embed], ephemeral: false });
    } else if (subcommand === "fill") {
      if (userId !== "378998346712481812") {
        return interaction.reply({
          content:
            "❌ Vous n'avez pas la permission d'utiliser cette commande.",
          ephemeral: true,
        });
      }

      const amount = interaction.options.getInteger("amount");
      let bankBalance = (await economyTable.get(serverBankKey)) || 0;
      bankBalance += amount;

      await economyTable.set(serverBankKey, bankBalance);

      const embed = new EmbedBuilder()
        .setColor("#00ff00")
        .setTitle("Remplissage de la Banque du Serveur")
        .setDescription(
          `✅ La banque du serveur a été remplie de **${amount}💸**. Le nouveau solde est de **${bankBalance}💸**.`
        );

      return interaction.reply({ embeds: [embed], ephemeral: false });
    }
  } catch (error) {
    console.error("❌ Erreur lors de l'exécution de la commande :", error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: "❌ Une erreur s'est produite.",
        ephemeral: true,
      });
    }
  }
}
