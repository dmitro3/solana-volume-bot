import TelegramBot from "node-telegram-bot-api";
import * as C from "./utils/constant";
import * as utils from "./utils/utils";

import * as database from "./database/db";
import * as volBot from "./core/volume";
import * as prvBot from "./core/telegram";
import * as constants from "./utils/uniconst";
import * as global from "./global";

import dotenv from "dotenv";
dotenv.config();

export const COMMAND_START = "start";

export let bot: TelegramBot;
export let myInfo: TelegramBot.User;
export const sessions = new Map();
export const stateMap = new Map();

export let busy = true;

export const stateMap_setFocus = (
  chatId: string,
  state: any,
  data: any = {}
) => {
  let item = stateMap.get(chatId);
  if (!item) {
    item = stateMap_init(chatId);
  }

  if (!data) {
    let focusData = {};
    if (item.focus && item.focus.data) {
      focusData = item.focus.data;
    }

    item.focus = { state, data: focusData };
  } else {
    item.focus = { state, data };
  }

  // stateMap.set(chatId, item)
};

export const stateMap_getFocus = (chatId: string) => {
  const item = stateMap.get(chatId);
  if (item) {
    let focusItem = item.focus;
    return focusItem;
  }

  return null;
};

export const stateMap_init = (chatId: string) => {
  let item = {
    focus: { state: C.StateCode.IDLE, data: { sessionId: chatId } },
    message: new Map(),
  };

  stateMap.set(chatId, item);

  return item;
};

export const stateMap_setMessage_Id = (
  chatId: string,
  messageType: number,
  messageId: number
) => {
  let item = stateMap.get(chatId);
  if (!item) {
    item = stateMap_init(chatId);
  }

  item.message.set(`t${messageType}`, messageId);
  //stateMap.set(chatId, item)
};

export const stateMap_getMessage = (chatId: string) => {
  const item = stateMap.get(chatId);
  if (item) {
    let messageItem = item.message;
    return messageItem;
  }

  return null;
};

export const stateMap_getMessage_Id = (chatId: string, messageType: number) => {
  const messageItem = stateMap_getMessage(chatId);
  if (messageItem) {
    return messageItem.get(`t${messageType}`);
  }

  return null;
};

export const stateMap_get = (chatId: string) => {
  return stateMap.get(chatId);
};

export const stateMap_remove = (chatId: string) => {
  stateMap.delete(chatId);
};

export const stateMap_clear = () => {
  stateMap.clear();
};

export const json_buttonItem = (key: string, cmd: number, text: string) => {
  return {
    text: text,
    callback_data: JSON.stringify({ k: key, c: cmd }),
  };
};

const json_url_buttonItem = (text: string, url: string) => {
  return {
    text: text,
    url: url,
  };
};

const json_webapp_buttonItem = (text: string, url: any) => {
  return {
    text: text,
    web_app: {
      url,
    },
  };
};

export const removeMenu = async (chatId: string, messageType: number) => {
  const msgId = stateMap_getMessage_Id(chatId, messageType);

  if (msgId) {
    try {
      await bot.deleteMessage(chatId, msgId);
    } catch (error) {
      //global.errorLog('deleteMessage', error)
    }
  }
};

export const openMenu = async (
  chatId: string,
  messageType: number,
  menuTitle: string,
  json_buttons: any = []
) => {
  const keyboard = {
    inline_keyboard: json_buttons,
    resize_keyboard: false,
    one_time_keyboard: true,
    force_reply: true,
  };

  return new Promise(async (resolve, reject) => {
    await removeMenu(chatId, messageType);

    try {
      let msg: TelegramBot.Message = await bot.sendMessage(chatId, menuTitle, {
        reply_markup: keyboard,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      });

      stateMap_setMessage_Id(chatId, messageType, msg.message_id);
      resolve({ messageId: msg.message_id, chatId: msg.chat.id });
    } catch (error) {
      global.errorLog("openMenu", error);
      resolve(null);
    }
  });
};

