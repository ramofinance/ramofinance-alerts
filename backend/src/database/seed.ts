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
    symbol: "ADAUSDT",
    name: "ADA / Tether",
    type: MarketType.CRYPTO,
    baseAsset: "ADA",
    quoteAsset: "USDT"
  },
  {
    symbol: "DOGEUSDT",
    name: "DOGE / Tether",
    type: MarketType.CRYPTO,
    baseAsset: "DOGE",
    quoteAsset: "USDT"
  },
  {
    symbol: "TRXUSDT",
    name: "TRX / Tether",
    type: MarketType.CRYPTO,
    baseAsset: "TRX",
    quoteAsset: "USDT"
  },
  {
    symbol: "XLMUSDT",
    name: "XLM / Tether",
    type: MarketType.CRYPTO,
    baseAsset: "XLM",
    quoteAsset: "USDT"
  },
  {
    symbol: "XMRUSDT",
    name: "XMR / Tether",
    type: MarketType.CRYPTO,
    baseAsset: "XMR",
    quoteAsset: "USDT"
  },
  {
    symbol: "LINKUSDT",
    name: "LINK / Tether",
    type: MarketType.CRYPTO,
    baseAsset: "LINK",
    quoteAsset: "USDT"
  },
  {
    symbol: "BCHUSDT",
    name: "BCH / Tether",
    type: MarketType.CRYPTO,
    baseAsset: "BCH",
    quoteAsset: "USDT"
  },
  {
    symbol: "LTCUSDT",
    name: "LTC / Tether",
    type: MarketType.CRYPTO,
    baseAsset: "LTC",
    quoteAsset: "USDT"
  },
  {
    symbol: "SUIUSDT",
    name: "SUI / Tether",
    type: MarketType.CRYPTO,
    baseAsset: "SUI",
    quoteAsset: "USDT"
  },
  {
    symbol: "HBARUSDT",
    name: "HBAR / Tether",
    type: MarketType.CRYPTO,
    baseAsset: "HBAR",
    quoteAsset: "USDT"
  },
  {
    symbol: "AVAXUSDT",
    name: "AVAX / Tether",
    type: MarketType.CRYPTO,
    baseAsset: "AVAX",
    quoteAsset: "USDT"
  },
  {
    symbol: "SHIBUSDT",
    name: "SHIB / Tether",
    type: MarketType.CRYPTO,
    baseAsset: "SHIB",
    quoteAsset: "USDT"
  },
  {
    symbol: "NEARUSDT",
    name: "NEAR / Tether",
    type: MarketType.CRYPTO,
    baseAsset: "NEAR",
    quoteAsset: "USDT"
  },
  {
    symbol: "UNIUSDT",
    name: "UNI / Tether",
    type: MarketType.CRYPTO,
    baseAsset: "UNI",
    quoteAsset: "USDT"
  },
  {
    symbol: "TAOUSDT",
    name: "TAO / Tether",
    type: MarketType.CRYPTO,
    baseAsset: "TAO",
    quoteAsset: "USDT"
  },
  {
    symbol: "ONDOUSDT",
    name: "ONDO / Tether",
    type: MarketType.CRYPTO,
    baseAsset: "ONDO",
    quoteAsset: "USDT"
  },
  {
    symbol: "ETCUSDT",
    name: "ETC / Tether",
    type: MarketType.CRYPTO,
    baseAsset: "ETC",
    quoteAsset: "USDT"
  },
  {
    symbol: "APTUSDT",
    name: "APT / Tether",
    type: MarketType.CRYPTO,
    baseAsset: "APT",
    quoteAsset: "USDT"
  },
  {
    symbol: "ICPUSDT",
    name: "ICP / Tether",
    type: MarketType.CRYPTO,
    baseAsset: "ICP",
    quoteAsset: "USDT"
  },
  {
    symbol: "FILUSDT",
    name: "FIL / Tether",
    type: MarketType.CRYPTO,
    baseAsset: "FIL",
    quoteAsset: "USDT"
  },
  {
    symbol: "ATOMUSDT",
    name: "ATOM / Tether",
    type: MarketType.CRYPTO,
    baseAsset: "ATOM",
    quoteAsset: "USDT"
  },
  {
    symbol: "ARBUSDT",
    name: "ARB / Tether",
    type: MarketType.CRYPTO,
    baseAsset: "ARB",
    quoteAsset: "USDT"
  },
  {
    symbol: "OPUSDT",
    name: "OP / Tether",
    type: MarketType.CRYPTO,
    baseAsset: "OP",
    quoteAsset: "USDT"
  },
  {
    symbol: "INJUSDT",
    name: "INJ / Tether",
    type: MarketType.CRYPTO,
    baseAsset: "INJ",
    quoteAsset: "USDT"
  },
  {
    symbol: "IMXUSDT",
    name: "IMX / Tether",
    type: MarketType.CRYPTO,
    baseAsset: "IMX",
    quoteAsset: "USDT"
  },
  {
    symbol: "RENDERUSDT",
    name: "RENDER / Tether",
    type: MarketType.CRYPTO,
    baseAsset: "RENDER",
    quoteAsset: "USDT"
  },
  {
    symbol: "STXUSDT",
    name: "STX / Tether",
    type: MarketType.CRYPTO,
    baseAsset: "STX",
    quoteAsset: "USDT"
  },
  {
    symbol: "MKRUSDT",
    name: "MKR / Tether",
    type: MarketType.CRYPTO,
    baseAsset: "MKR",
    quoteAsset: "USDT"
  },
  {
    symbol: "AAVEUSDT",
    name: "AAVE / Tether",
    type: MarketType.CRYPTO,
    baseAsset: "AAVE",
    quoteAsset: "USDT"
  },
  {
    symbol: "PEPEUSDT",
    name: "PEPE / Tether",
    type: MarketType.CRYPTO,
    baseAsset: "PEPE",
    quoteAsset: "USDT"
  },
  {
    symbol: "ALGOUSDT",
    name: "ALGO / Tether",
    type: MarketType.CRYPTO,
    baseAsset: "ALGO",
    quoteAsset: "USDT"
  },
  {
    symbol: "VETUSDT",
    name: "VET / Tether",
    type: MarketType.CRYPTO,
    baseAsset: "VET",
    quoteAsset: "USDT"
  },
  {
    symbol: "FTMUSDT",
    name: "FTM / Tether",
    type: MarketType.CRYPTO,
    baseAsset: "FTM",
    quoteAsset: "USDT"
  },
  {
    symbol: "EGLDUSDT",
    name: "EGLD / Tether",
    type: MarketType.CRYPTO,
    baseAsset: "EGLD",
    quoteAsset: "USDT"
  },
  {
    symbol: "THETAUSDT",
    name: "THETA / Tether",
    type: MarketType.CRYPTO,
    baseAsset: "THETA",
    quoteAsset: "USDT"
  },
  {
    symbol: "GRTUSDT",
    name: "GRT / Tether",
    type: MarketType.CRYPTO,
    baseAsset: "GRT",
    quoteAsset: "USDT"
  },
  {
    symbol: "RUNEUSDT",
    name: "RUNE / Tether",
    type: MarketType.CRYPTO,
    baseAsset: "RUNE",
    quoteAsset: "USDT"
  },
  {
    symbol: "FLOWUSDT",
    name: "FLOW / Tether",
    type: MarketType.CRYPTO,
    baseAsset: "FLOW",
    quoteAsset: "USDT"
  },
  {
    symbol: "QNTUSDT",
    name: "QNT / Tether",
    type: MarketType.CRYPTO,
    baseAsset: "QNT",
    quoteAsset: "USDT"
  },
  {
    symbol: "SEIUSDT",
    name: "SEI / Tether",
    type: MarketType.CRYPTO,
    baseAsset: "SEI",
    quoteAsset: "USDT"
  },
  {
    symbol: "KASUSDT",
    name: "KAS / Tether",
    type: MarketType.CRYPTO,
    baseAsset: "KAS",
    quoteAsset: "USDT"
  },
  {
    symbol: "JASMYUSDT",
    name: "JASMY / Tether",
    type: MarketType.CRYPTO,
    baseAsset: "JASMY",
    quoteAsset: "USDT"
  },
  {
    symbol: "WIFUSDT",
    name: "WIF / Tether",
    type: MarketType.CRYPTO,
    baseAsset: "WIF",
    quoteAsset: "USDT"
  },
  {
    symbol: "BONKUSDT",
    name: "BONK / Tether",
    type: MarketType.CRYPTO,
    baseAsset: "BONK",
    quoteAsset: "USDT"
  },
  {
    symbol: "CRVUSDT",
    name: "CRV / Tether",
    type: MarketType.CRYPTO,
    baseAsset: "CRV",
    quoteAsset: "USDT"
  },
  {
    symbol: "SNXUSDT",
    name: "SNX / Tether",
    type: MarketType.CRYPTO,
    baseAsset: "SNX",
    quoteAsset: "USDT"
  },
  {
    symbol: "MANAUSDT",
    name: "MANA / Tether",
    type: MarketType.CRYPTO,
    baseAsset: "MANA",
    quoteAsset: "USDT"
  },
  {
    symbol: "SANDUSDT",
    name: "SAND / Tether",
    type: MarketType.CRYPTO,
    baseAsset: "SAND",
    quoteAsset: "USDT"
  },
  {
    symbol: "AXSUSDT",
    name: "AXS / Tether",
    type: MarketType.CRYPTO,
    baseAsset: "AXS",
    quoteAsset: "USDT"
  },
  {
    symbol: "GALAUSDT",
    name: "GALA / Tether",
    type: MarketType.CRYPTO,
    baseAsset: "GALA",
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
    symbol: "USDJPY",
    name: "US Dollar / Japanese Yen",
    type: MarketType.FOREX,
    baseAsset: "USD",
    quoteAsset: "JPY"
  },
  {
    symbol: "USDCHF",
    name: "US Dollar / Swiss Franc",
    type: MarketType.FOREX,
    baseAsset: "USD",
    quoteAsset: "CHF"
  },
  {
    symbol: "AUDUSD",
    name: "Australian Dollar / US Dollar",
    type: MarketType.FOREX,
    baseAsset: "AUD",
    quoteAsset: "USD"
  },
  {
    symbol: "USDCAD",
    name: "US Dollar / Canadian Dollar",
    type: MarketType.FOREX,
    baseAsset: "USD",
    quoteAsset: "CAD"
  },
  {
    symbol: "NZDUSD",
    name: "New Zealand Dollar / US Dollar",
    type: MarketType.FOREX,
    baseAsset: "NZD",
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
