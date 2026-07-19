/** Matching Pulse user-facing strings (request form + related labels). */

export const matchingPulseEnMessages = {
  "meta.matchingPulse.request.title":
    "Post a Matching Pulse request | Profit Pulse Ally",
  "meta.matchingPulse.request.description":
    "Tell us what you need, what you can offer, or who you would like to meet. PPA will review your Matching Pulse request before making any introduction.",

  "matchingPulse.request.breadcrumb": "Request",
  "matchingPulse.request.title": "Post a Matching Pulse request",
  "matchingPulse.request.intro":
    "Tell us what you need, what you can offer, or who you would like to meet. PPA will review your request before making any introduction.",
  "matchingPulse.request.workshopNote":
    "Joining from a PPA workshop? Submit your request here and PPA will review it after the session.",

  "matchingPulse.form.postingAs": "Posting as",
  "matchingPulse.form.title": "Title",
  "matchingPulse.form.titlePlaceholder":
    "e.g. Looking for a marketing collaborator",
  "matchingPulse.form.requestType": "Request type",
  "matchingPulse.form.selectType": "Select type",
  "matchingPulse.form.category": "Category",
  "matchingPulse.form.selectCategory": "Select category",
  "matchingPulse.form.description": "Description",
  "matchingPulse.form.descriptionPlaceholder":
    "Share context, goals, and what a good fit looks like.",
  "matchingPulse.form.descriptionMaxHint": "Max {max} characters",
  "matchingPulse.form.company": "Company",
  "matchingPulse.form.role": "Role",
  "matchingPulse.form.contactPhone": "Contact phone",
  "matchingPulse.form.contactMethod": "Preferred contact method",
  "matchingPulse.form.contactMethodPlaceholder":
    "e.g. WhatsApp, email, LinkedIn",
  "matchingPulse.form.urgency": "Urgency",
  "matchingPulse.form.noPreference": "No preference",
  "matchingPulse.form.idealMatch": "Ideal match",
  "matchingPulse.form.idealMatchPlaceholder":
    "Who would be most helpful to connect with?",
  "matchingPulse.form.optional": "(optional)",
  "matchingPulse.form.consents": "Consents",
  "matchingPulse.form.consentContact":
    "I agree that PPA may contact me about this request.",
  "matchingPulse.form.consentShare":
    "I am open to PPA sharing relevant request details with a potential match after review.",
  "matchingPulse.form.submit": "Submit request",
  "matchingPulse.form.submitting": "Submitting…",
  "matchingPulse.form.requiredFields": "Required fields",

  "matchingPulse.requestType.NEED_HELP": "I need help",
  "matchingPulse.requestType.OFFER_HELP": "I can offer help",
  "matchingPulse.requestType.PARTNERSHIP": "I want to partner",

  "matchingPulse.category.CAREER": "Career",
  "matchingPulse.category.BUSINESS": "Business",
  "matchingPulse.category.CAPITAL": "Capital",
  "matchingPulse.category.NETWORKING": "Networking",
  "matchingPulse.category.OTHER": "Other",

  "matchingPulse.urgency.LOW": "Low",
  "matchingPulse.urgency.MEDIUM": "Medium",
  "matchingPulse.urgency.HIGH": "High",

  "matchingPulse.error.titleRequired": "Title is required.",
  "matchingPulse.error.titleMax":
    "Title must be {max} characters or fewer.",
  "matchingPulse.error.requestTypeRequired": "Request type is required.",
  "matchingPulse.error.requestTypeInvalid": "Select a valid request type.",
  "matchingPulse.error.categoryRequired": "Category is required.",
  "matchingPulse.error.categoryInvalid": "Select a valid category.",
  "matchingPulse.error.descriptionRequired": "Description is required.",
  "matchingPulse.error.descriptionMax":
    "Description must be {max} characters or fewer.",
  "matchingPulse.error.maxLength": "Must be {max} characters or fewer.",
  "matchingPulse.error.urgencyInvalid": "Select a valid urgency.",
  "matchingPulse.error.consentRequired":
    "You must agree to be contacted about this request.",
  "matchingPulse.error.formFix":
    "Please fix the highlighted fields and try again.",
  "matchingPulse.error.submitFailed":
    "Could not submit your request. Please try again.",
} as const;

export type MatchingPulseMessageKey = keyof typeof matchingPulseEnMessages;

