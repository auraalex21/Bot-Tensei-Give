import { SlashCommandBuilder } from "discord.js";
import { QuickDB } from "quick.db";

const db = new QuickDB();

export const name = "top-invite";

export const data = new SlashCommandBuilder()
  .setName("top-invite")
  .setDescription("Afficher le classement des invitations");

export async function execute(interaction) {
  const invites = await db.all();
  const sortedInvites = invites
    .filter((invite) => invite.id.startsWith("invite_"))
    .sort((a, b) => b.value.uses - a.value.uses)
    .slice(0, 10);

  const embed = {
    title: "Classement des invitations",
    description: sortedInvites
      .map(
        (invite, index) =>
          `${index + 1}. ${invite.id.split("_")[1]} - ${
            invite.value.uses
          } utilisations`
      )
      .join("\n"),
    color: 0x00ff00,
  };

  interaction.reply({ embeds: [embed], ephemeral: true });
}
