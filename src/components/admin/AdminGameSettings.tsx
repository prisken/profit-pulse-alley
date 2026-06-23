"use client";

import { useCallback, useEffect, useState } from "react";

import {
  DEFAULT_GAME_SETTINGS,
  MARKET_EVENTS,
  WEEKLY_THEMES,
  type GameSettings,
  type MarketEvent,
  type WeeklyTheme,
} from "@/lib/game-settings";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export default function AdminGameSettings() {
  const [theme, setTheme] = useState<WeeklyTheme>(DEFAULT_GAME_SETTINGS.theme);
  const [event, setEvent] = useState<MarketEvent>(DEFAULT_GAME_SETTINGS.event);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/game-settings");
      if (!res.ok) {
        throw new Error("Failed to load settings");
      }
      const data = (await res.json()) as GameSettings;
      setTheme(data.theme ?? DEFAULT_GAME_SETTINGS.theme);
      setEvent(data.event ?? DEFAULT_GAME_SETTINGS.event);
    } catch {
      setLoadError("Could not load game settings. Showing defaults.");
      setTheme(DEFAULT_GAME_SETTINGS.theme);
      setEvent(DEFAULT_GAME_SETTINGS.event);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSettings();
  }, [fetchSettings]);

  async function handleSave() {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      const res = await fetch("/api/game-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme, event }),
      });
      if (!res.ok) {
        throw new Error("Save failed");
      }
      const data = (await res.json()) as GameSettings;
      setTheme(data.theme);
      setEvent(data.event);
      setSaveMessage("Settings saved.");
      await fetchSettings();
    } catch {
      setSaveMessage("Save failed. Check KV configuration and try again.");
    } finally {
      setIsSaving(false);
      window.setTimeout(() => setSaveMessage(null), 4000);
    }
  }

  return (
    <section aria-labelledby="vc-game-settings-heading">
      <h2
        id="vc-game-settings-heading"
        className="text-lg font-semibold text-foreground sm:text-xl"
      >
        VC Game Settings
      </h2>
      <p className="mt-1 text-sm text-foreground/65">
        Configure the weekly theme and active market event for all VC Challenge
        players.
      </p>

      {loadError ? (
        <p className="mt-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-200">
          {loadError}
        </p>
      ) : null}

      <div className="mt-5 rounded-xl border border-foreground/10 bg-background p-5 shadow-sm sm:p-6">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-foreground/10 bg-foreground/[0.02] px-4 py-3">
            <dt className="text-xs font-medium uppercase tracking-wide text-foreground/50">
              Current theme
            </dt>
            <dd className="mt-1 text-sm font-semibold text-foreground">
              {isLoading ? "…" : theme}
            </dd>
          </div>
          <div className="rounded-lg border border-foreground/10 bg-foreground/[0.02] px-4 py-3">
            <dt className="text-xs font-medium uppercase tracking-wide text-foreground/50">
              Current market event
            </dt>
            <dd className="mt-1 text-sm font-semibold text-foreground">
              {isLoading ? "…" : event}
            </dd>
          </div>
        </dl>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-foreground/80">Theme</span>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as WeeklyTheme)}
              disabled={isLoading || isSaving}
              className={`mt-2 w-full rounded-lg border border-foreground/15 bg-background px-3 py-2.5 text-sm text-foreground outline-none disabled:opacity-60 ${focusRing}`}
            >
              {WEEKLY_THEMES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-foreground/80">
              Market event
            </span>
            <select
              value={event}
              onChange={(e) => setEvent(e.target.value as MarketEvent)}
              disabled={isLoading || isSaving}
              className={`mt-2 w-full rounded-lg border border-foreground/15 bg-background px-3 py-2.5 text-sm text-foreground outline-none disabled:opacity-60 ${focusRing}`}
            >
              {MARKET_EVENTS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>

        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={isLoading || isSaving}
          className={`mt-6 inline-flex min-h-10 items-center justify-center rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`}
        >
          {isSaving ? "Saving…" : "Save Settings"}
        </button>

        {saveMessage ? (
          <p
            className={`mt-3 text-sm font-medium ${
              saveMessage.startsWith("Settings saved")
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-red-600 dark:text-red-400"
            }`}
            role="status"
          >
            {saveMessage}
          </p>
        ) : null}

        {isLoading ? (
          <p className="mt-3 text-xs text-foreground/45">Loading settings…</p>
        ) : null}
      </div>
    </section>
  );
}
