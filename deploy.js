import { REST, Routes } from "discord.js";
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const commands = [];
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = await import(pathToFileURL(filePath).href);
  if (command.data) {
    commands.push(command.data.toJSON());
  }
}

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log("Started refreshing application (/) commands.");
    console.log(
      `DISCORD_TOKEN: ${process.env.DISCORD_TOKEN ? "defined" : "undefined"}`
    );
    console.log(`CLIENT_ID: ${process.env.CLIENT_ID}`);
    console.log(`GUILD_ID: ${process.env.GUILD_ID}`);

    if (!process.env.CLIENT_ID || !process.env.GUILD_ID) {
      throw new Error(
        "CLIENT_ID or GUILD_ID is not defined in the environment variables."
      );
    }

    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: commands }
    );

    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }
})();
