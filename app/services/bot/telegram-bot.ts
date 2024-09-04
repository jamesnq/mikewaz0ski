import { Telegraf } from "telegraf";
const telegramBot = new Telegraf(process.env.TELEGRAM_TOKEN);

export default telegramBot;