export const openMessage = async (
  chatId: string,
  bannerId: string,
  messageType: number,
  menuTitle: string
) => {
  return new Promise(async (resolve, reject) => {
    await removeMenu(chatId, messageType);

    let msg: TelegramBot.Message;

    try {
      if (bannerId) {
        msg = await bot.sendPhoto(chatId, bannerId, {
          caption: menuTitle,
          parse_mode: "HTML",
        });
      } else {
        msg = await bot.sendMessage(chatId, menuTitle, {
          parse_mode: "HTML",
          disable_web_page_preview: true,
        });
      }

      stateMap_setMessage_Id(chatId, messageType, msg.message_id);
      // console.log('chatId, messageType, msg.message_id', chatId, messageType, msg.message_id)
      resolve({ messageId: msg.message_id, chatId: msg.chat.id });
    } catch (error) {
      global.errorLog("openMenu", error);
      resolve(null);
    }
  });
};

export async function switchMenu(
  chatId: string,
  messageId: number,
  title: string,
  json_buttons: any
) {
  const keyboard = {
    inline_keyboard: json_buttons,
    resize_keyboard: true,
    one_time_keyboard: true,
    force_reply: true,
  };

  try {
    await bot.editMessageText(title, {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: keyboard,
      disable_web_page_preview: true,
      parse_mode: "HTML",
    });
  } catch (error) {
    global.errorLog("[switchMenuWithTitle]", error);
  }
}

export const replaceMenu = async (
  chatId: string,
  messageId: number,
  messageType: number,
  menuTitle: string,
  json_buttons: any = []
) => {
  const keyboard = {
    inline_keyboard: json_buttons,
    resize_keyboard: true,
    one_time_keyboard: true,
    force_reply: true,
  };

  return new Promise(async (resolve, reject) => {
    try {
      await bot.deleteMessage(chatId, messageId);
    } catch (error) {
      //global.errorLog('deleteMessage', error)
    }

    await removeMenu(chatId, messageType);

    try {
      let msg: TelegramBot.Message = await bot.sendMessage(chatId, menuTitle, {
        reply_markup: keyboard,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      });

      stateMap_setMessage_Id(chatId, messageType, msg.message_id);
      // console.log('chatId, messageType, msg.message_id', chatId, messageType, msg.message_id)
      resolve({ messageId: msg.message_id, chatId: msg.chat.id });
    } catch (error) {
      global.errorLog("openMenu", error);
      resolve(null);
    }
  });
};

export const get_menuTitle = (sessionId: string, subTitle: string) => {
  const session = sessions.get(sessionId);
  if (!session) {
    return "ERROR " + sessionId;
  }

  let result =
    session.type === "private"
      ? `@${session.username}'s configuration setup`
      : `@${session.username} group's configuration setup`;

  if (subTitle && subTitle !== "") {
    //subTitle = subTitle.replace('%username%', `@${session.username}`)
    result += `\n${subTitle}`;
  }

  return result;
};

export const removeMessage = async (sessionId: string, messageId: number) => {
  if (sessionId && messageId) {
    try {
      await bot.deleteMessage(sessionId, messageId);
    } catch (error) {
      //console.error(error)
    }
  }
};

export const sendReplyMessage = async (chatId: string, message: string) => {
  try {
    let data: any = {
      parse_mode: "HTML",
      disable_forward: true,
      disable_web_page_preview: true,
      reply_markup: { force_reply: true },
    };

    const msg = await bot.sendMessage(chatId, message, data);
    return {
      messageId: msg.message_id,
      chatId: msg.chat ? msg.chat.id : null,
    };
  } catch (error) {
    global.errorLog("sendReplyMessage", error);
    return null;
  }
};

