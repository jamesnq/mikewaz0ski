import {
  ButtonInteraction,
  Client,
  Events,
  GatewayIntentBits,
  ModalSubmitInteraction,
  StringSelectMenuInteraction,
} from "discord.js";
import { commands } from "./commands";
import { ConfirmButtonHandler } from "./handler/confirmBtnHandler";
import { SendCodeButtonHandler } from "./handler/sendCodeBtnHandler";
import { SendCodeModalSubmit } from "./handler/sendCodeModalSubmit";
import { deployCommands } from "./deploy-commands";

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

discordBot.on("guildCreate", async (guild) => {
  await deployCommands({ guildId: guild.id });
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
  if (interaction.isButton()) {
    if (interaction.customId?.startsWith("confirm_order_id_")) {
      ConfirmButtonHandler(interaction as unknown as ButtonInteraction);
    }
    if (interaction.customId?.startsWith("open_order_verify_code")) {
      SendCodeButtonHandler(interaction as unknown as ButtonInteraction);
    }
  }

  if (interaction.isModalSubmit()) {
    if (interaction.customId?.includes("verification-code-modal")) {
      SendCodeModalSubmit(interaction as unknown as ModalSubmitInteraction);
    }
  }
});

export default discordBot;
