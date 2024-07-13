import assert from "assert";
import dotenv from "dotenv";

import * as instance from "../bot";
import { OptionCode, StateCode } from "../utils/constant";
import * as botLogic from "./volume";
import * as utils from "../utils/utils";

dotenv.config();

const parseCode = async (database: any, session: any, wholeCode: string) => {
  let codes: string[] = wholeCode.split("_");
  console.log(codes);

  if (codes.length % 2 === 0) {
    for (let i = 0; i < codes.length; i += 2) {
      const type = codes[i];
      const code = codes[i + 1];

      if (type === "ref") {
        if (!session.referredBy) {
          let referredBy: string = "";

          referredBy = utils.decodechatId(code);
          if (referredBy === "" || referredBy === session.chatId) {
            continue;
          }

          if (referredBy.length > 0) {
            const refSession = instance.sessions.get(referredBy);
            if (refSession) {
              console.log(
                `${session.username} has been invited by @${refSession.username} (${refSession.chatId})`
              );
            }

            instance.sendInfoMessage(
              referredBy,
              `Great news! You have invited @${session.username}
You can earn 1.5% of their earning forever!`
            );

            session.referredBy = referredBy;
            session.referredTimestamp = new Date().getTime();
            session.referrId = "";
            session.referrRewardWallet = "";

            await database.updateUser(session);
          }
        }
      }
    }
  }
  return false;
};

export const procMessage = async (message: any, database: any) => {
  let chatId = message.chat.id.toString();
  let session = instance.sessions.get(chatId);
  let userName = message?.chat?.username;
  let messageId = message?.messageId;

  if (instance.busy) {
    return;
  }

  if (message.photo) {
    console.log(message.photo);
    processSettings(message, database);
  }

  if (message.animation) {
    console.log(message.animation);
    processSettings(message, database);
  }

  if (!message.text) return;

  let command = message.text;
  if (message.entities) {
    for (const entity of message.entities) {
      if (entity.type === "bot_command") {
        command = command.substring(
          entity.offset,
          entity.offset + entity.length
        );
        break;
      }
    }
  }

  if (command.startsWith("/")) {
    if (!session) {
      if (!userName) {
        console.log(
          `Rejected anonymous incoming connection. chatId = ${chatId}`
        );
        instance.sendMessage(
          chatId,
          `Welcome to ${process.env.BOT_TITLE} bot. We noticed that your telegram does not have a username. Please create username [Setting]->[Username] and try again.`
        );
        return;
      }

      if (false && !(await instance.checkWhitelist(chatId))) {
        //instance.sendMessage(chatId, `😇Sorry, but you do not have permission to use alphBot. If you would like to use this bot, please contact the developer team at ${process.env.TEAM_TELEGRAM}. Thanks!`);
        console.log(
          `Rejected anonymous incoming connection. @${userName}, ${chatId}`
        );
        return;
      }

      console.log(`@${userName} session has been permitted through whitelist`);

      session = await instance.createSession(chatId, userName);
      await database.updateUser(session);
    }

    if (userName && session.username !== userName) {
      session.username = userName;
      session.referrId = "";
      session.referrRewardWallet = "";
      await database.updateUser(session);
    }

    let params = message.text.split(" ");
    if (params.length > 0 && params[0] === command) {
      params.shift();
    }

    command = command.slice(1);

    if (command === instance.COMMAND_START) {
      let hideWelcome: boolean = false;
      if (params.length == 1 && params[0].trim() !== "") {
        let wholeCode = params[0].trim();
        hideWelcome = await parseCode(database, session, wholeCode);

        await instance.removeMessage(chatId, message.message_id);
      }

      instance.openMessage(
        chatId,
        "",
        0,
        `😉 Hi, To get quick start, please enter token address.`
      );
    }

    // instance.stateMap_remove(chatId)
  } else if (message.reply_to_message) {
    processSettings(message, database);
    await instance.removeMessage(chatId, message.message_id); //TGR
    await instance.removeMessage(chatId, message.reply_to_message.message_id);
  } else if (utils.isValidAddress(command)) {
    console.log(`@${userName} session has been permitted through whitelist`);

    if (!session) {
      session = await instance.createSession(chatId, userName);
      await database.updateUser(session);
    }
    await instance.removeMessage(chatId, messageId);
    const token: any = await database.selectToken({ chatId, addr: command });
    if (token) {
      session.addr = command;
      await instance.executeCommand(chatId, messageId, undefined, {
        c: OptionCode.MAIN_MENU,
        k: 1,
      });
    } else {
      const token: any = await database.selectToken({
        chatId,
        addr: session.addr,
      });
      if (token && token.status) {
        await instance.removeMessage(chatId, message.message_id);
        instance.openMessage(
          chatId,
          "",
          0,
          `⚠️ Warning, Bot is working now. If you need to start with new token, please stop the bot and try again.`
        );
      } else {
        session.addr = command;
        instance.executeCommand(chatId, messageId, undefined, {
          c: OptionCode.MAIN_NEW_TOKEN,
          k: 1,
        });
      }
    }
  } else {
    instance.openMessage(
      chatId,
      "",
      0,
      `😉 Hi, To get quick start, please enter token address.`
    );
  }
};

