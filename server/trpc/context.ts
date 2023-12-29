import { inferAsyncReturnType } from "@trpc/server";
import Database from "better-sqlite3";
import { BetterSQLite3Database, drizzle } from "drizzle-orm/better-sqlite3";

/**
 * Creates context for an incoming request
 * @link https://trpc.io/docs/context
 */
export const createContext = () => {
  const sqlite = new Database("sqlite.db");
  const db: BetterSQLite3Database = drizzle(sqlite);

  return {
    db,
  };
};

export type Context = inferAsyncReturnType<typeof createContext>;
