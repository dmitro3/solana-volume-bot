import mongoose from "mongoose";

export const User = mongoose.model(
  "User",
  new mongoose.Schema({
    chatId: String,
    username: String,
    depositWallet: String,
    timestamp: Number,
    referrId: String,
    referrRewardWallet: String,
  })
);

export const WhiteList = mongoose.model(
  "vb_WhiteList",
  new mongoose.Schema({
    chatId: String,
    limitTokenCount: Number,
    timestamp: Number,
  })
);

export const VolumeToken = mongoose.model(
  "vb_VolumeToken",
  new mongoose.Schema({
    chatId: String,
    addr: String,
    baseAddr: String,
    symbol: String,
    baseSymbol: String,
    decimal: Number,
    baseDecimal: Number,
    currentVolume: Number,
    targetVolume: Number,
    timestamp: Number,
    totalPayed: Number,
    workingTime: Number,
    lastWorkedTime: Number,
    ratingPer1H: Number,
    buyAmount: Number,
    status: Boolean,
    botId: Number,
    walletSize: Number,
    mode: Number,
  })
);

export const Wallet = mongoose.model(
  "vb_Wallet",
  new mongoose.Schema({
    chatId: String,
    prvKey: String,
    timestamp: Number,
    lastAction: Boolean,
  })
);

export const TaxHistory = mongoose.model(
  "TaxHistory",
  new mongoose.Schema({
    chatId: String,
    addr: String,
    amount: Number,
    timestamp: Number,
  })
);

export const Admin = mongoose.model(
  "vb_Admin",
  new mongoose.Schema({
    name: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  })
);

const TrxHistory = mongoose.model(
  "vb_Trx_History",
  new mongoose.Schema({
    chatId: String,
    solAmount: Number,
    tokenAmount: Number,
    mode: String,
    trxId: String,
    timestamp: Number,
  })
);

export const init = () => {
  return new Promise(async (resolve: any, reject: any) => {
    mongoose
      .connect(`${process.env.MONGODB_URI}`)
      .then(() => {
        console.log(`Connected to MongoDB...`);

        resolve();
      })
      .catch((err) => {
        console.error("Could not connect to MongoDB...", err);
        reject();
      });
  });
};

export const updateUser = (params: any) => {
  return new Promise(async (resolve, reject) => {
    User.findOne({ chatId: params.chatId }).then(async (user: any) => {
      if (!user) {
        user = new User();
      }

      user.chatId = params.chatId;
      user.username = params.username ?? "";
      user.depositWallet = params.depositWallet;
      user.referrId = params.referrId;
      user.referrRewardWallet = params.referrRewardWallet;

      await user.save();

      resolve(user);
    });
  });
};

export const removeUser = (params: any) => {
  return new Promise((resolve, reject) => {
    User.deleteOne({ chatId: params.chatId }).then(() => {
      resolve(true);
    });
  });
};

export async function selectUsers(params: any = {}) {
  return new Promise(async (resolve, reject) => {
    User.find(params).then(async (users) => {
      resolve(users);
    });
  });
}

export async function countUsers(params: any = {}) {
  return new Promise(async (resolve, reject) => {
    User.countDocuments(params).then(async (users) => {
      resolve(users);
    });
  });
}

export async function selectUser(params: any) {
  return new Promise(async (resolve, reject) => {
    User.findOne(params).then(async (user) => {
      resolve(user);
    });
  });
}

export async function deleteUser(params: any) {
  return new Promise(async (resolve, reject) => {
    User.deleteOne(params).then(async (user) => {
      resolve(user);
    });
  });
}

