import dotenv from "dotenv";
dotenv.config();

import { Connection } from "@solana/web3.js";

export const TransctionMonitorDuration = 24 * 60 * 60;
export const Max_Sell_Count = 10;
export const Swap_Fee_Percent = Number(process.env.BOT_FEE_PERCENT);
export const Default_Swap_Heap = 0.001;

export const NOT_ASSIGNED = "-- Not assigned --";
export const PAYMENT_ADDRESS = process.env.PAYMENT_ADDRESS;

export let web3Conn: Connection;
export let treasuryWallet: any;
export let quoteToken: any = {
  address: process.env.QUOTE_TOKEN_ADDRESS,
  name: "NAME",
  symbol: "SYMBOL",
  decimals: 9,
};

export const setWeb3 = (conn: Connection) => {
  web3Conn = conn;
};

export const init = async () => {

};

export const errorLog = (summary: string, error: any): void => {
  if (error?.response?.body?.description) {
    console.log(
      "\x1b[31m%s\x1b[0m",
      `[error] ${summary} ${error.response.body.description}`
    );
  } else {
    console.log("\x1b[31m%s\x1b[0m", `[error] ${summary} ${error}`);
  }
};

export const parseError = (error: any): string => {
  let msg = "";
  try {
    error = JSON.parse(JSON.stringify(error));
    msg =
      error?.reasong ||
      error.error?.reason ||
      JSON.parse(error)?.error?.error?.response?.error?.message ||
      error?.response ||
      error?.message ||
      error;
  } catch (err) {
    msg = error;
  }

  return msg;
};

export const get_bot_link = () => {
  return `https://t.me/${process.env.BOT_USERNAME}`;
};

export const get_jito_block_api = () => {
  return process.env.JITO_BLOCK_ENGINE_URL as string;
};

export const get_tax_wallet_address = () => {
  return process.env.TAX_WALLET as string;
};