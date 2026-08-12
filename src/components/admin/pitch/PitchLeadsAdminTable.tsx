"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Download, Search } from "lucide-react";

import { downloadCsv } from "@/lib/admin/csv-download";
import type { PitchAdminLeadRow } from "@/lib/pitch-game/admin-data";
import { buildPitchLeadsCsv } from "@/lib/pitch-game/leads-csv";
import { ANONYMOUS_PLAYER_LABEL } from "@/components/admin/workshop/WorkshopLeadsAdminTable";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900";

const bandChipClass: Record<string, string> = {
  green: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  amber: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  red: "border-red-500/40 bg-red-500/10 text-red-300",
};

const bandLabel: Record<string, string> = {
  green: "Solid",
  amber: "Workable",
  red: "Fragile",
};

function formatCreatedDate(iso: string): string {
  return new Intl.DateTimeFormat("en-HK", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Hong_Kong",
  }).format(new Date(iso));
}

const ARCHETYPE_OPTIONS = [
  { key: "growth-engine", label: "🚀 Growth Engine" },
  { key: "strained-ops", label: "🧩 Strained Ops" },
  { key: "margin-play", label: "💰 Margin Play" },
  { key: "team-ceiling", label: "👥 Team Ceiling" },
  { key: "market-timing", label: "⏱️ Market Timing" },
] as const;

type PitchLeadsAdminTableProps = Readonly<{
  leads: PitchAdminLeadRow[];
}>;

