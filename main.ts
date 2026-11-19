// Slant Six Studio — the hand-in program for gta6-cover-art-01 (Node 22,
// standard library only). The studio itself is the static web app in app/:
// plain files a desktop browser runs offline, no build step, no network.
// This program's whole job is to hand that app in: copy app/ and
// screenshots/ into the output directory and write the dossier the judge
// reads, using the kit's own vendored library so the bytes match the
// scorer's copy exactly.
//
// Try the app first with `node serve.ts` (http://localhost:8080). Outside
// the grader, MAKEFUN_OUTPUT_DIR names the output directory:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Run it twice and the outputs are identical: the studio's renders are
// seeded, and nothing here stamps a time or a random name into the result.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoDir = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoDir, 'app'), join(outputDir, 'app'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoDir, 'screenshots'))) {
  cpSync(join(repoDir, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// The caps below are the gate's own (the kit's reference/gate.json): the
// dossier text budget, at most 4 screenshots of at most 256 KiB, at most 993
// files and 48 MiB under app/, and no app/ path over 1,000 UTF-8 bytes.
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
