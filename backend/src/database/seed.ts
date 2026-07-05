import { MarketType } from "@prisma/client";
import { prisma } from "./prisma";

const main = async () => {
  const user = await prisma.user.upsert({
    where: {
      telegramId: "100001"
    },
    update: {},
    create: {
      telegramId: "100001",
      username: "test_user",
      firstName: "Test",
      lastName: "User",
      languageCode: "fa"
    }
  });

  const market = await prisma.market.upsert({
    where: {
      symbol: "BTCUSDT"
    },
    update: {},
    create: {
      symbol: "BTCUSDT",
      name: "Bitcoin / Tether",
      type: MarketType.CRYPTO,
      baseAsset: "BTC",
      quoteAsset: "USDT"
    }
  });

  console.log({
    userId: user.id,
    marketId: market.id
  });
};

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