export const sendMessage = async (
  chatId: string,
  message: string,
  info: any = {}
) => {
  try {
    let data: any = { parse_mode: "HTML" };

    data.disable_web_page_preview = true;
    data.disable_forward = true;

    if (info && info.message_thread_id) {
      data.message_thread_id = info.message_thread_id;
    }

    const msg = await bot.sendMessage(chatId, message, data);
    return {
      messageId: msg.message_id,
      chatId: msg.chat ? msg.chat.id : null,
    };
  } catch (error: any) {
    if (
      error.response &&
      error.response.body &&
      error.response.body.error_code === 403
    ) {
      info.blocked = true;
      if (
        error?.response?.body?.description ==
        "Forbidden: bot was blocked by the user"
      ) {
        // database.removeUser({ chatId });
        // sessions.delete(chatId);
      }
    }

    console.log(error?.response?.body);
    global.errorLog("sendMessage", error);
    return null;
  }
};

export const sendInfoMessage = async (chatId: string, message: string) => {
  let json = [[json_buttonItem(chatId, C.OptionCode.CLOSE, "✖️ Close")]];

  return sendOptionMessage(chatId, message, json);
};

export const sendOptionMessage = async (
  chatId: string,
  message: string,
  option: any
) => {
  try {
    const keyboard = {
      inline_keyboard: option,
      resize_keyboard: true,
      one_time_keyboard: true,
    };

    const msg = await bot.sendMessage(chatId, message, {
      reply_markup: keyboard,
      disable_web_page_preview: true,
      parse_mode: "HTML",
    });
    return {
      messageId: msg.message_id,
      chatId: msg.chat ? msg.chat.id : null,
    };
  } catch (error) {
    global.errorLog("sendOptionMessage", error);

    return null;
  }
};

export const pinMessage = (chatId: string, messageId: number) => {
  try {
    bot.pinChatMessage(chatId, messageId);
  } catch (error) {
    console.error(error);
  }
};

export const checkWhitelist = (chatId: string) => {
  return true;
};

export const getMainMenuMessage = async (
  sessionId: string
): Promise<string> => {
  const session = sessions.get(sessionId);
  if (!session) {
    return "";
  }

  let token: any = null;
  if (session.addr != "") {
    token = await database.selectToken({
      chatId: sessionId,
      addr: session.addr,
    });
  }
  const user: any = await database.selectUser({ chatId: sessionId });
  const depositWallet: any = utils.getWalletFromPrivateKey(user.depositWallet);
  const SOLBalance: number = await utils.getWalletSOLBalance(depositWallet);

  const MESSAGE = `✨✨✨✨✨ Welcome to ${process.env.BOT_TITLE} ✨✨✨✨✨

${token
      ? `📜 Token Info: ${token.symbol}/${token.baseSymbol}
<code>${token.addr}</code>`
      : ``
    }

⌛ Bot worked: ${utils.roundDecimal(
      token.workingTime / constants.MINUTE,
      1
    )} min
💹 Bot made: ${utils.roundBigUnit(token.currentVolume, 2)}

💳 Your Deposit Wallet: ${utils.roundSolUnit(SOLBalance, 3)}
<code>${depositWallet.publicKey}</code>`;

  return MESSAGE;
};

