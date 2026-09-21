export type RadarHelpKey =
  | "notifications" | "minimumScore" | "capRanges" | "sourceDex" | "sourceCex" | "minDexVolume" | "minMarketCap" | "maxMarketCap" | "minTurnover24h" | "minTurnover72h"
  | "minAcceleration" | "minPriceChange" | "minTrades" | "minUniqueBuyers"
  | "minBuyPressure" | "minWhaleBuy" | "minBidWall" | "minCex" | "minChannels"
  | "minOi" | "minShortLiq" | "minSqueezeDepth" | "maxFunding"
  | "minDexTurnover" | "minDexLiquidity" | "minDexBuyPressure" | "minOnchainWhale" | "minExchangeOutflow";

type HelpMap = Record<RadarHelpKey, string>;

const fa: HelpMap = {
  capRanges: "سه بازه مستقل برای شکار Gem هستند: Low Cap از 10 هزار تا 1 میلیون دلار، Mid Cap از 1 تا 100 میلیون دلار و High Cap از 100 تا 500 میلیون دلار. هر بازه تیک مستقل دارد؛ پیش‌فرض Low و Mid روشن و High خاموش است. حداقل یک بازه باید روشن بماند.",
  sourceDex: "اگر روشن باشد سیگنال‌های دارای داده DEX می‌توانند وارد هشدارهای شما شوند. اگر خاموش باشد سیگنال DEX-only برای شما ارسال نمی‌شود؛ داده DEX ممکن است همچنان به‌عنوان اطلاعات تکمیلی روی دارایی مشترک نمایش داده شود. حداقل یکی از DEX یا CEX باید روشن باشد.",
  sourceCex: "اگر روشن باشد سیگنال‌های صرافی‌های متمرکز مثل Binance، Bybit و OKX می‌توانند وارد هشدارهای شما شوند. اگر خاموش باشد سیگنال CEX-only برای شما ارسال نمی‌شود. حداقل یکی از DEX یا CEX باید روشن باشد.",
  minDexVolume: "حداقل حجم معاملات 24 ساعته روی DEX. برای Gemهای اولیه مهم است. مقدار 0 یعنی این شرط به‌عنوان فیلتر اجباری اعمال نمی‌شود؛ اگر داده موجود باشد همچنان در Score اصلی اثر دارد.",
  notifications: "اگر خاموش باشد، Radar همچنان اسکن و سیگنال‌ها را داخل مینی‌اپ ثبت می‌کند اما برای شما پیام هشدار تلگرام ارسال نمی‌شود. روشن کردن آن فقط تحویل هشدار به تلگرام را فعال می‌کند.",
  minimumScore: "حداقل امتیاز نهایی Radar برای ارسال هشدار تلگرام است. لیست داخل مینی‌اپ مستقل از این عدد، همه کاندیدهای واجد شرایط با امتیاز ۶۰ به بالا را نشان می‌دهد. امتیاز اصلی فقط از فاکتورهای اولویت‌دار ساخته می‌شود و داده‌های دیگر اطلاعات تکمیلی هستند. این گزینه ۰ ندارد و همیشه برای هشدار تلگرام فعال است.",
  minMarketCap: "حداقل مارکت‌کپ مجاز. برای شکار Gem می‌توانی آن را پایین بیاوری. مقدار ۰ یعنی این فیلتر حداقل مارکت‌کپ در هشدارها اعمال نشود. روی DEX در نبود مارکت‌کپ تأییدشده ممکن است FDV منبع جایگزین شود؛ خود موتور برای حذف داده‌های کاملاً بی‌کیفیت یک کف فنی بسیار پایین دارد.",
  maxMarketCap: "حداکثر مارکت‌کپ مجاز. برای تمرکز روی Gemها سقف را مثلاً روی 100M بگذار. مقدار ۰ یعنی هیچ سقفی اعمال نشود.",
  minTurnover24h: "نسبت حجم معاملات ۲۴ساعته به مارکت‌کپ. مثال: مارکت‌کپ 10M و حجم 2M یعنی 20٪. مقدار ۰ یعنی این شرط به‌عنوان فیلتر اجباری خاموش است؛ خود این فاکتور همچنان می‌تواند در Score اثر بگذارد.",
  minTurnover72h: "نسبت حجم تقریبی ۷۲ساعته به مارکت‌کپ برای تشخیص تداوم گردش سرمایه. مقدار ۰ یعنی شرط اجباری خاموش است، ولی اگر داده موجود باشد در امتیاز لحاظ می‌شود.",
  minAcceleration: "حداقل شتاب حجم کوتاه‌مدت؛ مثلاً 2x یعنی حجم اخیر دو برابر خط پایه است. مقدار ۰ یعنی این فیلتر اجباری خاموش است.",
  minPriceChange: "حداقل تغییر قیمت ۲۴ساعته برای هشدار. مقدار مثبت فقط رشدهای بزرگ‌تر را عبور می‌دهد. مقدار ۰ یعنی این فیلتر اجباری خاموش است؛ تغییر قیمت همچنان در Score اثر دارد.",
  minTrades: "حداقل تعداد معاملات ۲۴ساعته. روی CEX این عدد تعداد معامله است و هویت کاربران عمومی نیست؛ روی DEX در کنار خریداران یکتا بررسی می‌شود. مقدار ۰ یعنی فیلتر تعداد معاملات خاموش است.",
  minUniqueBuyers: "حداقل تعداد خریداران یکتای DEX در ۲۴ ساعت؛ برای تشخیص اینکه حجم از تعداد زیادی Wallet آمده یا از چند آدرس محدود. این داده از GeckoTerminal گرفته می‌شود. مقدار ۰ یعنی شرط اجباری خاموش است. برای CEX تعداد کاربر یکتا عمومی نیست.",
  minBuyPressure: "حداقل برتری خریدهای تیکر نسبت به فروش‌ها. عدد بالاتر یعنی فشار خرید فعال بیشتر است. مقدار ۰ یعنی فیلتر اجباری خاموش است.",
  minWhaleBuy: "حداقل حجم خریدهای بزرگ/Whale. در امتیاز، خالص خرید بزرگ یعنی خریدهای درشت منهای فروش‌های درشت مهم‌تر است. مقدار ۰ یعنی این شرط اجباری خاموش است.",
  minBidWall: "حداقل برتری ارزش سفارش‌های Bid نسبت به Ask در Order Book. برای تشخیص Buy Wall قوی استفاده می‌شود. مقدار ۰ یعنی فیلتر اجباری خاموش است.",
  minCex: "حداقل تعداد صرافی متمرکز از Binance، Bybit و OKX که حرکت را تأیید کنند. برای Gemهای DEX بهتر است معمولاً ۰ باشد. مقدار ۰ یعنی CEX اجباری نیست.",
  minChannels: "حداقل تعداد کانال‌های مانیتورشده که همان کوین را گزارش کرده‌اند. این فقط لایه تأیید کمکی است. مقدار ۰ یعنی تأیید کانال اجباری نیست.",
  minOi: "حداقل رشد Open Interest در بازار فیوچرز. رشد OI همراه با قیمت/حجم می‌تواند ورود پوزیشن جدید را نشان دهد. مقدار ۰ یعنی این شرط اجباری خاموش است.",
  minShortLiq: "حداقل ارزش دلاری Short Liquidation در پنجره اخیر. لیکویید شدن شورت‌ها می‌تواند به حرکت سریع صعودی کمک کند. مقدار ۰ یعنی این شرط اجباری خاموش است.",
  minSqueezeDepth: "حداقل عمق Short Squeeze برحسب تعداد کندل قبلی که سقفشان توسط کندل جاری گرفته شده است. Radar تایم‌فریم‌های 15m، 1h، 4h و 1D را بررسی و بهترین عمق را ثبت می‌کند. مقدار ۰ یعنی این شرط اجباری خاموش است.",
  maxFunding: "حداکثر قدرمطلق Funding Rate. برای حذف بازارهای بیش‌ازحد یک‌طرفه استفاده می‌شود. مقدار ۰ یعنی هیچ محدودیت Funding اعمال نشود.",
  minDexTurnover: "حداقل حجم DEX نسبت به مارکت‌کپ. برای Gemهایی که رشد اولیه را روی DEX شروع می‌کنند مهم است. مقدار ۰ یعنی شرط اجباری خاموش است.",
  minDexLiquidity: "حداقل نقدینگی استخر DEX. نقدینگی خیلی کم ریسک لغزش و دستکاری را بالا می‌برد. مقدار ۰ یعنی فیلتر دلخواه شما خاموش است؛ با این حال موتور برای حذف استخرهای عملاً غیرقابل‌معامله یک کف فنی حداقلی دارد.",
  minDexBuyPressure: "حداقل برتری تعداد خریدها نسبت به فروش‌ها روی DEX. مقدار ۰ یعنی این شرط اجباری خاموش است.",
  minOnchainWhale: "حداقل ارزش انتقال بزرگ آن‌چین. انتقال بزرگ به‌تنهایی صعودی یا نزولی نیست و جهت مبدا/مقصد هم بررسی می‌شود. مقدار ۰ یعنی شرط اجباری خاموش است.",
  minExchangeOutflow: "حداقل خروج دارایی از آدرس‌های شناخته‌شده صرافی به Walletهای بیرونی. می‌تواند کاهش موجودی قابل فروش در صرافی را نشان دهد، ولی به‌تنهایی سیگنال خرید نیست. مقدار ۰ یعنی شرط اجباری خاموش است."
};

