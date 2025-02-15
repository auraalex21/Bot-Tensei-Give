import {
  AttachmentBuilder,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";
import { QuickDB } from "quick.db";
import { createCanvas, loadImage } from "canvas";

const db = new QuickDB();

export default {
  data: new SlashCommandBuilder()
    .setName("invite")
    .setDescription("Créer une invitation")
    .addStringOption((option) =>
      option
        .setName("code")
        .setDescription("Le code de l'invitation")
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("utilisations")
        .setDescription("Le nombre d'utilisations de l'invitation")
        .setRequired(true)
    ),

  async execute(interaction) {
    const code = interaction.options.getString("code");
    const uses = interaction.options.getInteger("utilisations");

    await db.set(`invite_${code}`, { uses });

    interaction.reply({
      content: `✅ Invitation créée avec le code ${code} et ${uses} utilisations.`,
      ephemeral: true,
    });
  },
};
