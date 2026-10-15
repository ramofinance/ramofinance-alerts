import type { PreferredLanguage } from "../types/api";

export type RadarReferralCopy = {
  cardHint: string;
  title: string;
  intro: string;
  progress: string;
  linkLabel: string;
  share: string;
  copyLink: string;
  copied: string;
  copyFailed: string;
  refresh: string;
  rules: string;
  unlockedTitle: string;
  unlockedText: string;
  openRadar: string;
  loading: string;
  error: string;
  retry: string;
  shareText: string;
};

const en: RadarReferralCopy = {
  cardHint: "Invite friends to our channel to unlock Radar 🔓",
  title: "Unlock Radar",
  intro: "Invite {required} people to our channel with your personal link and Radar opens for you.",
  progress: "{joined} of {required} joined",
  linkLabel: "Your personal invite link",
  share: "Share my invite link",
  copyLink: "Copy link",
  copied: "Copied ✓",
  copyFailed: "Couldn't copy automatically. Select the link and copy it by hand.",
  refresh: "Refresh",
  rules: "Only people who join through your link and stay in the channel are counted. Once you reach {required}, access stays with you for good.",
  unlockedTitle: "Radar is unlocked 🎉",
  unlockedText: "You can use Radar now.",
  openRadar: "Open Radar",
  loading: "Loading…",
  error: "Couldn't load your invite link. Please try again in a moment.",
  retry: "Try again",
  shareText: "Join our crypto channel 👇"
};

const fa: RadarReferralCopy = {
  cardHint: "با دعوت دوستانت به کانال، رادار را باز کن 🔓",
  title: "باز کردن رادار",
  intro: "{required} نفر را با لینک اختصاصی خودت به کانال ما دعوت کن تا رادار برایت باز شود.",
  progress: "{joined} از {required} نفر عضو شدند",
  linkLabel: "لینک دعوت اختصاصی تو",
  share: "اشتراک‌گذاری لینک دعوت",
  copyLink: "کپی لینک",
  copied: "کپی شد ✓",
  copyFailed: "کپی خودکار انجام نشد. لینک را انتخاب و دستی کپی کن.",
  refresh: "بروزرسانی",
  rules: "فقط کسانی که با لینک تو عضو شوند و در کانال بمانند حساب می‌شوند. بعد از رسیدن به {required} نفر، دسترسی برای همیشه برایت می‌ماند.",
  unlockedTitle: "رادار برایت باز شد 🎉",
  unlockedText: "حالا می‌توانی از رادار استفاده کنی.",
  openRadar: "ورود به رادار",
  loading: "در حال بارگذاری…",
  error: "دریافت لینک دعوت ممکن نشد. کمی بعد دوباره تلاش کن.",
  retry: "تلاش دوباره",
  shareText: "به کانال کریپتوی ما بپیوند 👇"
};

const ar: RadarReferralCopy = {
  cardHint: "ادعُ أصدقاءك إلى قناتنا لفتح الرادار 🔓",
  title: "فتح الرادار",
  intro: "ادعُ {required} أشخاص إلى قناتنا عبر رابطك الشخصي ليُفتح لك الرادار.",
  progress: "انضم {joined} من {required}",
  linkLabel: "رابط الدعوة الخاص بك",
  share: "مشاركة رابط الدعوة",
  copyLink: "نسخ الرابط",
  copied: "تم النسخ ✓",
  copyFailed: "تعذر النسخ تلقائيًا. حدّد الرابط وانسخه يدويًا.",
  refresh: "تحديث",
  rules: "يُحتسب فقط من ينضم عبر رابطك ويبقى في القناة. عند بلوغ {required} يبقى الوصول لك دائمًا.",
  unlockedTitle: "تم فتح الرادار 🎉",
  unlockedText: "يمكنك الآن استخدام الرادار.",
  openRadar: "فتح الرادار",
  loading: "جارٍ التحميل…",
  error: "تعذر تحميل رابط الدعوة. حاول مرة أخرى بعد قليل.",
  retry: "حاول مجددًا",
  shareText: "انضم إلى قناتنا للعملات الرقمية 👇"
};

const es: RadarReferralCopy = {
  cardHint: "Invita a tus amigos a nuestro canal y desbloquea Radar 🔓",
  title: "Desbloquear Radar",
  intro: "Invita a {required} personas a nuestro canal con tu enlace personal y Radar se abre para ti.",
  progress: "{joined} de {required} se unieron",
  linkLabel: "Tu enlace de invitación personal",
  share: "Compartir mi enlace",
  copyLink: "Copiar enlace",
  copied: "Copiado ✓",
  copyFailed: "No se pudo copiar automáticamente. Selecciona el enlace y cópialo a mano.",
  refresh: "Actualizar",
  rules: "Solo cuentan quienes se unen con tu enlace y siguen en el canal. Al llegar a {required}, el acceso es tuyo para siempre.",
  unlockedTitle: "Radar desbloqueado 🎉",
  unlockedText: "Ya puedes usar Radar.",
  openRadar: "Abrir Radar",
  loading: "Cargando…",
  error: "No se pudo cargar tu enlace de invitación. Inténtalo de nuevo en un momento.",
  retry: "Reintentar",
  shareText: "Únete a nuestro canal cripto 👇"
};

const zh: RadarReferralCopy = {
  cardHint: "邀请好友加入频道，解锁雷达 🔓",
  title: "解锁雷达",
  intro: "用您的专属链接邀请 {required} 人加入我们的频道，即可解锁雷达。",
  progress: "已加入 {joined} / {required} 人",
  linkLabel: "您的专属邀请链接",
  share: "分享我的邀请链接",
  copyLink: "复制链接",
  copied: "已复制 ✓",
  copyFailed: "自动复制失败。请手动选中链接并复制。",
  refresh: "刷新",
  rules: "只有通过您的链接加入并留在频道里的人才会计数。达到 {required} 人后，权限将永久保留。",
  unlockedTitle: "雷达已解锁 🎉",
  unlockedText: "您现在可以使用雷达了。",
  openRadar: "打开雷达",
  loading: "加载中…",
  error: "无法加载您的邀请链接，请稍后再试。",
  retry: "重试",
  shareText: "加入我们的加密频道 👇"
};

export const getRadarReferralCopy = (language: PreferredLanguage | null): RadarReferralCopy => {
  if (language === "FA") return fa;
  if (language === "AR") return ar;
  if (language === "ES") return es;
  if (language === "ZH") return zh;
  return en;
};
