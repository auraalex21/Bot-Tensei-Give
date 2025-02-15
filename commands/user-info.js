import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { QuickDB } from "quick.db";

const db = new QuickDB();

export const data = new SlashCommandBuilder()
  .setName("user-info")
  .setDescription("Afficher les informations d'un utilisateur")
  .addUserOption((option) =>
    option
      .setName("utilisateur")
      .setDescription("L'utilisateur dont vous voulez voir les informations")
      .setRequired(false)
  );

export async function execute(interaction) {
  const user = interaction.options.getUser("utilisateur");

  if (!interaction.member.roles.cache.has("1339302664692826193")) {
    return interaction.reply({
      content:
        ":x: Vous n'avez pas la permission de voir les sanctions des utilisateurs.",
      ephemeral: true,
    });
  }

  const warnings = (await db.get(`warnings_${user.id}`)) || [];
  const kicks = (await db.get(`kicks_${user.id}`)) || 0;
  const timeouts = (await db.get(`timeouts_${user.id}`)) || 0;
  const bans = (await db.get(`bans_${user.id}`)) || 0;

  const embed = new EmbedBuilder()
    .setTitle(`Sanctions de ${user.tag}`)
    .setThumbnail(user.displayAvatarURL({ dynamic: true }))
    .addFields(
      {
        name: "Avertissements",
        value: warnings.length
          ? warnings
              .map(
                (w, index) =>
                  `${index + 1}. Raison: ${
                    w.reason || "Non spécifiée"
                  }, Modérateur: <@${w.moderatorId}>, Date: ${new Date(
                    w.date
                  ).toLocaleString()}`
              )
              .join("\n")
          : "Aucun avertissement.",
        inline: false,
      },
      {
        name: "Expulsions",
        value: kicks ? `${kicks} expulsion(s)` : "Aucune expulsion.",
        inline: false,
      },
      {
        name: "Timeouts",
        value: timeouts ? `${timeouts} timeout(s)` : "Aucun timeout.",
        inline: false,
      },
      {
        name: "Bannissements",
        value: bans ? `${bans} bannissement(s)` : "Aucun bannissement.",
        inline: false,
      }
    )
    .setColor("#0099ff");

  await interaction.reply({
    embeds: [embed],
    ephemeral: true,
  });
}