const en: HelpMap = {
  capRanges: "Three independent Gem ranges: Low Cap $10K-$1M, Mid Cap $1M-$100M, and High Cap $100M-$500M. Each has its own checkbox. Low and Mid are on by default; High is off. At least one range must stay enabled.",
  sourceDex: "When enabled, signals with DEX data can be eligible for your alerts. When off, DEX-only signals are excluded for you, while DEX data may still appear as supplementary evidence on assets that also trade elsewhere. At least one of DEX or CEX must remain enabled.",
  sourceCex: "When enabled, signals from centralized exchanges such as Binance, Bybit and OKX can be eligible for your alerts. When off, CEX-only signals are excluded for you. At least one of DEX or CEX must remain enabled.",
  minDexVolume: "Minimum 24h DEX trading volume. It is important for early-stage gems. 0 disables this mandatory filter; when data exists, DEX volume can still contribute to the primary score.",
  notifications: "When off, Radar still scans and records signals in the Mini App, but Telegram alerts are not sent to you. Turning it on enables Telegram delivery only.",
  minimumScore: "Minimum final Radar score required for a Telegram alert. The Mini App discovery list is independent of this number and shows eligible candidates scoring 60 or higher. The primary score uses only prioritised factors; other intelligence is supplementary. This setting cannot be 0.",
  minMarketCap: "Minimum allowed market cap. Lower it for gem hunting. 0 disables this user-level minimum. On DEX, FDV may be used when a verified market cap is unavailable; the engine still keeps a very low technical quality floor.",
  maxMarketCap: "Maximum allowed market cap. Use a cap such as $100M to focus on gems. 0 means no maximum limit.",
  minTurnover24h: "24h volume divided by market cap. Example: $2M volume on a $10M cap = 20%. 0 disables this mandatory filter, while the metric may still contribute to the score.",
  minTurnover72h: "Approximate 72h volume-to-market-cap ratio for sustained activity. 0 disables the mandatory filter; available data can still contribute to scoring.",
  minAcceleration: "Minimum short-term volume acceleration versus its recent baseline. 2x means recent volume is twice the baseline. 0 disables the mandatory filter.",
  minPriceChange: "Minimum 24h price change required for alerts. 0 disables this mandatory filter; price change can still affect the score.",
  minTrades: "Minimum 24h trade count. CEX feeds expose trades, not public unique-user identities; DEX activity is cross-checked with unique buyers. 0 disables the trade-count filter.",
  minUniqueBuyers: "Minimum unique DEX buyers in 24h, sourced from GeckoTerminal. It helps distinguish broad participation from repeated activity by a few wallets. 0 disables the requirement. CEX unique users are not public.",
  minBuyPressure: "Minimum taker buy pressure versus sells. Higher values indicate stronger active buying. 0 disables the mandatory filter.",
  minWhaleBuy: "Minimum large/whale buy activity. Net large buying (large buys minus large sells) matters in scoring. 0 disables the mandatory filter.",
  minBidWall: "Minimum bid-wall advantage versus asks in the order book. 0 disables the mandatory filter.",
  minCex: "Minimum number of Binance, Bybit and OKX confirmations. For early DEX gems this is usually best left at 0. 0 means CEX confirmation is not required.",
  minChannels: "Minimum monitored-channel confirmations for the same coin. This is auxiliary confirmation only. 0 means channel confirmation is not required.",
  minOi: "Minimum Open Interest growth in derivatives. Rising OI with price/volume can indicate new positioning. 0 disables the mandatory filter.",
  minShortLiq: "Minimum USD value of recent short liquidations. 0 disables the mandatory filter.",
  minSqueezeDepth: "Minimum short-squeeze depth: how many previous candle highs the current candle has swept. Radar checks 15m, 1h, 4h and 1D and stores the strongest depth. 0 disables the mandatory filter.",
  maxFunding: "Maximum absolute funding rate used to exclude overly one-sided futures markets. 0 means no funding limit.",
  minDexTurnover: "Minimum DEX volume-to-market-cap ratio. Important for gems that begin on DEXs. 0 disables the mandatory filter.",
  minDexLiquidity: "Minimum DEX pool liquidity. Very low liquidity increases slippage and manipulation risk. 0 disables your user-level liquidity filter; the engine still ignores practically unusable pools via a low technical floor.",
  minDexBuyPressure: "Minimum DEX buy-vs-sell transaction advantage. 0 disables the mandatory filter.",
  minOnchainWhale: "Minimum value of large on-chain transfers. A large transfer is not inherently bullish or bearish; direction is also considered. 0 disables the mandatory filter.",
  minExchangeOutflow: "Minimum value leaving known exchange addresses for external wallets. It may indicate lower exchange inventory but is not a buy signal by itself. 0 disables the mandatory filter."
};