export const json_main = async (sessionId: string) => {
  const session = sessions.get(sessionId);
  if (!session) {
    return "";
  }

  const token: any = await database.selectToken({
    chatId: sessionId,
    addr: session.addr,
  });
  const itemData = `${sessionId}`;
  const json = [
    [
      json_buttonItem(
        itemData,
        C.OptionCode.TITLE,
        `✨ ${process.env.BOT_TITLE} ✨`
      ),
    ],
    // [json_buttonItem(itemData, C.OptionCode.MAIN_PURCHASE, `🛒 Purchase`)],
    [
      json_buttonItem(
        itemData,
        C.OptionCode.MAIN_START_STOP,
        token.status ? "⚓ Stop" : "🚀 Start"
      ),
    ],
    [
      json_buttonItem(
        itemData,
        C.OptionCode.MAIN_SET_TARGET,
        `🎚️ Target Volume Amount (${token.targetVolume}M)`
      ),
    ],
    [
      json_buttonItem(
        itemData,
        C.OptionCode.MAIN_SET_RATING,
        `♻️ TRX Rating ${token.ratingPer1H}*${token.walletSize}/min`
      ),
      json_buttonItem(
        itemData,
        C.OptionCode.MAIN_SET_BUY_AMOUNT,
        `💸 Buy with ${token.buyAmount}% SOL`
      ),
    ],
    // [
    //   json_buttonItem(
    //     itemData,
    //     C.OptionCode.MAIN_SET_WALLET_SIZE,
    //     `🧾 Set Wallet Size (${token.walletSize})`
    //   ),
    //   json_buttonItem(itemData, C.OptionCode.MAIN_DIVIDE_SOL, "🪓 Divide"),
    //   json_buttonItem(itemData, C.OptionCode.MAIN_GATHER_SOL, "🧩 Gather"),
    // ],
    [json_buttonItem(itemData, C.OptionCode.MAIN_WITHDRAW_SOL, "💵 Withdraw")],
    [
      json_buttonItem(itemData, C.OptionCode.MAIN_REFRESH, "🔄 Refresh"),
      json_buttonItem(itemData, C.OptionCode.MAIN_HELP, "📖 Help"),
    ],
    [json_buttonItem(itemData, C.OptionCode.CLOSE, "❌ Close")],
  ];

  return { title: "", options: json };
};

export const json_purchase = async (sessionId: string) => {
  const session = sessions.get(sessionId);
  if (!session) {
    return null;
  }

  const title = `🛒 Purchase:
  ${constants.BOT_FOOTER_DASH}`;

  let json = [
    [json_buttonItem(sessionId, C.OptionCode.PURCHASE_BACK, "Back to Main")],
  ];
  return { title: title, options: json };
};

export const json_help = async (sessionId: string) => {
  const session = sessions.get(sessionId);
  if (!session) {
    return null;
  }

  const title = `📕 Help:

This bot uses 8 wallets for volume increasing.
You have to deposit some sol to your deposit wallet.

When bot starts working, bot takes tax from deposit wallet.
Tax is 10 * Target Volume Amount SOL

🎚️ Bot Settings:
🔹Target Volume Amount: This spec is amount of volume bot has to achieve. Bot stop automatically when achieves target.
🔹TRX Rating: This spec is transaction count per min.
🔹Set Wallet Size: This spec is size of wallet bot uses.
🔹Buy with SOL: This spec is amount of SOL to buy per transaction.

🔹Divide: This feature is to divide and send needed SOL to bot wallets. 
🔹Gather: This feature is to gather SOL from bot wallets.

You can withdraw SOL from deposit wallet

If need more features, cotact here: @huskar13
${constants.BOT_FOOTER_DASH}`;

  let json = [
    [json_buttonItem(sessionId, C.OptionCode.HELP_BACK, "Back to Main")],
  ];
  return { title: title, options: json };
};

export const json_confirm = async (
  sessionId: string,
  msg: string,
  btnCaption: string,
  btnId: number,
  itemData: string = ""
) => {
  const session = sessions.get(sessionId);
  if (!session) {
    return null;
  }

  const title = msg;

  let json = [
    [
      json_buttonItem(sessionId, C.OptionCode.CLOSE, "Close"),
      json_buttonItem(itemData, btnId, btnCaption),
    ],
  ];
  return { title: title, options: json };
};

export const openConfirmMenu = async (
  sessionId: string,
  msg: string,
  btnCaption: string,
  btnId: number,
  itemData: string = ""
) => {
  const menu: any = await json_confirm(
    sessionId,
    msg,
    btnCaption,
    btnId,
    itemData
  );
  if (menu) {
    await openMenu(sessionId, btnId, menu.title, menu.options);
  }
};

export const createSession = async (
  chatId: string,
  username: string
  // type: string
) => {
  let session: any = {};

  session.chatId = chatId;
  session.username = username;
  session.addr = "";
  session.referrId = "";
  session.referrRewardWallet = "";

  await setDefaultSettings(session);

  sessions.set(session.chatId, session);
  showSessionLog(session);

  return session;
};

