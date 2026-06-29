import type { SiteLocale } from "@/lib/i18n/locales";
import { translate, type MessageKey } from "@/lib/i18n/messages";

const AUTH_MESSAGE_KEYS: Record<string, MessageKey> = {
  "Please enter your email address.": "auth.error.emailRequired",
  "Please enter your password.": "auth.error.passwordRequired",
  "Please enter your email address for the magic link.":
    "auth.error.magicLinkEmailRequired",
  "Invalid email or password.": "auth.error.invalidCredentials",
  "Something went wrong. Please try again.": "auth.error.generic",
  "Could not start Google sign-in. Please try again.": "auth.error.googleStart",
  "Could not send sign-in link. Please check your email and try again.":
    "auth.error.magicLinkSend",
  "Name is required.": "auth.error.nameRequired",
  "Email is required.": "auth.error.emailFieldRequired",
  "Password is required.": "auth.error.passwordFieldRequired",
  "Password must be at least 8 characters.": "auth.error.passwordMinLength",
  "An account with this email already exists.": "auth.error.emailExists",
  "Could not create account. Please try again later.": "auth.error.signUpFailed",
  "Account created successfully. You can sign in now.":
    "auth.success.accountCreated",
  "You must be signed in to continue.": "auth.error.signInRequired",
  "Contact number is required.": "auth.error.contactRequired",
  "Could not save your contact number. Please try again.":
    "auth.error.contactSaveFailed",
  "Role updated.": "auth.admin.users.roleUpdated",
  "User deleted.": "auth.admin.users.userDeleted",
  "User created.": "auth.admin.users.userCreated",
  "Action failed.": "auth.admin.mp.actionFailed",
  "Done.": "auth.admin.mp.done",
  "Saved.": "auth.admin.mp.saved",
  "Settings saved.": "auth.admin.game.saved",
  "Save failed. Check KV configuration and try again.":
    "auth.admin.game.saveFailed",
  "Could not load game settings. Showing defaults.":
    "auth.admin.game.loadError",
};

export function translateAuthMessage(
  locale: SiteLocale,
  message: string,
): string {
  const key = AUTH_MESSAGE_KEYS[message];
  if (key) {
    return translate(locale, key);
  }
  return message;
}
