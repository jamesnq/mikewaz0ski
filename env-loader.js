import { z } from "zod";

export const envVariables = z.object({
  /** Mongodb url */
  MONGO_URI: z.string(),
  // Discord
  DISCORD_TOKEN: z.string(),
  DISCORD_APPLICATION_ID: z.string(),
  DISCORD_PUBLIC_KEY: z.string(),
  DISCORD_GUILD_ID: z.string(),
  DISCORD_ADMIN: z
    .string()
    .transform((data) => {
      const admin = z.array(z.string()).parse(JSON.parse(data));
      process.env.DISCORD_ADMIN = admin;
      return admin;
    }),
  REQUIRED_ROLE_ID: z.string(),
  // Telegram
  TELEGRAM_TOKEN: z.string(),
  TELEGRAM_CHAT_ID: z.string(),

  /**For encrypt key or private stuff */
  AES256CBC_KEY: z.string().length(32),
  AES256CBC_IV: z.string().length(16),
});
