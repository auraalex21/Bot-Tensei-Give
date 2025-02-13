const config = require("../config.json");

module.exports = {
  giveaway:
    (config.everyoneMention ? "@everyone\n\n" : "") +
    "🎉🎉 **TIRAGE AU SORT** 🎉🎉",
  giveawayEnded:
    (config.everyoneMention ? "@everyone\n\n" : "") +
    "🎉🎉 **TIRAGE AU SORT TERMINÉ** 🎉🎉",
  title: "{this.prize}",
  inviteToParticipate: "Réagissez avec 🎉 pour participer!",
  winMessage: "Félicitations, {winners}! Vous avez gagné **{this.prize}**!",
  drawing: "Tirage: {timestamp}",
  dropMessage: "Soyez le premier à réagir avec 🎉 !",
  embedFooter: "{this.winnerCount} gagnant(s)",
  noWinner: "Tirage annulé, aucune participation valide.",
  winners: "Gagnant(s):",
  endedAt: "Terminé à",
  hostedBy: "Organisé par: {this.hostedBy}",
};
