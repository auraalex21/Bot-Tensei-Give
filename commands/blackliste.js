import { SlashCommandBuilder } from "discord.js";
import { QuickDB } from "quick.db";

const db = new QuickDB();

export const data = new SlashCommandBuilder()
  .setName("blackliste")
  .setDescription("Ajouter ou retirer un utilisateur de la liste noire")
  .addSubcommand((subcommand) =>
    subcommand
      .setName("ajouter")
      .setDescription("Ajouter un utilisateur à la liste noire")
      .addUserOption((option) =>
        option
          .setName("utilisateur")
          .setDescription("L'utilisateur à ajouter à la liste noire")
          .setRequired(true)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("retirer")
      .setDescription("Retirer un utilisateur de la liste noire")
      .addUserOption((option) =>
        option
          .setName("utilisateur")
          .setDescription("L'utilisateur à retirer de la liste noire")
          .setRequired(true)
      )
  );

export async function execute(interaction) {
  const requiredRoleId = "1339295239059410974";

  if (!interaction.member.roles.cache.has(requiredRoleId)) {
    return interaction.reply({
      content: "❌ Vous n'avez pas la permission d'utiliser cette commande.",
      ephemeral: true,
    });
  }

  const subcommand = interaction.options.getSubcommand();
  const user = interaction.options.getUser("utilisateur");

  if (subcommand === "ajouter") {
    await db.set(`blacklist_${user.id}`, true);
    return interaction.reply({
      content: `✅ ${user.tag} a été ajouté à la liste noire.`,
      ephemeral: true,
    });
  } else if (subcommand === "retirer") {
    await db.delete(`blacklist_${user.id}`);
    return interaction.reply({
      content: `✅ ${user.tag} a été retiré de la liste noire.`,
      ephemeral: true,
    });
  }
}
