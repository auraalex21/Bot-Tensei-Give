import { SlashCommandBuilder } from "discord.js";
import { QuickDB } from "quick.db";
const db = new QuickDB();

export const data = new SlashCommandBuilder()
  .setName("remove-exp")
  .setDescription("Retirer de l'expérience ou des niveaux à un utilisateur")
  .addUserOption((option) =>
    option
      .setName("utilisateur")
      .setDescription(
        "L'utilisateur dont vous voulez retirer de l'expérience ou des niveaux"
      )
      .setRequired(true)
  )
  .addIntegerOption((option) =>
    option
      .setName("exp")
      .setDescription("Le montant d'expérience à retirer")
      .setRequired(false)
  )
  .addIntegerOption((option) =>
    option
      .setName("niveau")
      .setDescription("Le nombre de niveaux à retirer")
      .setRequired(false)
  );

export async function execute(interaction) {
  const user = interaction.options.getUser("utilisateur");
  const expToRemove = interaction.options.getInteger("exp");
  const levelsToRemove = interaction.options.getInteger("niveau");
  const guildId = interaction.guild.id;

  if (!expToRemove && !levelsToRemove) {
    return interaction.reply({
      content:
        ":x: Vous devez spécifier soit l'expérience, soit les niveaux à retirer.",
      ephemeral: true,
    });
  }

  const userKey = `levels_${guildId}_${user.id}`;
  let userData = await db.get(userKey);

  if (!userData) {
    return interaction.reply({
      content: `:x: Aucune donnée trouvée pour ${user.tag}.`,
      ephemeral: true,
    });
  }

  if (expToRemove) {
    userData.exp -= expToRemove;
    if (userData.exp < 0) {
      userData.exp = 0;
    }
    console.log(
      `User ${user.id} lost ${expToRemove} XP. Total XP: ${userData.exp}`
    );
  }

  if (levelsToRemove) {
    userData.level -= levelsToRemove;
    if (userData.level < 1) {
      userData.level = 1;
    }
    console.log(
      `User ${user.id} lost ${levelsToRemove} levels. Total Level: ${userData.level}`
    );
  }

  await db.set(userKey, userData);

  interaction.reply({
    content: `✅ ${user.tag} a perdu ${
      expToRemove ? `${expToRemove} points d'expérience` : ""
    } ${levelsToRemove ? `et ${levelsToRemove} niveaux` : ""}.`,
    ephemeral: true,
  });
}
