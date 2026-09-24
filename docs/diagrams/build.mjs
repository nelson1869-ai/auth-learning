// =========================================================================
// 🎓 DIAGRAM SITE BUILDER
// Binabasa ang lahat ng docs/diagrams/*.md, kinukuha ang bawat ```mermaid
// block, at gumagawa ng ISANG index.html na may navigator sa kaliwa.
//
// Patakbuhin (mula sa root ng project) tuwing magdadagdag/magbabago ng diagram:
//   node docs/diagrams/build.mjs
// Tapos i-double-click ang docs/diagrams/index.html (o buksan sa Chrome).
//
// Bakit may script pa: kapag binuksan ang .html bilang file (double-click),
// hindi pinapayagan ng browser na basahin ang ibang file sa folder (security).
// Kaya isinasama ng script ang lahat ng diagram SA LOOB ng index.html.
// Ang .md pa rin ang tanging source — ang index.html ay "generated" lang,
// kaya naka-.gitignore ito.
// =========================================================================
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));

// 1. Basahin ang bawat .md at kunin ang title + mga diagram nito
const pages = readdirSync(dir)
  .filter((name) => name.endsWith('.md'))
  .sort()
  .map((name) => {
    const text = readFileSync(join(dir, name), 'utf8');
    const title = text.match(/^#\s+(.+)$/m)?.[1] ?? name;

    const diagrams = [];
    let heading = title;
    // Dumaan sa bawat linya: tandaan ang huling "## heading" bilang label ng susunod na diagram
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const h2 = lines[i].match(/^##\s+(.+)$/);
      if (h2) heading = h2[1];
      if (lines[i].trim() === '```mermaid') {
        const code = [];
        for (i++; i < lines.length && lines[i].trim() !== '```'; i++) code.push(lines[i]);
        diagrams.push({ label: heading, code: code.join('\n') });
      }
    }
    return { file: name, title, diagrams };
  })
  .filter((page) => page.diagrams.length > 0);

// 2. Isulat ang index.html. Ang data ay JSON sa loob ng <script>; pinapalitan
// ang "<" para hindi masira ang HTML kung may "</script>" sa loob ng diagram.
const data = JSON.stringify(pages).replace(/</g, '\\u003c');
const html = readFileSync(join(dir, 'template.html'), 'utf8').replace('__DIAGRAM_DATA__', data);
writeFileSync(join(dir, 'index.html'), html);

const total = pages.reduce((n, p) => n + p.diagrams.length, 0);
console.log(`✅ docs/diagrams/index.html — ${pages.length} file(s), ${total} diagram(s)`);
