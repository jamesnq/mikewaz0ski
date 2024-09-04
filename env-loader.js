import { z } from "zod";

export const envVariables = z.object({
  /** Mongodb url */
  MONGO_URI: z.string(),
});
