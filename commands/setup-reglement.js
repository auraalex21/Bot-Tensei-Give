const { SlashCommandBuilder, PermissionsBitField } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setup-reglement")
    .setDescription("Configurer le message de règlement"),

  async execute(interaction) {
    // Vérifier les permissions de l'utilisateur
    if (
      !interaction.member.permissions.has(
        PermissionsBitField.Flags.ManageMessages
      )
    ) {
      return interaction.reply({
        content:
          ":x: Vous devez avoir les permissions de gérer les messages pour utiliser cette commande.",
        ephemeral: true,
      });
    }

    const reglementMessages = [
      `
📜 **Règlement du Serveur Giveaway** 🎉
Bienvenue sur le serveur Giveaways ! Avant de participer aux giveaways et d’interagir avec la communauté, merci de lire et de respecter les règles suivantes. Tout manquement pourra entraîner des sanctions (avertissement, mute, kick ou ban).

🔹 **1. Respect et Bonne Conduite :**
✅ Soyez respectueux envers tous les membres.
✅ Aucune insulte, menace, discrimination, harcèlement ou comportement toxique ne sera toléré.
✅ Aucune provocation ou débat visant à créer des conflits n’est autorisé.
✅ Les pseudos, avatars et statuts ne doivent contenir aucun contenu offensant ou inapproprié.
❌ Interdiction de spam, flood ou troll dans les salons textuels et vocaux.
      `,
      `
🎁 **2. Participation aux Giveaways**
✅ Pour participer à un giveaway, suivez les instructions indiquées dans le salon #🎉giveaway-live.
✅ Si vous gagnez, vous devez réclamer votre récompense dans un délai de 48 heures, sous peine d’annulation.
✅ Les giveaways sont équitables et gérés par un bot. Toute tentative de triche entraînera une exclusion.
✅ Un membre ne peut pas céder son gain à une autre personne.
❌ Créer de faux comptes pour augmenter ses chances est strictement interdit.
      `,
      `
📢 **3. Publicité et Spam**
✅ Vous pouvez partager vos réseaux sociaux uniquement dans le salon dédié (s’il existe).
✅ Toute publicité doit être validée par un administrateur avant d’être postée.
❌ Aucune publicité non autorisée (serveurs Discord, chaînes YouTube, sites web, etc.).
❌ Pas de spam de messages, d’emoji ou de mentions inutiles (@everyone, @here).
❌ Toute publicité en message privé sans le consentement de l’utilisateur est interdite.
❌ Si un membre fait de la publicité en MP et reçoit une sanction d’un autre serveur, nous ne serons pas responsables de cette sanction.
      `,
      `
🔐 **4. Sécurité et Confidentialité**
✅ Ne partagez jamais d’informations personnelles (adresse, numéro de téléphone, etc.).
✅ Méfiez-vous des liens envoyés par des inconnus. Vérifiez toujours qu’ils sont sûrs.
✅ Si vous repérez un comportement suspect, signalez-le à un modérateur.
❌ Aucun partage de fichiers malveillants, de virus ou de contenus NS
      `,
    ];

    for (const message of reglementMessages) {
      const reglementMessage = await interaction.channel.send({
        content: message,
      });
      await reglementMessage.react("✅");
    }

    interaction.reply({
      content: "Message de règlement configuré.",
      ephemeral: true,
    });
  },
};
