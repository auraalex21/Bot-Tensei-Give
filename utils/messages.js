require("dotenv").config();

module.exports = {
  giveaway: (client) => `🎉 **GIVEAWAY** 🎉`,
  giveawayEnded: (client) => `🎉 **GIVEAWAY TERMINÉ** 🎉`,
  inviteToParticipate: (client) => `Réagissez avec 🎉 pour participer!`,
  dropMessage: (client) => `Soyez le premier à réagir avec 🎉 !`,
  drawing: (client) => `Tirage au sort: {timestamp}`,
  winMessage: (client) =>
    `Félicitations, {winners}! Vous avez gagné **{prize}**!`,
  embedFooter: (client) => `Giveaways`,
  noWinner: (client) => `Giveaway annulé, aucune participation valide.`,
  hostedBy: (client) => `Organisé par: {user}`,
  winners: (client) => `Gagnant(s)`,
  endedAt: (client) => `Terminé à`,
  units: {
    seconds: "secondes",
    minutes: "minutes",
    hours: "heures",
    days: "jours",
    pluralS: false, // pas de "s" à la fin des unités de temps
  },
};
