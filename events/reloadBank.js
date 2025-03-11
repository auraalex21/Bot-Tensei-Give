import { QuickDB } from "quick.db";

const db = new QuickDB();
const economyTable = db.table("economy");
const serverBankKey = "server_bank_balance";
const initialBankBalance = 150000;

export default {
  name: "reloadBank",
  async execute() {
    console.log("Réinitialisation de la banque du serveur...");
    await economyTable.set(serverBankKey, initialBankBalance);
  },
};
