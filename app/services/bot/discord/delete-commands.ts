import { REST, Routes, APIApplicationCommand } from "discord.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

async function deleteAllGlobalCommands() {
  try {
    console.log("Fetching all global commands...");

    // Fetch all global commands and cast the result to the correct type
    const globalCommands = (await rest.get(
      Routes.applicationCommands(process.env.DISCORD_APPLICATION_ID)
    )) as APIApplicationCommand[];

    if (globalCommands.length === 0) {
      console.log("No global commands found to delete.");
      return;
    }

    // Loop through each global command and delete it
    for (const command of globalCommands) {
      try {
        await rest.delete(
          Routes.applicationCommand(
            process.env.DISCORD_APPLICATION_ID,
            command.id
          )
        );
        console.log(
          `Successfully deleted global command with ID: ${command.id}`
        );
      } catch (error) {
        console.error(
          `Failed to delete global command with ID: ${command.id}`,
          error
        );
      }
    }

    console.log("All global commands have been processed for deletion.");
  } catch (error) {
    console.error("Error fetching global commands:", error);
  }
}

async function deleteAllGuildCommands(guildId: string) {
  try {
    console.log(`Fetching all guild commands for guild ID: ${guildId}...`);

    // Fetch all guild commands and cast the result to the correct type
    const guildCommands = (await rest.get(
      Routes.applicationGuildCommands(
        process.env.DISCORD_APPLICATION_ID,
        guildId
      )
    )) as APIApplicationCommand[];

    if (guildCommands.length === 0) {
      console.log(
        `No guild commands found to delete for guild ID: ${guildId}.`
      );
      return;
    }

    // Loop through each guild command and delete it
    for (const command of guildCommands) {
      try {
        await rest.delete(
          Routes.applicationGuildCommand(
            process.env.DISCORD_APPLICATION_ID,
            guildId,
            command.id
          )
        );
        console.log(
          `Successfully deleted guild command with ID: ${command.id}`
        );
      } catch (error) {
        console.error(
          `Failed to delete guild command with ID: ${command.id}`,
          error
        );
      }
    }

    console.log("All guild commands have been processed for deletion.");
  } catch (error) {
    console.error("Error fetching guild commands:", error);
  }
}

(async () => {
  try {
    console.log("Starting the deletion process for all commands...");

    // Delete all global commands
    await deleteAllGlobalCommands();

    // Replace 'YOUR_GUILD_ID' with your actual guild ID
    const guildId = "1171856527620067411";
    await deleteAllGuildCommands(guildId);

    console.log("Deletion process completed.");
  } catch (error) {
    console.error("Error during command deletion:", error);
  }
})();
