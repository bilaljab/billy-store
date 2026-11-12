/** Single source for the store's contact channels. */
export const WHATSAPP_NUMBER = '966508949041';
export const WHATSAPP_DISPLAY = '+966 50 894 9041';
export const INSTAGRAM_HANDLE = 'Billy_Store3';
export const TELEGRAM_HANDLE = 'BillyStore1';

export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;
/** ig.me/m opens a DM thread directly (Meta's official deep link) */
export const INSTAGRAM_URL = `https://ig.me/m/${INSTAGRAM_HANDLE}`;
export const TELEGRAM_URL = `https://t.me/${TELEGRAM_HANDLE}`;

export const whatsappLink = (text?: string) =>
  text ? `${WHATSAPP_URL}?text=${encodeURIComponent(text)}` : WHATSAPP_URL;

export const GENERAL_INQUIRY = 'مرحباً، أريد الاستفسار عن المنتجات';
