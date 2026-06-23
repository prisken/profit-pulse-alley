/**
 * One-off migration: import Google Form leads from scripts/leads.csv into User.
 *
 * Usage:
 *   npm run import-leads
 *
 * Expects scripts/leads.csv (Google Forms export). Loads DB credentials from
 * .env.local / .env (POSTGRES_PRISMA_URL or DATABASE_URL).
 */

import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";
import fs from "node:fs/promises";
import path from "node:path";

config({ path: path.resolve(process.cwd(), ".env.local") });
config({ path: path.resolve(process.cwd(), ".env") });

const prisma = new PrismaClient();

const CSV_PATH = path.join(__dirname, "leads.csv");

const EMAIL_HEADER_MATCHERS = [
  "email",
  "email address",
  "e-mail",
  "your email",
  "email address (required)",
];

const NAME_HEADER_MATCHERS = [
  "name",
  "full name",
  "your name",
  "姓名",
  "名字",
];

type ImportSummary = {
  totalRows: number;
  created: number;
  skippedExisting: number;
  skippedInvalid: number;
  errors: number;
};

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current);
  return values;
}

function parseCsv(content: string): Record<string, string>[] {
  const lines = content
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);

  if (lines.length < 2) {
    return [];
  }

  const headers = parseCsvLine(lines[0]!).map((header) => header.trim());

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row: Record<string, string> = {};

    headers.forEach((header, index) => {
      row[header] = (values[index] ?? "").trim();
    });

    return row;
  });
}

function normalizeHeader(header: string): string {
  return header.toLowerCase().replace(/\s+/g, " ").trim();
}

function findValueByHeaders(
  row: Record<string, string>,
  matchers: string[],
): string | null {
  for (const [header, value] of Object.entries(row)) {
    const normalizedHeader = normalizeHeader(header);
    if (matchers.some((matcher) => normalizedHeader.includes(matcher))) {
      const trimmed = value.trim();
      if (trimmed) return trimmed;
    }
  }
  return null;
}

function extractEmail(row: Record<string, string>): string | null {
  const fromHeader = findValueByHeaders(row, EMAIL_HEADER_MATCHERS);
  if (fromHeader && isValidEmail(fromHeader)) {
    return fromHeader.toLowerCase();
  }

  for (const value of Object.values(row)) {
    const candidate = value.trim().toLowerCase();
    if (isValidEmail(candidate)) {
      return candidate;
    }
  }

  return null;
}

function extractName(row: Record<string, string>): string | null {
  const fromHeader = findValueByHeaders(row, NAME_HEADER_MATCHERS);
  return fromHeader?.trim() || null;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function main() {
  let csvContent: string;

  try {
    csvContent = await fs.readFile(CSV_PATH, "utf8");
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      console.error(`Missing file: ${CSV_PATH}`);
      console.error("Place your Google Form export as scripts/leads.csv and retry.");
      process.exit(1);
    }
    throw error;
  }

  const rows = parseCsv(csvContent);
  const summary: ImportSummary = {
    totalRows: rows.length,
    created: 0,
    skippedExisting: 0,
    skippedInvalid: 0,
    errors: 0,
  };

  console.log(`Reading ${CSV_PATH}`);
  console.log(`Found ${rows.length} data row(s).\n`);

  for (const [index, row] of rows.entries()) {
    const rowNumber = index + 2; // header is row 1
    const email = extractEmail(row);

    if (!email) {
      summary.skippedInvalid += 1;
      console.warn(`Row ${rowNumber}: skipped — no valid email found.`);
      continue;
    }

    const name = extractName(row);

    try {
      const existing = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });

      if (existing) {
        summary.skippedExisting += 1;
        console.log(`Row ${rowNumber}: skipped — already exists (${email}).`);
        continue;
      }

      await prisma.user.create({
        data: {
          email,
          name,
        },
      });

      summary.created += 1;
      console.log(`Row ${rowNumber}: created ${email}${name ? ` (${name})` : ""}.`);
    } catch (error) {
      summary.errors += 1;
      console.error(`Row ${rowNumber}: error for ${email} —`, error);
    }
  }

  console.log("\n--- Import summary ---");
  console.log(`Total rows:        ${summary.totalRows}`);
  console.log(`Created:           ${summary.created}`);
  console.log(`Already existed:   ${summary.skippedExisting}`);
  console.log(`Invalid / skipped: ${summary.skippedInvalid}`);
  console.log(`Errors:            ${summary.errors}`);
  console.log("----------------------");
}

main()
  .catch((error) => {
    console.error("Import failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
