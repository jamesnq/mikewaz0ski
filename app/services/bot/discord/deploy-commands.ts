import { REST, Routes } from "discord.js";
import { commands } from "./commands";

const commandsData = Object.values(commands).map((command) => command.data);

const rest = new REST({ version: "10" }).setToken(
  process.env.DISCORD_TOKEN_TEST
);

type DeployCommandsProps = {
  guildId: string;
};

export async function deployCommands({ guildId }: DeployCommandsProps) {
  try {
    console.log("Started refreshing application (/) commands.");

    await rest.put(
      Routes.applicationGuildCommands(
        process.env.DISCORD_APPLICATION_ID_TEST,
        guildId
      ),
      {
        body: commandsData,
      }
    );

    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }
}

// (async (guildId) => {
//   try {
//     console.log("Deploying commands to guild...");

//     // Replace 'YOUR_GUILD_ID' with your actual guild ID or make it dynamic
//     const guildId = process.env.DISCORD_GUILD_ID; // Ensure this is defined in your config
//     await deployCommands({ guildId });
//   } catch (error) {
//     console.error("Error running deployment script:", error);
//   }
// })();
