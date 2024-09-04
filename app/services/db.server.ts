import aes256cbc from "@/server/aes-265-cbc";
import { Prisma, PrismaClient } from "@prisma/client";

export type PrismaModels = {
  [M in Prisma.ModelName]: Exclude<
    Awaited<ReturnType<PrismaClient[Uncapitalize<M>]["findUnique"]>>,
    null
  >;
};

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};

declare global {
  // biome-ignore lint/style/noVar: <explanation>
  var __prisma: PrismaClient;
}
if (!global.__prisma) {
  global.__prisma = new PrismaClient();
}
global.__prisma.$connect();
export const prisma = global.__prisma;
// Middleware to encrypt data before saving
prisma.$use(async (params, next) => {
  if (
    params.model === "Order" &&
    (params.action === "create" || params.action === "update")
  ) {
    if (params.args.data.data?.password) {
      params.args.data.data.password = aes256cbc.encrypt(
        params.args.data.data.password
      );
    }
  }
  return next(params);
});

export default prisma;
