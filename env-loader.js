import { z } from "zod";

export const envVariables = z.object({
  /** Mongodb url */
  MONGO_URI: z.string(),
  DISCORD_TOKEN: z.string(),
  APPLICATION_ID: z.string(),
  PUBLIC_KEY: z.string(),
  GUILD_ID: z.string(),
  TELEGRAM_TOKEN: z.string(),
  TELEGRAM_USER_ID: z.string(),
});
