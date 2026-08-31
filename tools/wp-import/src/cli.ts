#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';

import { importWxr, type ImportReport } from './import';
import { loadEnv } from './env';

const USAGE = `
Import a WordPress export into a site.

Usage:
  pnpm wp-import --file <export.xml> --site <site-slug> [options]

Options:
  --file, -f     Path to the WXR export file (required)
  --site, -s     Target site slug, matching sites.slug (required)
  --old-domain   Old site origin, e.g. https://oldblog.com
                 Defaults to wp:base_blog_url from the export.
  --dry-run      Parse, transform and report without writing anything
  --json         Print the report as JSON instead of text
  --help, -h     Show this message

Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local at the repo root.
Run this locally: the service-role key bypasses row level security and must
never be present in a deployed environment.
`.trim();

function formatCounts(counts: Record<string, number>): string {
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return '    (none)';
  return entries.map(([name, count]) => `    ${name}: ${count}`).join('\n');
}

function printReport(report: ImportReport): void {
  const mode = report.dryRun ? 'DRY RUN — nothing was written' : 'Import complete';

  const lines = [
    '',
    `${mode}`,
    `  Site:            ${report.siteSlug}`,
    `  Old domain:      ${report.oldDomain ?? '(not detected)'}`,
    `  Items parsed:    ${report.totalItemsParsed}`,
    `  Created:         ${report.created.length}`,
    `  Updated:         ${report.updated.length}`,
    `  Terms:           ${report.termsUpserted}`,
    '',
    '  Skipped (not posts, or trashed):',
    formatCounts(report.skippedByType),
    '',
    '  Dropped shortcodes (content was removed — review these):',
    formatCounts(report.droppedShortcodes),
  ];

  if (report.downgradedMissingDate.length > 0) {
    lines.push(
      '',
      `  Imported as DRAFT because no publish date was present (${report.downgradedMissingDate.length}):`,
      ...report.downgradedMissingDate.slice(0, 20).map((slug) => `    ${slug}`),
    );
    if (report.downgradedMissingDate.length > 20) {
      lines.push(`    … and ${report.downgradedMissingDate.length - 20} more`);
    }
  }

  if (report.slugConflicts.length > 0) {
    lines.push(
      '',
      `  SKIPPED — slug already taken (${report.slugConflicts.length}):`,
      '  These were not imported. Renaming would change a live URL, so resolve by hand.',
      ...report.slugConflicts
        .slice(0, 20)
        .map(
          (conflict) =>
            `    ${conflict.slug} (wp id ${conflict.wpPostId ?? '?'}, existing ${conflict.existingWpPostId ?? 'in-file duplicate'})`,
        ),
    );
    if (report.slugConflicts.length > 20) {
      lines.push(`    … and ${report.slugConflicts.length - 20} more`);
    }
  }

  lines.push('');
  console.log(lines.join('\n'));
}

async function main(): Promise<number> {
  const { values } = parseArgs({
    options: {
      file: { type: 'string', short: 'f' },
      site: { type: 'string', short: 's' },
      'old-domain': { type: 'string' },
      'dry-run': { type: 'boolean', default: false },
      json: { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h', default: false },
    },
    allowPositionals: false,
  });

  if (values.help) {
    console.log(USAGE);
    return 0;
  }

  if (!values.file || !values.site) {
    console.error(USAGE);
    console.error('\nError: both --file and --site are required.');
    return 1;
  }

  loadEnv();

  const xml = await readFile(values.file, 'utf8');

  const report = await importWxr(xml, {
    siteSlug: values.site,
    dryRun: values['dry-run'] ?? false,
    oldDomain: values['old-domain'],
  });

  if (values.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printReport(report);
  }

  // A slug conflict means content was silently not imported. Signal it in the
  // exit code so this is noticeable in a scripted run.
  return report.slugConflicts.length > 0 ? 2 : 0;
}

main()
  .then((code) => process.exit(code))
  .catch((error: unknown) => {
    console.error(`\nImport failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  });
