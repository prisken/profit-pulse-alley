/** Booking flow user-facing strings (Traditional Chinese). */

import type { Messages } from "@/lib/i18n/messages/en";
import { bookEnMessages } from "@/lib/i18n/messages/book-messages";

export const bookZhHantMessages: Pick<Messages, keyof typeof bookEnMessages> = {
  "book.flow.stepOf": "第 {n} 步，共 {total} 步",
  "book.flow.back": "返回",

  "book.flow.contact.title": "開始預約",
  "book.flow.contact.subtitle":
    "告訴我們你是誰——我們會透過電郵和 WhatsApp 確認你的時段。",
  "book.flow.contact.name": "你的姓名",
  "book.flow.contact.namePlaceholder": "例如：黃小姐",
  "book.flow.contact.email": "電郵",
  "book.flow.contact.emailPlaceholder": "you@example.com",
  "book.flow.contact.whatsapp": "WhatsApp 號碼",
  "book.flow.contact.whatsappPlaceholder": "+852 9123 4567",
  "book.flow.contact.whatsappHint": "我們會把確認訊息和會議連結發送到這裡。",
  "book.flow.contact.continue": "繼續",

  "book.flow.week.title": "哪一週比較方便？",
  "book.flow.week.subtitle": "先選週次，接著為你顯示具體時間。",
  "book.flow.week.option": "{monday} 當週",

  "book.flow.day.title": "你偏好平日還是週末？",
  "book.flow.day.subtitle": "兩者皆可——這只是幫你縮窄選項。",
  "book.flow.day.weekday.label": "平日",
  "book.flow.day.weekday.description": "週一至週五",
  "book.flow.day.weekend.label": "週末",
  "book.flow.day.weekend.description": "週六至週日",

  "book.flow.time.title": "辦公時間還是下班後？",
  "book.flow.time.subtitle": "兩個時段都有——選最適合你的。",
  "book.flow.time.office.label": "辦公時間",
  "book.flow.time.office.description": "10:00 – 18:00",
  "book.flow.time.office.descriptionWeekend": "10:00 – 13:00",
  "book.flow.time.afterOffice.label": "下班後",
  "book.flow.time.afterOffice.description": "18:30 – 21:00",

  "book.flow.slots.title": "選擇時間",
  "book.flow.slots.subtitle": "為你找到 3 個空檔——每天一個。選一個最適合你的。",
  "book.flow.slots.loading": "正在查看時間表……",
  "book.flow.slots.refresh": "看看其他選項",
  "book.flow.slots.firstOptions": "顯示最初的選項",
  "book.flow.slots.noMore": "這些選擇的開放時段已全部顯示——試試其他偏好。",
  "book.flow.slots.hktNote": "所有時間均為香港時間",

  "book.flow.confirm.title": "差不多完成了",
  "book.flow.confirm.subtitle": "最後確認一下——資料都正確嗎？",
  "book.flow.confirm.slot": "分析時段",
  "book.flow.confirm.name": "姓名",
  "book.flow.confirm.email": "電郵",
  "book.flow.confirm.whatsapp": "WhatsApp",
  "book.flow.confirm.button": "確認預約",
  "book.flow.confirm.busy": "預約中……",

  "book.flow.success.title": "預約成功 🎉",
  "book.flow.success.body":
    "我們已把確認訊息發送到你的電郵和 WhatsApp。真人會在分析前傳訊息給你，附上會議連結。",
  "book.flow.success.slot": "你的時段",
  "book.flow.success.another": "預約其他時間",

  "book.flow.errors.invalidContact": "請檢查你的姓名、電郵和 WhatsApp 號碼。",
  "book.flow.errors.staleWeek": "該週已無法預約——正在更新選項……",
  "book.flow.errors.slotTaken": "該時段剛剛被選走了——正在顯示最新選項……",
  "book.flow.errors.noSlots": "這些選擇沒有剩餘時段——試試其他偏好。",
  "book.flow.errors.generic": "出了點問題，請再試一次。",
};
