import { Events } from "discord.js";

const targetMessageId = "1339253344853692416"; // ID du message où la réaction est attendue
const targetChannelId = "1339231311545503826"; // ID du canal contenant ce message
const roleId = "1340087668616204471"; // ID du rôle à attribuer
const botReactionEmoji = "✅"; // Emoji ajouté par le bot

export default {
  name: Events.MessageReactionAdd,
  async execute(client, reaction, user) {
    // ⚠️ Ajout de `client` en premier argument
    try {
      console.log("✅ L'événement MessageReactionAdd a bien été déclenché !");

      // Vérifier que le bot n'agit pas sur ses propres réactions
      if (user.bot) return;

      // Vérifier si la réaction est partielle (non en cache) et essayer de la récupérer
      if (reaction.partial) {
        try {
          await reaction.fetch();
          console.log("🔄 Réaction récupérée avec succès !");
        } catch (err) {
          console.error("❌ Impossible de récupérer la réaction :", err);
          return;
        }
      }

      // Vérifier si le message et le canal sont corrects
      if (
        !reaction.message ||
        reaction.message.id !== targetMessageId ||
        reaction.message.channel.id !== targetChannelId
      ) {
        console.warn(
          "⚠️ Réaction ignorée : elle ne concerne pas le bon message ou canal."
        );
        return;
      }

      // Vérifier si le serveur (guild) existe
      const guild = reaction.message.guild;
      if (!guild) {
        console.error("❌ Impossible de récupérer le serveur (guild).");
        return;
      }

      // Vérifier si le bot a bien accès au client
      if (!client) {
        console.error(
          "❌ Client Discord toujours indéfini ! Vérifie que :\n" +
            "- Les intents sont activés dans le portail Discord Developer.\n" +
            "- Les intents sont activés dans ton code (`GatewayIntentBits`).\n" +
            "- Le bot a bien les permissions dans le serveur."
        );
        return;
      }

      // Récupérer le membre correspondant à l'utilisateur qui a réagi
      const member = await guild.members.fetch(user.id).catch((err) => {
        console.error("❌ Erreur lors de la récupération du membre :", err);
        return null;
      });

      if (!member) {
        console.error(`❌ Impossible de récupérer l'utilisateur : ${user.tag}`);
        return;
      }

      // Vérifier que le rôle existe
      const role = guild.roles.cache.get(roleId);
      if (!role) {
        console.error(`❌ Rôle avec l'ID ${roleId} non trouvé.`);
        return;
      }

      // Ajouter le rôle à l'utilisateur
      await member.roles.add(role).catch((err) => {
        console.error(`❌ Erreur lors de l'ajout du rôle à ${user.tag} :`, err);
        return;
      });

      console.log(
        `✅ Rôle "${role.name}" attribué à l'utilisateur ${user.tag}.`
      );

      // Ajouter la réaction du bot au message pour confirmer
      try {
        await reaction.message.react(botReactionEmoji);
        console.log(`✅ Réaction "${botReactionEmoji}" ajoutée au message.`);
      } catch (error) {
        console.error(`❌ Erreur lors de l'ajout de la réaction :`, error);
      }
    } catch (error) {
      console.error(`❌ Erreur lors du traitement de la réaction :`, error);
    }
  },
};
