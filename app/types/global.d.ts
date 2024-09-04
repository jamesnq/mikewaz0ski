import { envVariables } from "../../env-loader";
import { z } from "zod";
declare global {
  namespace NodeJS {
    interface ProcessEnv extends z.infer<typeof envVariables> {}
  }
}