export const matchingPulseZhHantMessages: Record<
  MatchingPulseMessageKey,
  string
> = {
  "meta.matchingPulse.request.title":
    "提交 Matching Pulse 請求 | Profit Pulse Ally",
  "meta.matchingPulse.request.description":
    "告訴我們你需要什麼、可以提供什麼，或希望認識誰。PPA 會先審核你的 Matching Pulse 請求，才會安排介紹。",

  "matchingPulse.request.breadcrumb": "提交請求",
  "matchingPulse.request.title": "提交 Matching Pulse 請求",
  "matchingPulse.request.intro":
    "告訴我們你需要什麼、可以提供什麼，或希望認識誰。PPA 會先審核你的請求，才會安排介紹。",
  "matchingPulse.request.workshopNote":
    "剛參加完 PPA 工作坊？在這裡提交請求，PPA 會在會後審核。",

  "matchingPulse.form.postingAs": "提交者",
  "matchingPulse.form.title": "標題",
  "matchingPulse.form.titlePlaceholder": "例如：尋找市場推廣合作夥伴",
  "matchingPulse.form.requestType": "請求類型",
  "matchingPulse.form.selectType": "選擇類型",
  "matchingPulse.form.category": "類別",
  "matchingPulse.form.selectCategory": "選擇類別",
  "matchingPulse.form.description": "說明",
  "matchingPulse.form.descriptionPlaceholder":
    "分享背景、目標，以及理想的合作對象是怎樣的。",
  "matchingPulse.form.descriptionMaxHint": "最多 {max} 字",
  "matchingPulse.form.company": "公司",
  "matchingPulse.form.role": "職位",
  "matchingPulse.form.contactPhone": "聯絡電話",
  "matchingPulse.form.contactMethod": "偏好聯絡方式",
  "matchingPulse.form.contactMethodPlaceholder":
    "例如：WhatsApp、電郵、LinkedIn",
  "matchingPulse.form.urgency": "緊急程度",
  "matchingPulse.form.noPreference": "無偏好",
  "matchingPulse.form.idealMatch": "理想對象",
  "matchingPulse.form.idealMatchPlaceholder": "最希望認識怎樣的人？",
  "matchingPulse.form.optional": "（選填）",
  "matchingPulse.form.consents": "同意事項",
  "matchingPulse.form.consentContact":
    "我同意 PPA 就本請求與我聯絡。",
  "matchingPulse.form.consentShare":
    "我願意在審核後，讓 PPA 向潛在配對對象分享相關請求資料。",
  "matchingPulse.form.submit": "提交請求",
  "matchingPulse.form.submitting": "提交中…",
  "matchingPulse.form.requiredFields": "必填欄位",

  "matchingPulse.requestType.NEED_HELP": "我需要協助",
  "matchingPulse.requestType.OFFER_HELP": "我可以提供協助",
  "matchingPulse.requestType.PARTNERSHIP": "我想尋找合作夥伴",

  "matchingPulse.category.CAREER": "事業",
  "matchingPulse.category.BUSINESS": "商業",
  "matchingPulse.category.CAPITAL": "資金",
  "matchingPulse.category.NETWORKING": "人脈",
  "matchingPulse.category.OTHER": "其他",

  "matchingPulse.urgency.LOW": "低",
  "matchingPulse.urgency.MEDIUM": "中",
  "matchingPulse.urgency.HIGH": "高",

  "matchingPulse.error.titleRequired": "請填寫標題。",
  "matchingPulse.error.titleMax": "標題不可超過 {max} 字。",
  "matchingPulse.error.requestTypeRequired": "請選擇請求類型。",
  "matchingPulse.error.requestTypeInvalid": "請選擇有效的請求類型。",
  "matchingPulse.error.categoryRequired": "請選擇類別。",
  "matchingPulse.error.categoryInvalid": "請選擇有效的類別。",
  "matchingPulse.error.descriptionRequired": "請填寫說明。",
  "matchingPulse.error.descriptionMax": "說明不可超過 {max} 字。",
  "matchingPulse.error.maxLength": "不可超過 {max} 字。",
  "matchingPulse.error.urgencyInvalid": "請選擇有效的緊急程度。",
  "matchingPulse.error.consentRequired": "你必須同意就本請求接受聯絡。",
  "matchingPulse.error.formFix": "請修正標示的欄位後再試。",
  "matchingPulse.error.submitFailed": "無法提交請求，請再試一次。",
};
