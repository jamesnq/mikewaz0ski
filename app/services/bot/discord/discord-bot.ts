import {
  ButtonInteraction,
  Client,
  Events,
  GatewayIntentBits,
  ModalSubmitInteraction,
} from "discord.js";
import { commands } from "./commands";
import { ConfirmButtonHandler } from "./handler/confirmBtnHandler";
import { SendCodeButtonHandler } from "./handler/sendCodeBtnHandler";
import { SendCodeModalSubmit } from "./handler/sendCodeModalSubmit";
import { deployCommands } from "./deploy-commands";
import { SendAppleIDButtonHandler } from "./handler/sendAppleIDButtonHandler";
import { SendAppleIDModalSubmit } from "./handler/sendAppleIDModalSubmit";

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

discordBot.on("guildCreate", async () => {
  await deployCommands();
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

    if (interaction.customId?.startsWith("open_resend_appleid")) {
      SendAppleIDButtonHandler(interaction as unknown as ButtonInteraction);
    }
  }

  if (interaction.isModalSubmit()) {
    if (interaction.customId?.includes("verification-code-modal")) {
      SendCodeModalSubmit(interaction as unknown as ModalSubmitInteraction);
    }

    if (interaction.customId?.includes("send-appleid-modal")) {
      SendAppleIDModalSubmit(interaction as unknown as ModalSubmitInteraction);
    }
  }
});

// interface Session {
//   collector: MessageCollector;
//   chatGPTService: ChatGPTService;
// }

// const activeSessions = new Map<string, Session[]>();

// discordBot.on(Events.ChannelCreate, async (channel) => {
//   if (
//     channel.isTextBased() &&
//     !channel.isDMBased() &&
//     channel.parent?.id === "1280084562055270450"
//   ) {
//     const chatGPTService = new ChatGPTService();

//     await channel.send(`Welcome! How can I assist you today?`);

//     const collector = channel.createMessageCollector({ time: 3600000 });

//     const newSession: Session = { collector, chatGPTService };

//     // Add the new session to the channel's session array
//     if (!activeSessions.has(channel.id)) {
//       activeSessions.set(channel.id, []);
//     }
//     activeSessions.get(channel.id)!.push(newSession);

//     collector.on("collect", async (message) => {
//       if (message.author.bot) return;

//       try {
//         const response = await chatGPTService.processMessage(message.content);
//         if (response === "IRRELEVANT") {
//           collector.stop("irrelevant");
//         } else {
//           await channel.send(response);
//         }
//       } catch (error) {
//         console.error("Error processing message with ChatGPT:", error);
//         await channel.send(
//           "I apologize, but I encountered an error while processing your request. Please try again later."
//         );
//       }
//     });

//     collector.on("end", (collected, reason) => {
//       if (reason === "irrelevant") {
//         channel.send(
//           "This support session has ended due to an irrelevant query. If you need further assistance, please open a new ticket."
//         );
//       } else {
//         channel.send(
//           "This support session has ended. If you need further assistance, please open a new ticket."
//         );
//       }
//       // Remove this specific session from the channel's session array
//       const sessions = activeSessions.get(channel.id);
//       if (sessions) {
//         const index = sessions.findIndex(
//           (session) => session.collector === collector
//         );
//         if (index !== -1) {
//           sessions.splice(index, 1);
//           if (sessions.length === 0) {
//             activeSessions.delete(channel.id);
//           }
//         }
//       }
//     });
//   }
// });

// // Handle channel delete event
// discordBot.on(Events.ChannelDelete, (channel) => {
//   if (channel.isTextBased() && !channel.isDMBased()) {
//     const sessions = activeSessions.get(channel.id);
//     if (sessions) {
//       sessions.forEach((session) => {
//         session.collector.stop("channelDeleted");
//         // Clean up the ChatGPT service if necessary
//         // session.chatGPTService.cleanup();  // Implement this method if needed
//       });
//       activeSessions.delete(channel.id);
//       console.log(
//         `Cleaned up ${sessions.length} session(s) for deleted channel ${channel.id}`
//       );
//     }
//   }
// });

export default discordBot;
