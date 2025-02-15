import { QuickDB } from "quick.db";
import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} from "discord.js";

const db = new QuickDB();

export default async (client, interaction) => {
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) {
      return interaction.reply({
        content: `Commande \`${interaction.commandName}\` non trouvée.`,
        ephemeral: true,
      });
    }
    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "Il y a eu une erreur en exécutant cette commande.",
        ephemeral: true,
      });
    }
  } else if (interaction.isButton()) {
    const args = interaction.customId.split("-");
    const action = args[0];
    const userId = args[1];
    let page = parseInt(args[2]) || 0;

    const user = await client.users.fetch(userId);

    if (action === "warn-info") {
      const warnings = (await db.get(`warnings_${user.id}`)) || [];

      if (!warnings.length) {
        return interaction.update({
          embeds: [
            new EmbedBuilder()
              .setTitle(`Avertissements de ${user.tag}`)
              .setDescription("Aucun avertissement.")
              .setColor("#ffcc00"),
          ],
          components: [],
        });
      }

      if (page < 0) page = 0;
      if (page >= warnings.length) page = warnings.length - 1;

      const warning = warnings[page];

      const warnEmbed = new EmbedBuilder()
        .setTitle(
          `Avertissement ${page + 1}/${warnings.length} pour ${user.tag}`
        )
        .addFields(
          {
            name: "Raison",
            value: warning.reason || "Non spécifiée",
            inline: false,
          },
          {
            name: "Modérateur",
            value: `<@${warning.moderatorId}>`,
            inline: true,
          },
          {
            name: "Date",
            value: new Date(warning.date).toLocaleString(),
            inline: true,
          }
        )
        .setColor("#ffcc00");

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`warn-info-${user.id}-${page - 1}`)
          .setLabel("⬅ Précédent")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(page === 0),
        new ButtonBuilder()
          .setCustomId(`warn-info-${user.id}-${page + 1}`)
          .setLabel("Suivant ➡")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(page >= warnings.length - 1)
      );

      await interaction.update({ embeds: [warnEmbed], components: [row] });
    } else if (action === "kick-info") {
      const kicks = (await db.get(`kicks_${user.id}`)) || 0;
      const kickEmbed = new EmbedBuilder()
        .setTitle(`Expulsions de ${user.tag}`)
        .setDescription(kicks ? `${kicks} expulsion(s).` : "Aucune expulsion.")
        .setColor("#ff6600");
      await interaction.update({ embeds: [kickEmbed], components: [] });
    } else if (action === "timeout-info") {
      const timeouts = (await db.get(`timeouts_${user.id}`)) || 0;
      const timeoutEmbed = new EmbedBuilder()
        .setTitle(`Timeouts de ${user.tag}`)
        .setDescription(timeouts ? `${timeouts} timeout(s).` : "Aucun timeout.")
        .setColor("#ff3300");
      await interaction.update({ embeds: [timeoutEmbed], components: [] });
    } else if (action === "ban-info") {
      const bans = (await db.get(`bans_${user.id}`)) || 0;
      const banEmbed = new EmbedBuilder()
        .setTitle(`Bannissements de ${user.tag}`)
        .setDescription(
          bans ? `${bans} bannissement(s).` : "Aucun bannissement."
        )
        .setColor("#ff0000");
      await interaction.update({ embeds: [banEmbed], components: [] });
    } else if (interaction.customId === "participer-giveaway") {
      const member = interaction.guild.members.cache.get(interaction.user.id);
      const role = interaction.guild.roles.cache.get("1340087668616204471");

      if (!member.roles.cache.has(role.id)) {
        return interaction.reply({
          content:
            "Vous devez lire le règlement et accepter les conditions en réagissant avec ✅ pour participer au giveaway.",
          flags: MessageFlags.Ephemeral,
        });
      }

      // Logique pour participer au giveaway
      interaction.reply({
        content: "Vous êtes maintenant inscrit au giveaway!",
        flags: MessageFlags.Ephemeral,
      });
    }
  } else if (interaction.isModalSubmit()) {
    if (interaction.customId === "candidatureModal") {
      const name = interaction.fields.getTextInputValue("nameInput");
      const experience =
        interaction.fields.getTextInputValue("experienceInput");
      const motivation =
        interaction.fields.getTextInputValue("motivationInput");

      const embed = new EmbedBuilder()
        .setTitle("Nouvelle Candidature")
        .addFields(
          { name: "Pseudo discord", value: name, inline: true },
          { name: "Expérience", value: experience },
          { name: "Motivation", value: motivation }
        )
        .setColor("#0099ff")
        .setTimestamp();

      const channelId = "1340014452451315722"; // Remplacez par l'ID du salon spécial
      const channel = client.channels.cache.get(channelId);
      if (channel) {
        channel.send({ embeds: [embed] });
      }

      await interaction.reply({
        content: "Votre candidature a été soumise avec succès!",
        flags: MessageFlags.Ephemeral,
      });
    }
  }
};