export function showSessionLog(session: any) {
  if (session.type === "private") {
    console.log(
      `@${session.username} user${session.wallet
        ? " joined"
        : "'s session has been created (" + session.chatId + ")"
      }`
    );
  } else if (session.type === "group") {
    console.log(
      `@${session.username} group${session.wallet
        ? " joined"
        : "'s session has been created (" + session.chatId + ")"
      }`
    );
  } else if (session.type === "channel") {
    console.log(
      `@${session.username} channel${session.wallet ? " joined" : "'s session has been created"
      }`
    );
  }
}

export const defaultConfig = {
  vip: 0,
};

export const setDefaultSettings = async (session: any) => {
  session.timestamp = new Date().getTime();

  const depositWallet = utils.generateNewWallet();
  session.depositWallet = depositWallet?.secretKey;
  for (let i = 0; i < constants.MAX_WALLET_SIZE; i++) {
    console.log("==========Wallet Gen===========");
    const botWallet = utils.generateNewWallet();
    await database.addWallet({
      chatId: session.chatId,
      prvKey: botWallet?.secretKey,
    });
  }
};

export async function init() {
  busy = true;
  bot = new TelegramBot(process.env.BOT_TOKEN as string, {
    polling: true,
  });

  bot.on("message", async (message: any) => {
    const msgType = message?.chat?.type;
    if (msgType === "private") {
      prvBot.procMessage(message, database);
    } else if (msgType === "group" || msgType === "supergroup") {
    } else if (msgType === "channel") {
    }
  });

  bot.on("callback_query", async (callbackQuery: TelegramBot.CallbackQuery) => {
    const message = callbackQuery.message;
    if (!message) {
      return;
    }

    console.log("============callback_query-------------", message)
    const option = JSON.parse(callbackQuery.data as string);
    let chatId = message.chat.id.toString();

    executeCommand(chatId, message.message_id, callbackQuery.id, option);
  });

  console.log("========bot started========");
  busy = false;
}

export const sessionInit = async () => {
  await database.init();
  const users: any = await database.selectUsers();

  let loggedin = 0;
  for (const user of users) {
    let session = JSON.parse(JSON.stringify(user));
    session = utils.objectDeepCopy(session, ["_id", "__v"]);

    sessions.set(session.chatId, session);

    const wallets: any = await database.selectWallets({ chatId: user.chatId });
    if (wallets.length < constants.MAX_WALLET_SIZE) {
      for (
        let index = wallets.length;
        index < constants.MAX_WALLET_SIZE;
        index++
      ) {
        const botWallet = utils.generateNewWallet();
        await database.addWallet({
          chatId: user.chatId,
          prvKey: botWallet?.secretKey,
        });
      }
    }
  }

  const tokens: any = await database.selectTokens();
  for (let token of tokens) {
    if (token.status) {
      volBot.start(token.chatId, token.addr);
      openMessage(
        token.chatId,
        "",
        0,
        "⚠️ Warning, Bot server is restarted just now. Bot continues to make volume..."
      );
    }
  }

  console.log(`${users.length} users, ${loggedin} logged in`);
};

export const reloadCommand = async (
  chatId: string,
  messageId: number,
  callbackQueryId: string,
  option: any
) => {
  await removeMessage(chatId, messageId);
  executeCommand(chatId, messageId, callbackQueryId, option);
};