const ar: HelpMap = {
  capRanges: "ثلاثة نطاقات مستقلة: Low Cap من 10 آلاف إلى 1 مليون دولار، Mid Cap من 1 إلى 100 مليون، وHigh Cap من 100 إلى 500 مليون. Low وMid مفعّلان افتراضياً وHigh متوقف. يجب إبقاء نطاق واحد على الأقل مفعلاً.",
  sourceDex: "عند التفعيل يمكن لإشارات DEX الدخول في تنبيهاتك. عند الإيقاف تُستبعد إشارات DEX-only، مع بقاء بيانات DEX كمعلومات إضافية عند توفرها. يجب إبقاء DEX أو CEX واحداً على الأقل مفعلاً.",
  sourceCex: "عند التفعيل يمكن لإشارات Binance وBybit وOKX الدخول في تنبيهاتك. عند الإيقاف تُستبعد إشارات CEX-only. يجب إبقاء DEX أو CEX واحداً على الأقل مفعلاً.",
  minDexVolume: "الحد الأدنى لحجم تداول DEX خلال 24 ساعة. القيمة 0 تلغي هذا الشرط الإجباري، لكن الحجم قد يبقى مؤثراً في الدرجة الأساسية عند توفر البيانات.",
  notifications: "عند الإيقاف يستمر Radar في الفحص وعرض الإشارات داخل التطبيق، لكنه لا يرسل تنبيهات Telegram لك. التشغيل يفعّل إرسال التنبيهات فقط.",
  minimumScore: "الحد الأدنى لدرجة Radar النهائية لإرسال التنبيه. تجمع الدرجة الحجم والصفقات والمشترين الفريدين على DEX والضغط الشرائي والمشتقات والبيانات على السلسلة. لا يمكن أن تكون 0.",
  minMarketCap: "الحد الأدنى للقيمة السوقية. خفّضه للبحث عن الجواهر. القيمة 0 تلغي هذا الشرط. قد يُستخدم FDV على DEX إذا لم تتوفر قيمة سوقية موثقة.",
  maxMarketCap: "الحد الأقصى للقيمة السوقية. 0 يعني بلا حد أقصى.",
  minTurnover24h: "حجم 24 ساعة ÷ القيمة السوقية. 0 يلغي الشرط الإجباري، لكن المؤشر قد يبقى ضمن حساب الدرجة.",
  minTurnover72h: "نسبة حجم 72 ساعة إلى القيمة السوقية لقياس استمرار النشاط. 0 يلغي الشرط الإجباري.",
  minAcceleration: "الحد الأدنى لتسارع الحجم القصير مقارنة بخط الأساس. 0 يلغي الشرط الإجباري.",
  minPriceChange: "الحد الأدنى لتغير السعر خلال 24 ساعة. 0 يلغي الشرط الإجباري مع بقاء أثره المحتمل في الدرجة.",
  minTrades: "الحد الأدنى لعدد الصفقات خلال 24 ساعة. لا تنشر CEX عدد المستخدمين الفريدين؛ على DEX تتم المقارنة مع المشترين الفريدين. 0 يلغي الشرط.",
  minUniqueBuyers: "الحد الأدنى للمشترين الفريدين على DEX خلال 24 ساعة من GeckoTerminal. يساعد على كشف المشاركة الواسعة بدل التكرار من محافظ قليلة. 0 يلغي الشرط.",
  minBuyPressure: "الحد الأدنى لضغط شراء Taker مقابل البيع. 0 يلغي الشرط الإجباري.",
  minWhaleBuy: "الحد الأدنى لنشاط الشراء الكبير/الحيتان. 0 يلغي الشرط الإجباري.",
  minBidWall: "الحد الأدنى لتفوق جدار الشراء على أوامر البيع في دفتر الأوامر. 0 يلغي الشرط.",
  minCex: "الحد الأدنى لتأكيدات Binance وBybit وOKX. للجواهر المبكرة على DEX يفضل غالباً 0. 0 يعني أن CEX غير مطلوب.",
  minChannels: "الحد الأدنى لتأكيدات القنوات المراقبة. هو تأكيد مساعد فقط. 0 يعني أنه غير مطلوب.",
  minOi: "الحد الأدنى لنمو Open Interest. 0 يلغي الشرط الإجباري.",
  minShortLiq: "الحد الأدنى لقيمة تصفيات الشورت بالدولار. 0 يلغي الشرط.",
  minSqueezeDepth: "عمق Short Squeeze بعدد قمم الشموع السابقة التي تجاوزتها الشمعة الحالية. يتم فحص 15m و1h و4h و1D. 0 يلغي الشرط.",
  maxFunding: "الحد الأقصى للقيمة المطلقة لـ Funding Rate. 0 يعني بلا حد Funding.",
  minDexTurnover: "الحد الأدنى لحجم DEX نسبةً إلى القيمة السوقية. 0 يلغي الشرط.",
  minDexLiquidity: "الحد الأدنى لسيولة مجمع DEX. 0 يلغي شرط السيولة.",
  minDexBuyPressure: "الحد الأدنى لتفوق عمليات الشراء على البيع في DEX. 0 يلغي الشرط.",
  minOnchainWhale: "الحد الأدنى لقيمة التحويلات الكبيرة على السلسلة. التحويل الكبير وحده ليس إشارة صعود أو هبوط. 0 يلغي الشرط.",
  minExchangeOutflow: "الحد الأدنى لخروج الأصول من عناوين البورصات المعروفة إلى محافظ خارجية. 0 يلغي الشرط."
};

