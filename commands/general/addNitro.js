import { SlashCommandBuilder } from "discord.js";
import { QuickDB } from "quick.db";

const db = new QuickDB();
const nitroTable = db.table("nitro");

export default {
  data: new SlashCommandBuilder()
    .setName("addnitro")
    .setDescription("Ajoute un code Nitro dans la base de données.")
    .addStringOption((option) =>
      option
        .setName("code")
        .setDescription("Le code Nitro à ajouter.")
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("stock")
        .setDescription("Le nombre de Nitro à ajouter au stock.")
        .setRequired(true)
    ),
  async execute(interaction) {
    const userId = interaction.user.id;

    // Vérifie si l'utilisateur est autorisé
    if (userId !== "378998346712481812") {
      return await interaction.reply({
        content: "❌ Vous n'êtes pas autorisé à utiliser cette commande.",
        ephemeral: true,
      });
    }

    const code = interaction.options.getString("code");
    const stock = interaction.options.getInteger("stock");

    // Save the Nitro code and stock in the database
    await nitroTable.set("code", code);
    await nitroTable.set("stock", stock);

    await interaction.reply({
      content: `✅ Le code Nitro **${code}** a été ajouté avec un stock de **${stock}**.`,
      ephemeral: true,
    });
  },
};