export const registToken = (params: any) => {
  return new Promise(async (resolve, reject) => {
    const item = new VolumeToken();
    item.timestamp = new Date().getTime();
    item.chatId = params.chatId;
    item.addr = params.addr;
    item.baseAddr = params.baseAddr;
    item.symbol = params.symbol;
    item.baseSymbol = params.baseSymbol;
    item.decimal = params.decimal;
    item.baseDecimal = params.baseDecimal;
    item.currentVolume = 0;
    item.targetVolume = 1;
    item.workingTime = 0;
    item.lastWorkedTime = 0;
    item.ratingPer1H = 5;
    item.buyAmount = 70;
    item.status = false;
    item.botId = 0;
    item.walletSize = 8;
    item.mode = 0;
    await item.save();
    resolve(item);
  });
};

export const removeToken = (params: any) => {
  return new Promise((resolve, reject) => {
    VolumeToken.deleteOne(params).then(() => {
      resolve(true);
    });
  });
};

export async function selectTokens(params: any = {}, limit: number = 0) {
  return new Promise(async (resolve, reject) => {
    if (limit) {
      VolumeToken.find(params)
        .limit(limit)
        .then(async (dcas) => {
          resolve(dcas);
        });
    } else {
      VolumeToken.find(params).then(async (dcas) => {
        resolve(dcas);
      });
    }
  });
}

export async function selectToken(params: any) {
  return new Promise(async (resolve, reject) => {
    VolumeToken.findOne(params).then(async (user) => {
      resolve(user);
    });
  });
}

export async function updateToken(params: any) {
  return new Promise(async (resolve, reject) => {
    VolumeToken.updateOne(params).then(async (user) => {
      resolve(user);
    });
  });
}

export async function selectTaxHistory(params: any) {
  return new Promise(async (resolve, reject) => {
    TaxHistory.findOne(params).then(async (history) => {
      resolve(history);
    });
  });
}

export async function updateTaxHistory(params: any, query: any) {
  return new Promise(async (resolve, reject) => {
    TaxHistory.updateOne(params, query).then(async (history) => {
      resolve(history);
    });
  });
}

export async function selectTaxHistories(params: any) {
  return new Promise(async (resolve, reject) => {
    TaxHistory.find(params).then(async (histories) => {
      resolve(histories);
    });
  });
}

export async function addTaxHistory(params: any) {
  return new Promise(async (resolve, reject) => {
    const item = new TaxHistory();
    item.timestamp = new Date().getTime();

    item.chatId = params.chatId;
    item.addr = params.solUp;
    item.amount = params.solDown;

    await item.save();

    resolve(item);
  });
}

export async function addTrxHistory(params: any = {}) {
  return new Promise(async (resolve, reject) => {
    try {
      let item = new TrxHistory();

      item.chatId = params.chatId;
      item.solAmount = params.solAmount;
      item.tokenAmount = params.tokenAmount;
      item.mode = params.mode;
      item.trxId = params.trxId;
      item.timestamp = new Date().getTime();

      await item.save();

      resolve(true);
    } catch (err) {
      resolve(false);
    }
  });
}

export async function addWallet(params: any) {
  return new Promise(async (resolve, reject) => {
    const item = new Wallet();
    item.timestamp = new Date().getTime();

    item.chatId = params.chatId;
    item.prvKey = params.prvKey;
    item.lastAction = false;

    await item.save();

    resolve(item);
  });
}

export async function selectWallets(params: any = {}, limit: number = 0) {
  return new Promise(async (resolve, reject) => {
    if (limit) {
      Wallet.find(params)
        .limit(limit)
        .then(async (dcas) => {
          resolve(dcas);
        });
    } else {
      Wallet.find(params).then(async (dcas) => {
        resolve(dcas);
      });
    }
  });
}

export async function addWhiteList(params: any) {
  return new Promise(async (resolve, reject) => {
    const item = new WhiteList();
    item.timestamp = new Date().getTime();

    item.limitTokenCount = params.limitTokenCount;
    item.chatId = params.chatId;

    await item.save();

    resolve(item);
  });
}

export async function selectWhiteLists(params: any = {}) {
  return new Promise(async (resolve, reject) => {
    WhiteList.find(params).then(async (dcas) => {
      resolve(dcas);
    });
  });
}
