import { Events } from "discord.js";

const targetMessageId = "1345410522199228536";
const targetChannelId = "1339231311545503826";
const botReactionEmoji = "✅"; // Emoji the bot will react with

export default {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    console.log(`Prêt en tant que ${client.user.tag}`);

    // Add reaction to the specified message
    try {
      const channel = await client.channels.fetch(targetChannelId);
      if (!channel.isTextBased()) {
        console.error("The target channel is not a text channel.");
        return;
      }

      const message = await channel.messages.fetch(targetMessageId);
      await message.react(botReactionEmoji);
      console.log(
        `Réaction ${botReactionEmoji} ajoutée au message ${targetMessageId}`
      );
    } catch (error) {
      console.error(
        `Erreur lors de l'ajout de la réaction au message :`,
        error
      );
    }
  },
};
