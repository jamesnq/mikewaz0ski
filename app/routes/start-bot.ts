import { CreateOrderSchema } from "@/lib/zod-schema";
import prisma from "@/services/db.server";
import { LoaderFunctionArgs } from "@remix-run/node";
import discordBot from "@/services/bot/discord/discord-bot";
import telegramBot from "@/services/bot/telegram-bot";
import { z } from "zod";
export async function loader({ request }: LoaderFunctionArgs) {
  discordBot;
  telegramBot;
  return new Response("ok");
}
