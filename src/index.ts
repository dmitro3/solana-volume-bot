import * as C from "./utils/constant";
import dotenv from "dotenv";
dotenv.config();

import * as app from "./app";
import * as bot from "./bot";
import * as global from "./global";

import { Connection } from "@solana/web3.js";

const conn: Connection = new Connection(
  process.env.MAINNET_RPC as string,
  "processed"
);

global.setWeb3(conn);

bot.init();
bot.sessionInit();

process.on("uncaughtException", async (error) => {
  await bot.bot.stopPolling();
  bot.init();
});
process.on("SIGSEGV", async (error) => {
  await bot.bot.stopPolling();
  bot.init();
});

global.init();
app.run(bot);