export default function PitchLeadsAdminTable({
  leads,
}: PitchLeadsAdminTableProps) {
  const [query, setQuery] = useState("");
  const [archetypeFilter, setArchetypeFilter] = useState<string>("all");
  const [bandFilter, setBandFilter] = useState<string>("all");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return leads.filter((lead) => {
      if (archetypeFilter !== "all" && lead.archetypeKey !== archetypeFilter) {
        return false;
      }
      if (bandFilter !== "all" && lead.band !== bandFilter) {
        return false;
      }
      if (!q) return true;
      return [lead.name, lead.email, lead.company, lead.concern ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [leads, query, archetypeFilter, bandFilter]);

  function toggleExpanded(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleExportCsv() {
    if (filtered.length === 0) return;
    const csv = buildPitchLeadsCsv(filtered);
    const dateStamp = new Date().toISOString().slice(0, 10);
    downloadCsv(csv, `pitch-meeting-leads-${dateStamp}.csv`);
  }

  const selectClass = `${focusRing} min-h-10 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, email, company, concern…"
              className={`${focusRing} min-h-10 w-64 rounded-lg border border-zinc-700 bg-zinc-900 pl-9 pr-3 text-sm text-zinc-100 placeholder:text-zinc-500`}
            />
          </div>
          <select
            value={archetypeFilter}
            onChange={(e) => setArchetypeFilter(e.target.value)}
            className={selectClass}
            aria-label="Filter by archetype"
          >
            <option value="all">All archetypes</option>
            {ARCHETYPE_OPTIONS.map((o) => (
              <option key={o.key} value={o.key}>
                {o.label}
              </option>
            ))}
          </select>
          <select
            value={bandFilter}
            onChange={(e) => setBandFilter(e.target.value)}
            className={selectClass}
            aria-label="Filter by verdict"
          >
            <option value="all">All verdicts</option>
            <option value="green">Solid</option>
            <option value="amber">Workable</option>
            <option value="red">Fragile</option>
          </select>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-sm text-zinc-400">
            {filtered.length} of {leads.length} lead{leads.length === 1 ? "" : "s"}
          </p>
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={filtered.length === 0}
            className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-sm font-medium text-zinc-100 transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-12 text-center sm:px-6">
          <p className="text-sm text-zinc-300 sm:text-base">
            {leads.length === 0
              ? "No Pitch Meeting leads yet — share the game and they'll land here."
              : "No leads match the current filters."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="min-w-full divide-y divide-zinc-800 text-left text-sm">
            <thead className="bg-zinc-900/80 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="w-8 px-2 py-3" aria-label="Expand" />
                <th className="px-3 py-3 font-semibold sm:px-4">Contact</th>
                <th className="px-3 py-3 font-semibold sm:px-4">Story</th>
                <th className="px-3 py-3 font-semibold sm:px-4">Metric</th>
                <th className="px-3 py-3 font-semibold sm:px-4">Verdict</th>
                <th className="px-3 py-3 font-semibold sm:px-4">Condition</th>
                <th className="px-3 py-3 font-semibold sm:px-4">Concern</th>
                <th className="px-3 py-3 font-semibold sm:px-4">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80 bg-zinc-950/40">
              {filtered.map((lead) => {
                const isOpen = expanded.has(lead.id);
                return (
                  <LeadRow
                    key={lead.id}
                    lead={lead}
                    isOpen={isOpen}
                    onToggle={() => toggleExpanded(lead.id)}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function LeadRow({
  lead,
  isOpen,
  onToggle,
}: {
  lead: PitchAdminLeadRow;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const hasName = Boolean(lead.name.trim());
  const hasEmail = Boolean(lead.email.trim());
  const hasPhone = Boolean(lead.phone.trim());
  const hasCompany = Boolean(lead.company.trim());

  return (
    <>
      <tr
        className="cursor-pointer align-top hover:bg-zinc-900/40"
        onClick={onToggle}
      >
        <td className="px-2 py-3">
          <button
            type="button"
            onClick={onToggle}
            className={`inline-flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-200 ${focusRing}`}
            aria-expanded={isOpen}
            aria-label={isOpen ? "Collapse details" : "Expand details"}
          >
            {isOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        </td>
        <td className="px-3 py-3 sm:px-4">
          {hasName ? (
            <div className="font-medium text-zinc-100">{lead.name}</div>
          ) : (
            <div className="font-medium italic text-zinc-500">
              {ANONYMOUS_PLAYER_LABEL}
            </div>
          )}
          {hasEmail ? (
            <div className="text-zinc-400">{lead.email}</div>
          ) : (
            <div className="text-zinc-600">—</div>
          )}
          {hasPhone ? (
            <div className="text-zinc-500">{lead.phone}</div>
          ) : (
            <div className="text-zinc-600">—</div>
          )}
          {hasCompany ? (
            <div className="text-xs text-zinc-500">{lead.company}</div>
          ) : (
            <div className="text-xs text-zinc-600">—</div>
          )}
        </td>
        <td className="px-3 py-3 sm:px-4">
          <div className="whitespace-nowrap text-zinc-200">
            {lead.archetypeEmoji ? `${lead.archetypeEmoji} ` : ""}
            {lead.archetypeLabel ?? "—"}
          </div>
          <div className="text-xs text-zinc-500">{lead.roundLabel ?? "—"}</div>
        </td>
        <td className="whitespace-nowrap px-3 py-3 text-zinc-300 sm:px-4">
          {lead.metricLabel ?? "—"}
        </td>
        <td className="px-3 py-3 sm:px-4">
          {lead.band ? (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${bandChipClass[lead.band]}`}
            >
              {bandLabel[lead.band]}
            </span>
          ) : (
            <span className="text-zinc-500">—</span>
          )}
          {lead.postureLabel && (
            <div className="mt-1 text-xs text-zinc-500">{lead.postureLabel}</div>
          )}
        </td>
        <td className="max-w-[16rem] px-3 py-3 text-zinc-300 sm:px-4">
          <span className="line-clamp-3">{lead.condition ?? "—"}</span>
        </td>
        <td className="max-w-[12rem] px-3 py-3 text-zinc-400 sm:px-4">
          <span className="line-clamp-2">{lead.concern ?? "—"}</span>
        </td>
        <td className="whitespace-nowrap px-3 py-3 text-zinc-500 sm:px-4">
          {formatCreatedDate(lead.createdAt)}
        </td>
      </tr>
      {isOpen && (
        <tr className="bg-zinc-900/30">
          <td colSpan={8} className="px-4 py-4 sm:px-6">
            <div className="grid gap-4 lg:grid-cols-2">
              {/* Journey */}
              <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Journey
                </h4>
                <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <Detail label="Archetype" value={lead.archetypeLabel ?? "—"} />
                  <Detail label="Metric focus" value={lead.metricLabel ?? "—"} />
                  <Detail label="Round" value={lead.roundLabel ?? "—"} />
                  <Detail label="Posture" value={lead.postureLabel ?? "—"} />
                </dl>
                {lead.inputs.length > 0 && (
                  <>
                    <h4 className="mt-4 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      Numbers entered
                    </h4>
                    <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                      {lead.inputs.map((cell) => (
                        <Detail
                          key={cell.key}
                          label={cell.label}
                          value={cell.value}
                          mono
                        />
                      ))}
                    </dl>
                  </>
                )}
              </div>

              {/* Outputs */}
              <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Readout
                </h4>
                <div className="mt-2 space-y-3 text-sm">
                  {lead.reaction && (
                    <Quote label="Elena's reaction" text={lead.reaction} />
                  )}
                  {lead.condition && (
                    <Quote label="Term-sheet condition" text={lead.condition} />
                  )}
                  {lead.automationFix && (
                    <Quote label="Automation gap" text={lead.automationFix} accent />
                  )}
                </div>
              </div>
            </div>

            {lead.rawJourney && (
              <details className="mt-4 rounded-lg border border-zinc-800 bg-zinc-950/60">
                <summary className="cursor-pointer px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 transition hover:text-zinc-300">
                  Raw journey JSON
                </summary>
                <pre className="max-h-80 overflow-auto border-t border-zinc-800 px-4 py-3 text-xs leading-relaxed text-zinc-400">
                  {JSON.stringify(lead.rawJourney, null, 2)}
                </pre>
              </details>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

function Detail({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-zinc-500">{label}</dt>
      <dd
        className={`truncate text-zinc-200 ${mono ? "font-mono tabular-nums" : ""}`}
        title={value}
      >
        {value}
      </dd>
    </div>
  );
}

function Quote({
  label,
  text,
  accent = false,
}: {
  label: string;
  text: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-md border border-zinc-800 bg-zinc-900/50 p-3">
      <p className={`text-[11px] font-semibold uppercase tracking-wide ${accent ? "text-emerald-400" : "text-zinc-500"}`}>
        {label}
      </p>
      <p className="mt-1 leading-relaxed text-zinc-300">{text}</p>
    </div>
  );
}