const es: HelpMap = {
  capRanges: "Tres rangos independientes: Low Cap $10K-$1M, Mid Cap $1M-$100M y High Cap $100M-$500M. Low y Mid vienen activados; High desactivado. Debe quedar al menos un rango activo.",
  sourceDex: "Si está activo, las señales con datos DEX pueden entrar en tus alertas. Si está apagado, se excluyen las señales DEX-only, aunque los datos DEX pueden seguir mostrándose como evidencia adicional. Debe quedar activo DEX o CEX.",
  sourceCex: "Si está activo, las señales de Binance, Bybit y OKX pueden entrar en tus alertas. Si está apagado, se excluyen las señales CEX-only. Debe quedar activo DEX o CEX.",
  minDexVolume: "Volumen mínimo DEX de 24h. 0 desactiva este filtro obligatorio; si hay datos, el volumen DEX puede seguir aportando al score principal.",
  notifications: "Si está desactivado, Radar sigue escaneando y mostrando señales en la Mini App, pero no te envía alertas por Telegram. Activarlo habilita solo la entrega por Telegram.",
  minimumScore: "Puntuación final mínima de Radar para enviar una alerta. Combina volumen, operaciones, compradores únicos DEX, presión compradora, derivados, DEX y on-chain. No puede ser 0.",
  minMarketCap: "Capitalización mínima permitida. Bájala para buscar gems. 0 desactiva este mínimo. En DEX puede usarse FDV si no hay market cap verificado.",
  maxMarketCap: "Capitalización máxima permitida. 0 significa sin límite máximo.",
  minTurnover24h: "Volumen 24h dividido por market cap. 0 desactiva el filtro obligatorio, aunque la métrica puede seguir aportando al score.",
  minTurnover72h: "Relación aproximada volumen 72h/market cap para medir actividad sostenida. 0 desactiva el filtro obligatorio.",
  minAcceleration: "Aceleración mínima del volumen reciente frente a su línea base. 0 desactiva el filtro obligatorio.",
  minPriceChange: "Cambio mínimo de precio en 24h. 0 desactiva el filtro obligatorio; el cambio puede seguir afectando el score.",
  minTrades: "Número mínimo de operaciones en 24h. Los CEX no publican usuarios únicos; en DEX se contrasta con compradores únicos. 0 desactiva este filtro.",
  minUniqueBuyers: "Compradores únicos mínimos en DEX durante 24h, obtenidos de GeckoTerminal. Ayuda a distinguir participación amplia de actividad repetida por pocas wallets. 0 desactiva el requisito.",
  minBuyPressure: "Presión mínima de compras taker frente a ventas. 0 desactiva el filtro obligatorio.",
  minWhaleBuy: "Actividad mínima de compras grandes/whales. 0 desactiva el filtro obligatorio.",
  minBidWall: "Ventaja mínima del muro de bids frente a asks. 0 desactiva el filtro.",
  minCex: "Número mínimo de confirmaciones entre Binance, Bybit y OKX. Para gems DEX tempranas suele convenir 0. 0 significa que CEX no es obligatorio.",
  minChannels: "Confirmaciones mínimas de canales monitorizados. Es solo una capa auxiliar. 0 significa que no es obligatorio.",
  minOi: "Crecimiento mínimo de Open Interest. 0 desactiva el filtro obligatorio.",
  minShortLiq: "Valor USD mínimo de liquidaciones short recientes. 0 desactiva el filtro.",
  minSqueezeDepth: "Profundidad mínima del short squeeze: cuántos máximos de velas previas supera la vela actual. Se revisan 15m, 1h, 4h y 1D. 0 desactiva el filtro.",
  maxFunding: "Funding Rate absoluto máximo. 0 significa sin límite de funding.",
  minDexTurnover: "Volumen DEX mínimo respecto al market cap. 0 desactiva el filtro.",
  minDexLiquidity: "Liquidez mínima del pool DEX. 0 desactiva el filtro de liquidez.",
  minDexBuyPressure: "Ventaja mínima de compras frente a ventas en DEX. 0 desactiva el filtro.",
  minOnchainWhale: "Valor mínimo de transferencias grandes on-chain. Una transferencia grande no es alcista o bajista por sí sola. 0 desactiva el filtro.",
  minExchangeOutflow: "Salida mínima desde direcciones conocidas de exchanges hacia wallets externas. 0 desactiva el filtro."
};

