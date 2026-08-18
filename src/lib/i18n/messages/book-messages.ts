/** Booking flow user-facing strings (English). */

export const bookEnMessages = {
  "book.flow.stepOf": "Step {n} of {total}",
  "book.flow.back": "Back",

  "book.flow.contact.title": "Let's get you booked",
  "book.flow.contact.subtitle":
    "Tell us who you are — we'll confirm your session by email and WhatsApp.",
  "book.flow.contact.name": "Your name",
  "book.flow.contact.namePlaceholder": "e.g. Jamie Wong",
  "book.flow.contact.email": "Email",
  "book.flow.contact.emailPlaceholder": "you@example.com",
  "book.flow.contact.whatsapp": "WhatsApp number",
  "book.flow.contact.whatsappPlaceholder": "+852 9123 4567",
  "book.flow.contact.whatsappHint":
    "We'll send your confirmation and the meeting link here.",
  "book.flow.contact.continue": "Continue",

  "book.flow.week.title": "Which week works better for you?",
  "book.flow.week.subtitle": "Pick the week — we'll show you exact times next.",
  "book.flow.week.option": "Week of {monday}",

  "book.flow.day.title": "Do you prefer weekdays or the weekend?",
  "book.flow.day.subtitle": "Either works — this just narrows your options.",
  "book.flow.day.weekday.label": "Weekdays",
  "book.flow.day.weekday.description": "Mon – Fri",
  "book.flow.day.weekend.label": "Weekend",
  "book.flow.day.weekend.description": "Sat – Sun",

  "book.flow.time.title": "Office hours or after office hours?",
  "book.flow.time.subtitle": "Both are available — pick what fits your day.",
  "book.flow.time.office.label": "Office hours",
  "book.flow.time.office.description": "10:00 – 18:00",
  "book.flow.time.afterOffice.label": "After office hours",
  "book.flow.time.afterOffice.description": "18:30 – 21:00",

  "book.flow.slots.title": "Pick your time",
  "book.flow.slots.subtitle":
    "Here are 3 open slots we found — one per day. Choose what suits you.",
  "book.flow.slots.loading": "Checking availability…",
  "book.flow.slots.refresh": "Show me other options",
  "book.flow.slots.hktNote": "All times are Hong Kong time",

  "book.flow.confirm.title": "Almost there",
  "book.flow.confirm.subtitle": "One last check — everything look right?",
  "book.flow.confirm.slot": "Session",
  "book.flow.confirm.name": "Name",
  "book.flow.confirm.email": "Email",
  "book.flow.confirm.whatsapp": "WhatsApp",
  "book.flow.confirm.button": "Confirm booking",
  "book.flow.confirm.busy": "Booking…",

  "book.flow.success.title": "You're booked 🎉",
  "book.flow.success.body":
    "We've sent a confirmation to your email and WhatsApp. A real person will message you before the session with the meeting link.",
  "book.flow.success.slot": "Your session",
  "book.flow.success.another": "Book another time",

  "book.flow.errors.invalidContact": "Please check your name, email and WhatsApp number.",
  "book.flow.errors.staleWeek": "That week is no longer bookable — refreshing options…",
  "book.flow.errors.slotTaken": "That slot was just taken. Showing fresh options…",
  "book.flow.errors.noSlots": "No free slots left for those choices — try different preferences.",
  "book.flow.errors.generic": "Something went wrong. Please try again.",
} as const;