const processSettings = async (msg: any, database: any) => {
  const sessionId = msg.chat?.id.toString();
  let messageId = msg?.messageId;

  const session = instance.sessions.get(sessionId);
  if (!session) {
    return;
  }

  let stateNode = instance.stateMap_getFocus(sessionId);
  if (!stateNode) {
    instance.stateMap_setFocus(sessionId, StateCode.IDLE, {
      sessionId: sessionId,
    });
    stateNode = instance.stateMap_get(sessionId);

    assert(stateNode);
  }

  const stateData = stateNode.data;

  if (stateNode.state === StateCode.WAIT_WITHDRAW_WALLET_ADDRESS) {
    const addr = msg.text.trim();
    if (!addr || addr === "" || !utils.isValidAddress(addr)) {
      instance.openMessage(
        sessionId,
        "",
        0,
        `⛔ Sorry, the token address you entered is invalid. Please try again`
      );
      return;
    }
    // process wallet withdraw
    await instance.removeMessage(sessionId, messageId);
    await botLogic.withdraw(sessionId, addr);
    await instance.bot.answerCallbackQuery(stateData.callback_query_id, {
      text: `✔️ Withdraw is completed successfully.`,
    });
    const menu: any = await instance.json_main(sessionId);
    let title: string = await instance.getMainMenuMessage(sessionId);

    await instance.switchMenu(sessionId, messageId, title, menu.options);
    //
  } else if (stateNode.state === StateCode.WAIT_SET_TOKEN_SYMBOL) {
    // const symbol = msg.text.trim();
    // if (!symbol || symbol === "") {
    //     instance.openMessage(
    //         sessionId, "", 0,
    //         `⛔ Sorry, the token symbol you entered is invalid. Please try again`
    //     );
    //     return;
    // }
    // // process set token symbol
    // const registered = await botLogic.registerToken(sessionId, session.addr, symbol)
    // if (registered === constants.ResultCode.SUCCESS) {
    //     await instance.removeMessage(sessionId, messageId)
    //     await instance.openMessage(sessionId, "", 0, `✔️ Token is registered successfully.`);
    //     await instance.executeCommand(sessionId, messageId, undefined, {
    //         c: OptionCode.MAIN_MENU,
    //         k: 1,
    //     })
    // } else {
    //     await instance.openMessage(sessionId, "", 0, `❌ Token is not registered. Please try again later.`);
    // }
    //
  } else if (stateNode.state === StateCode.WAIT_SET_TARGET) {
    const amount = Number(msg.text.trim());
    if (isNaN(amount) || amount < 0.1) {
      await instance.openMessage(
        sessionId,
        "",
        0,
        `⛔ Sorry, the amount you entered is invalid. Please try again`
      );
      return;
    }
    // process set target amount
    await instance.removeMessage(sessionId, messageId);
    await botLogic.setTargetAmount(sessionId, session.addr, amount);
    const menu: any = await instance.json_main(sessionId);
    let title: string = await instance.getMainMenuMessage(sessionId);

    await instance.switchMenu(
      sessionId,
      stateData.menu_id,
      title,
      menu.options
    );
    //
  } else if (stateNode.state === StateCode.WAIT_SET_WALLET_SIZE) {
    const size = Number(msg.text.trim());
    if (isNaN(size) || size <= 0) {
      await instance.openMessage(
        sessionId,
        "",
        0,
        `⛔ Sorry, the number you entered is invalid. Please try again`
      );
      return;
    }
    // process set trx rating
    await instance.removeMessage(sessionId, messageId);
    await botLogic.setWalletSize(sessionId, session.addr, size);
    const menu: any = await instance.json_main(sessionId);
    let title: string = await instance.getMainMenuMessage(sessionId);

    await instance.switchMenu(
      sessionId,
      stateData.menu_id,
      title,
      menu.options
    );
    //
  } else if (stateNode.state === StateCode.WAIT_SET_RATING) {
    const amount = Number(msg.text.trim());
    if (isNaN(amount) || amount <= 0) {
      await instance.openMessage(
        sessionId,
        "",
        0,
        `⛔ Sorry, the amount you entered is invalid. Please try again`
      );
      return;
    }
    // process set trx rating
    await instance.removeMessage(sessionId, messageId);
    await botLogic.setRating(sessionId, session.addr, amount);
    const menu: any = await instance.json_main(sessionId);
    let title: string = await instance.getMainMenuMessage(sessionId);

    await instance.switchMenu(
      sessionId,
      stateData.menu_id,
      title,
      menu.options
    );
    //
  } else if (stateNode.state === StateCode.WAIT_SET_BUY_AMOUNT) {
    const amount = Number(msg.text.trim());
    if (isNaN(amount) || amount <= 0) {
      await instance.openMessage(
        sessionId,
        "",
        0,
        `⛔ Sorry, the amount you entered is invalid. Please try again`
      );
      return;
    }
    // process set buy amount
    await instance.removeMessage(sessionId, messageId);
    await botLogic.setBuyAmount(sessionId, session.addr, amount);
    const menu: any = await instance.json_main(sessionId);
    let title: string = await instance.getMainMenuMessage(sessionId);

    await instance.switchMenu(
      sessionId,
      stateData.menu_id,
      title,
      menu.options
    );
    //
  }
};
