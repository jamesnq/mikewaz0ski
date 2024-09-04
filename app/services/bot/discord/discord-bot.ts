import {
  ButtonInteraction,
  Client,
  Events,
  GatewayIntentBits,
} from "discord.js";
import { commands } from "./commands";
import { handleButtonInteraction } from "./commands/order-create";

const discordBot = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
});

discordBot.on("ready", () => {
  console.log(`Logged in as ${discordBot?.user?.tag}!`);
});

// Interaction event listener for handling commands
discordBot.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  if (!commandName) {
    console.error(`No command matching ${interaction} was found.`);
    return;
  }

  try {
    if (commands[commandName as keyof typeof commands]) {
      commands[commandName as keyof typeof commands].execute(interaction);
    }
  } catch (error) {
    console.error("Error executing command:", error);
    await interaction.reply({
      content: "There was an error while executing this command!",
      ephemeral: true,
    });
  }
});

discordBot.on(Events.InteractionCreate, async (interaction) => {
  handleButtonInteraction(interaction as unknown as ButtonInteraction);
});

export default discordBot;
