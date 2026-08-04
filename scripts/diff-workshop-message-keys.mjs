/**
 * One-off: diff EN vs zh-Hant workshop message key sets.
 * Usage: npx tsx scripts/diff-workshop-message-keys.mjs
 */
async function main() {
  const { workshopEnMessages } = await import(
    "../src/lib/i18n/messages/workshop-messages.ts"
  );
  const { workshopZhHantMessages } = await import(
    "../src/lib/i18n/messages/workshop-messages.zh-Hant.ts"
  );

  const enKeys = new Set(Object.keys(workshopEnMessages));
  const zhKeys = new Set(Object.keys(workshopZhHantMessages));

  const missingInZh = [...enKeys].filter((k) => !zhKeys.has(k)).sort();
  const missingInEn = [...zhKeys].filter((k) => !enKeys.has(k)).sort();

  console.log(`EN keys: ${enKeys.size}`);
  console.log(`zh-Hant keys: ${zhKeys.size}`);

  if (missingInZh.length === 0 && missingInEn.length === 0) {
    console.log("OK: both catalogs export the identical key set.");
    process.exit(0);
  }

  if (missingInZh.length) {
    console.error("\nMissing in zh-Hant:");
    for (const k of missingInZh) console.error(`  - ${k}`);
  }
  if (missingInEn.length) {
    console.error("\nMissing in EN:");
    for (const k of missingInEn) console.error(`  - ${k}`);
  }
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
