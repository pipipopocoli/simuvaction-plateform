import { Prisma } from "@prisma/client";

export const DATABASE_UPDATE_IN_PROGRESS_MESSAGE =
  "Service temporarily unavailable while database updates complete.";

export function isPrismaSchemaDriftError(
  error: unknown,
): error is Prisma.PrismaClientKnownRequestError {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === "P2021" || error.code === "P2022")
  );
}

export function logPrismaSchemaDrift(context: string, error: unknown) {
  console.error(`${context}: database schema drift detected.`, error);
}