const zh: HelpMap = {
  capRanges: "三个独立范围：Low Cap $10K-$1M、Mid Cap $1M-$100M、High Cap $100M-$500M。默认开启 Low 和 Mid，关闭 High。至少保留一个范围开启。",
  sourceDex: "开启后，带有 DEX 数据的信号可进入你的提醒。关闭后，DEX-only 信号会被排除，但 DEX 数据仍可能作为补充信息显示。DEX/CEX 至少开启一个。",
  sourceCex: "开启后，Binance、Bybit、OKX 等 CEX 信号可进入你的提醒。关闭后，CEX-only 信号会被排除。DEX/CEX 至少开启一个。",
  minDexVolume: "24 小时最低 DEX 成交量。0 表示关闭该强制过滤；若有数据，DEX 成交量仍可参与主评分。",
  notifications: "关闭后 Radar 仍会扫描并在小程序中记录信号，但不会向你发送 Telegram 提醒。开启后只会启用 Telegram 提醒发送。",
  minimumScore: "发送提醒所需的最低 Radar 综合分。评分结合成交量、交易次数、DEX 独立买家、买压、衍生品、DEX 与链上数据。此项不能设为 0。",
  minMarketCap: "最低市值。寻找早期 Gem 时可调低。0 表示不启用该最低市值条件；DEX 无验证市值时可能使用 FDV。",
  maxMarketCap: "最高市值。0 表示不设上限。",
  minTurnover24h: "24 小时成交量 ÷ 市值。0 表示不作为强制过滤条件，但该指标仍可参与评分。",
  minTurnover72h: "72 小时成交量/市值，用于观察持续资金活跃度。0 表示关闭强制过滤。",
  minAcceleration: "近期成交量相对基线的最低加速度。0 表示关闭强制过滤。",
  minPriceChange: "24 小时最低价格变化。0 表示关闭强制过滤，但价格变化仍可影响评分。",
  minTrades: "24 小时最低交易次数。CEX 不公开独立用户数量；DEX 会结合独立买家数据。0 表示关闭该过滤。",
  minUniqueBuyers: "24 小时 DEX 最低独立买家数量，数据来自 GeckoTerminal，用于区分广泛参与与少数钱包重复交易。0 表示不强制要求。",
  minBuyPressure: "Taker 买盘相对卖盘的最低优势。0 表示关闭强制过滤。",
  minWhaleBuy: "最低大额/鲸鱼买入活动。0 表示关闭强制过滤。",
  minBidWall: "订单簿中买墙相对卖墙的最低优势。0 表示关闭过滤。",
  minCex: "Binance、Bybit、OKX 的最低确认数量。早期 DEX Gem 通常建议为 0。0 表示不要求 CEX 确认。",
  minChannels: "监控频道的最低确认数量，仅作为辅助确认。0 表示不要求频道确认。",
  minOi: "Open Interest 最低增长。0 表示关闭强制过滤。",
  minShortLiq: "近期空头爆仓的最低美元价值。0 表示关闭过滤。",
  minSqueezeDepth: "Short Squeeze 深度：当前 K 线突破了多少根之前 K 线的高点。Radar 检查 15m、1h、4h、1D。0 表示关闭该过滤。",
  maxFunding: "Funding Rate 绝对值上限。0 表示不限制 Funding。",
  minDexTurnover: "DEX 成交量相对市值的最低比例。0 表示关闭过滤。",
  minDexLiquidity: "DEX 池最低流动性。0 表示关闭最低流动性过滤。",
  minDexBuyPressure: "DEX 买入次数相对卖出的最低优势。0 表示关闭过滤。",
  minOnchainWhale: "最低链上大额转账价值。大额转账本身并不代表上涨或下跌。0 表示关闭过滤。",
  minExchangeOutflow: "从已知交易所地址流向外部钱包的最低金额。0 表示关闭过滤。"
};

export const getRadarHelp = (language?: string | null): HelpMap => {
  const normalized = String(language ?? "EN").toUpperCase();
  if (normalized === "FA") return fa;
  if (normalized === "AR") return ar;
  if (normalized === "ES") return es;
  if (normalized === "ZH") return zh;
  return en;
};