export const executeCommand = async (
  chatId: string,
  _messageId: number | undefined,
  _callbackQueryId: string | undefined,
  option: any
) => {
  const cmd = option.c;
  const id = option.k;

  console.log(`executeCommand cmd = ${cmd} id = ${id}`);

  const session = sessions.get(chatId);
  if (!session) {
    return;
  }

  let messageId = Number(_messageId ?? 0);
  let callbackQueryId = _callbackQueryId ?? "";

  const sessionId: string = chatId;
  const stateData: any = { sessionId, messageId, callbackQueryId, cmd };

  stateData.message_id = messageId;
  stateData.callback_query_id = callbackQueryId;

  try {
    switch (cmd) {
      case C.OptionCode.MAIN_NEW_TOKEN: {
        const { exist, symbol, decimal }: any = await utils.getTokenInfo(
          session.addr
        );
        // if (exist) {
        //   await openMessage(
        //     chatId,
        //     "",
        //     0,
        //     `❌ Token is invalid. Please try again later.`
        //   );
        //   return;
        // }
        const registered = await volBot.registerToken(
          chatId,
          session.addr,
          symbol,
          decimal
        );
        if (registered === constants.ResultCode.SUCCESS) {
          await removeMessage(chatId, messageId);
          await openMessage(
            chatId,
            "",
            0,
            `✔️ Token is registered successfully.`
          );
          const menu: any = await json_main(chatId);
          let title: string = await getMainMenuMessage(chatId);

          await openMenu(chatId, cmd, title, menu.options);
        } else {
        }
        break;
      }
      case C.OptionCode.MAIN_REFRESH: {
        const menu: any = await json_main(sessionId);
        let title: string = await getMainMenuMessage(sessionId);

        switchMenu(chatId, messageId, title, menu.options);
        break;
      }
      case C.OptionCode.MAIN_MENU: {
        const menu: any = await json_main(sessionId);
        let title: string = await getMainMenuMessage(sessionId);

        await openMenu(chatId, cmd, title, menu.options);
        break;
      }
      case C.OptionCode.MAIN_PURCHASE: {
        await removeMessage(sessionId, messageId);
        const menu: any = await json_purchase(sessionId);

        await openMenu(chatId, messageId, menu.title, menu.options);
        break;
      }
      case C.OptionCode.MAIN_START_STOP: {
        bot.answerCallbackQuery(callbackQueryId, {
          text: `⏱️ Please wait a sec...`,
        });

        const token: any = await database.selectToken({
          chatId,
          addr: session.addr,
        });
        if (token.status) {
          const result = await volBot.stop(chatId, session.addr);
        } else {
          const result = await volBot.start(chatId, session.addr);
          switch (result) {
            case constants.ResultCode.USER_INSUFFICIENT_SOL:
              openMessage(
                chatId,
                "",
                0,
                `😢 Sorry, There is not enough sol in deposit wallet. please deposit enough sol to start and try again.`
              );
              break;
            case constants.ResultCode.USER_INSUFFICIENT_ENOUGH_SOL:
              openMessage(
                chatId,
                "",
                0,
                `😢 Sorry, There is not enough sol in deposit wallet. please deposit enough sol to start and try again.`
              );
              break;
            case constants.ResultCode.USER_INSUFFICIENT_JITO_FEE_SOL:
              openMessage(
                chatId,
                "",
                0,
                `😢 Sorry, There is not enough sol in deposit wallet. please deposit enough sol to start and try again.`
              );
              break;
            case constants.ResultCode.USER_INSUFFICIENT_ENOUGH_SOL:
              openMessage(
                chatId,
                "",
                0,
                `😢 Sorry, There is not enough sol in deposit wallet. please deposit enough sol to start and try again.`
              );
              break;
            default:
              break;
          }
        }
        const menu: any = await json_main(sessionId);
        let title: string = await getMainMenuMessage(sessionId);

        await switchMenu(chatId, messageId, title, menu.options);
        break;
      }
      case C.OptionCode.MAIN_SET_TARGET: {
        await sendReplyMessage(
          stateData.sessionId,
          `📨 Reply to this message with amount of volume to make.\nMin: 0.1`
        );
        stateData.menu_id = messageId;
        stateMap_setFocus(chatId, C.StateCode.WAIT_SET_TARGET, stateData);
        break;
      }
      case C.OptionCode.MAIN_SET_RATING: {
        await sendReplyMessage(
          stateData.sessionId,
          `📨 Reply to this message with value of rating to set.\nFor example: 2 or 5`
        );
        stateData.menu_id = messageId;
        stateMap_setFocus(chatId, C.StateCode.WAIT_SET_RATING, stateData);
        break;
      }
      case C.OptionCode.MAIN_SET_WALLET_SIZE: {
        await sendReplyMessage(
          stateData.sessionId,
          `📨 Reply to this message with wallet size to use.\nMin: 1, Max: 8`
        );
        stateData.menu_id = messageId;
        stateMap_setFocus(chatId, C.StateCode.WAIT_SET_WALLET_SIZE, stateData);
        break;
      }
      case C.OptionCode.MAIN_SET_BUY_AMOUNT: {
        await sendReplyMessage(
          stateData.sessionId,
          `📨 Reply to this message with amount of SOL to use in buying.\nMin: 5, Max: 95`
        );
        stateData.menu_id = messageId;
        stateMap_setFocus(chatId, C.StateCode.WAIT_SET_BUY_AMOUNT, stateData);
        break;
      }
      case C.OptionCode.MAIN_WITHDRAW_SOL: {
        await sendReplyMessage(
          stateData.sessionId,
          `📨 Reply to this message with your phantom wallet address to withdraw.`
        );
        stateMap_setFocus(
          chatId,
          C.StateCode.WAIT_WITHDRAW_WALLET_ADDRESS,
          stateData
        );
        break;
      }
      case C.OptionCode.MAIN_DIVIDE_SOL: {
        bot.answerCallbackQuery(callbackQueryId, {
          text: `⏱️ Please wait a sec...`,
        });
        // divide to wallets
        const result = await volBot.dispersWallets(chatId);
        switch (result) {
          case constants.ResultCode.USER_INSUFFICIENT_SOL:
            openMessage(
              chatId,
              "",
              0,
              `😢 Sorry, There is not enough sol in deposit wallet. please deposit enough sol to start and try again.`
            );
            return;
          case constants.ResultCode.USER_INSUFFICIENT_ENOUGH_SOL:
            openMessage(
              chatId,
              "",
              0,
              `😢 Sorry, There is not enough sol in deposit wallet. please deposit enough sol to start and try again.`
            );
            return;
          case constants.ResultCode.USER_INSUFFICIENT_JITO_FEE_SOL:
            openMessage(
              chatId,
              "",
              0,
              `😢 Sorry, There is not enough sol in deposit wallet. please deposit enough sol to start and try again.`
            );
            return;
          case constants.ResultCode.USER_INSUFFICIENT_ENOUGH_SOL:
            openMessage(
              chatId,
              "",
              0,
              `😢 Sorry, There is not enough sol in deposit wallet. please deposit enough sol to start and try again.`
            );
            return;
          default:
            break;
        }
        const menu: any = await json_main(sessionId);
        let title: string = await getMainMenuMessage(sessionId);

        await switchMenu(chatId, messageId, title, menu.options);
        break;
      }
      case C.OptionCode.MAIN_GATHER_SOL: {
        bot.answerCallbackQuery(callbackQueryId, {
          text: `⏱️ Please wait a sec...`,
        });
        // gather from wallets
        await volBot.gatherToWallet(chatId);
        const menu: any = await json_main(sessionId);
        let title: string = await getMainMenuMessage(sessionId);

        await switchMenu(chatId, messageId, title, menu.options);
        break;
      }
      case C.OptionCode.PURCHASE_BACK:
      case C.OptionCode.HELP_BACK: {
        await removeMessage(sessionId, messageId);
        const menu: any = await json_main(sessionId);
        let title: string = await getMainMenuMessage(sessionId);

        await openMenu(chatId, cmd, title, menu.options);
        break;
      }
      case C.OptionCode.CLOSE: {
        await removeMessage(sessionId, messageId);
        break;
      }
      case C.OptionCode.MAIN_HELP: {
        await removeMessage(sessionId, messageId);
        const menu: any = await json_help(sessionId);

        await openMenu(chatId, messageId, menu.title, menu.options);
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.log(err);
    sendMessage(
      chatId,
      `😢 Sorry, Bot server restarted. Please try again with input token address 😉`
    );
    if (callbackQueryId)
      await bot.answerCallbackQuery(callbackQueryId, {
        text: `😢 Sorry, Bot server restarted. Please try again with input token address 😉`,
      });
  }
};
