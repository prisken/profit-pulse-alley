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

type AuthState = "checking" | "locked" | "authenticated" | "denied";

const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

export default function AdminPage() {
  const [authState, setAuthState] = useState<AuthState>(
    adminPassword ? "locked" : "authenticated",
  );
  const [passwordInput, setPasswordInput] = useState("");
  const [theme, setTheme] = useState<WeeklyTheme>(DEFAULT_GAME_SETTINGS.theme);
  const [event, setEvent] = useState<MarketEvent>(DEFAULT_GAME_SETTINGS.event);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

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
      setLoadError("Could not load settings. Showing defaults.");
      setTheme(DEFAULT_GAME_SETTINGS.theme);
      setEvent(DEFAULT_GAME_SETTINGS.event);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authState === "authenticated") {
      void fetchSettings();
    }
  }, [authState, fetchSettings]);

  function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!adminPassword) {
      setAuthState("authenticated");
      return;
    }
    if (passwordInput === adminPassword) {
      setAuthState("authenticated");
      setPasswordInput("");
    } else {
      setAuthState("denied");
    }
  }

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
      setSaveMessage("Settings Saved!");
      window.setTimeout(() => setSaveMessage(null), 3000);
    } catch {
      setSaveMessage("Save failed. Check KV configuration and try again.");
      window.setTimeout(() => setSaveMessage(null), 4000);
    } finally {
      setIsSaving(false);
    }
  }

  if (authState === "locked" || authState === "denied") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-900 px-4 text-white">
        <div className="w-full max-w-sm rounded-2xl border border-gray-700 bg-gray-800 p-6 shadow-xl">
          <h1 className="text-center text-xl font-semibold">
            VC Challenge — Admin
          </h1>
          <p className="mt-2 text-center text-sm text-gray-400">
            Enter the admin password to continue.
          </p>
          <form onSubmit={handlePasswordSubmit} className="mt-6 space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-gray-300">Password</span>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  if (authState === "denied") setAuthState("locked");
                }}
                className="mt-1 w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-white outline-none ring-amber-400/50 focus:border-amber-400 focus:ring-2"
                autoComplete="current-password"
              />
            </label>
            {authState === "denied" ? (
              <p className="text-center text-sm font-medium text-red-400" role="alert">
                Access Denied
              </p>
            ) : null}
            <button
              type="submit"
              className="w-full rounded-full bg-amber-500 px-4 py-2.5 text-sm font-semibold text-gray-900 transition-colors hover:bg-amber-400"
            >
              Unlock
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-900 px-4 py-10 text-white sm:px-6">
      <div className="mx-auto w-full max-w-lg">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          VC Challenge - Game Master Control
        </h1>
        <p className="mt-2 text-sm text-gray-400">
          Configure the weekly theme and active market event for all players.
        </p>

        {loadError ? (
          <p className="mt-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
            {loadError}
          </p>
        ) : null}

        <div className="mt-8 space-y-6 rounded-2xl border border-gray-700 bg-gray-800 p-6 shadow-lg">
          <label className="block">
            <span className="text-sm font-medium text-gray-300">
              Current Weekly Theme
            </span>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as WeeklyTheme)}
              disabled={isLoading || isSaving}
              className="mt-2 w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2.5 text-white outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30 disabled:opacity-60"
            >
              {WEEKLY_THEMES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-300">
              Active Market Event
            </span>
            <select
              value={event}
              onChange={(e) => setEvent(e.target.value as MarketEvent)}
              disabled={isLoading || isSaving}
              className="mt-2 w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2.5 text-white outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30 disabled:opacity-60"
            >
              {MARKET_EVENTS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={isLoading || isSaving}
            className="w-full rounded-full bg-amber-500 px-4 py-3 text-sm font-semibold text-gray-900 transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Saving…" : "Save Changes"}
          </button>

          {saveMessage ? (
            <p
              className={`text-center text-sm font-medium ${
                saveMessage.startsWith("Settings Saved")
                  ? "text-emerald-400"
                  : "text-red-400"
              }`}
              role="status"
            >
              {saveMessage}
            </p>
          ) : null}

          {isLoading ? (
            <p className="text-center text-xs text-gray-500">Loading settings…</p>
          ) : null}
        </div>
      </div>
    </main>
  );
}
