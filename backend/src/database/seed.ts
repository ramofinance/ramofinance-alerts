import { MarketType } from "@prisma/client";
import { prisma } from "./prisma";

const markets = [
  {
    symbol: "BTCUSDT",
    name: "Bitcoin / Tether",
    type: MarketType.CRYPTO,
    baseAsset: "BTC",
    quoteAsset: "USDT"
  },
  {
    symbol: "ETHUSDT",
    name: "Ethereum / Tether",
    type: MarketType.CRYPTO,
    baseAsset: "ETH",
    quoteAsset: "USDT"
  },
  {
    symbol: "SOLUSDT",
    name: "Solana / Tether",
    type: MarketType.CRYPTO,
    baseAsset: "SOL",
    quoteAsset: "USDT"
  },
  {
    symbol: "BNBUSDT",
    name: "BNB / Tether",
    type: MarketType.CRYPTO,
    baseAsset: "BNB",
    quoteAsset: "USDT"
  },
  {
    symbol: "XRPUSDT",
    name: "XRP / Tether",
    type: MarketType.CRYPTO,
    baseAsset: "XRP",
    quoteAsset: "USDT"
  },
  {
    symbol: "EURUSD",
    name: "Euro / US Dollar",
    type: MarketType.FOREX,
    baseAsset: "EUR",
    quoteAsset: "USD"
  },
  {
    symbol: "GBPUSD",
    name: "British Pound / US Dollar",
    type: MarketType.FOREX,
    baseAsset: "GBP",
    quoteAsset: "USD"
  },
  {
    symbol: "XAUUSD",
    name: "Gold / US Dollar",
    type: MarketType.COMMODITY,
    baseAsset: "XAU",
    quoteAsset: "USD"
  },
  {
    symbol: "US100",
    name: "Nasdaq 100 Index",
    type: MarketType.INDEX,
    baseAsset: "US100",
    quoteAsset: "USD"
  },
  {
    symbol: "SPX500",
    name: "S&P 500 Index",
    type: MarketType.INDEX,
    baseAsset: "SPX500",
    quoteAsset: "USD"
  }
];

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

  const savedMarkets = await Promise.all(
    markets.map((market) =>
      prisma.market.upsert({
        where: {
          symbol: market.symbol
        },
        update: {
          name: market.name,
          type: market.type,
          baseAsset: market.baseAsset,
          quoteAsset: market.quoteAsset,
          isActive: true
        },
        create: market
      })
    )
  );

  console.log({
    userId: user.id,
    markets: savedMarkets.map((market) => market.symbol)
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
