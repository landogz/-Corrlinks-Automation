#!/usr/bin/env node
/**
 * Mechanical checks for local exchange history archive (no network).
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const {
  archiveSentFiles,
  listArchive,
  readArchivedText,
  getArchiveRoot,
  getIndexPath,
  archiveDateStamp,
  archivePartFilename,
  consolidateArchiveRows,
  extractPartFromFilename,
} = require('../main/exchangeHistoryArchive');

function assert(cond, msg) {
  if (!cond) {
    console.error(`smoke-exchange-history-archive: ${msg}`);
    process.exit(1);
  }
}

assert(archiveDateStamp('2026-11-20') === '11202026', 'MMDDYYYY stamp');
assert(archivePartFilename('2026-11-20', 1) === '11202026_1.txt', 'part 1 name');
assert(archivePartFilename('2026-11-20', 3) === '11202026_3.txt', 'part 3 name');
assert(extractPartFromFilename('00860111_chen_jia_wu_part1.txt') === 1, 'legacy part');
assert(extractPartFromFilename('11212026_2.txt') === 2, 'canonical part');

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'exh-archive-'));
const archiveDir = getArchiveRoot();
const indexPath = getIndexPath();
const backupIndex = fs.existsSync(indexPath) ? fs.readFileSync(indexPath, 'utf8') : null;
const backupFiles = [];

async function main() {
  try {
    fs.mkdirSync(archiveDir, { recursive: true });
    const dayDir = path.join(archiveDir, '2026-11-21');
    if (fs.existsSync(dayDir)) {
      for (const name of fs.readdirSync(dayDir)) {
        backupFiles.push({
          name,
          content: fs.readFileSync(path.join(dayDir, name), 'utf8'),
        });
      }
    }

    const first = await archiveSentFiles({
      nyDate: '2026-11-21',
      sendTime: '02:00',
      files: [
        { part: 1, filename: 'inmate_a_part1.txt', text: 'hello one' },
        { part: 1, filename: 'inmate_b_part1.txt', text: 'dup recipient ignored' },
        { part: 2, filename: 'inmate_a_part2.txt', text: 'hello two' },
        { part: 3, filename: 'inmate_a_part3.txt', text: '' },
      ],
    });
    assert(first.ok === true, 'archive ok');
    assert(first.count === 2, `wrote 2 parts, got ${first.count}`);

    const listed = listArchive();
    const rows = listed.filter((r) => r.nyDate === '2026-11-21');
    const part1 = rows.find((r) => r.part === 1 || r.filename === '11212026_1.txt');
    const part2 = rows.find((r) => r.part === 2 || r.filename === '11212026_2.txt');
    assert(part1 && part1.filename === '11212026_1.txt', 'date_part filename');
    assert(part1.characters === 9, 'part-1 chars');
    assert(part2 && part2.filename === '11212026_2.txt', 'part-2 filename');
    assert(fs.existsSync(part1.localPath), 'part-1 on disk');
    assert(path.basename(part1.localPath) === '11212026_1.txt', 'disk basename');

    const read = readArchivedText(part1.id);
    assert(read.text === 'hello one', 'read by id');

    const again = await archiveSentFiles({
      nyDate: '2026-11-21',
      sendTime: '02:00',
      files: [{ part: 1, filename: 'other_inmate_part1.txt', text: 'hello one updated' }],
    });
    assert(again.count === 1, 'overwrite same date+part');
    const reread = readArchivedText(part1.id);
    assert(reread.text === 'hello one updated', 'overwrite content');
    assert(reread.characters === 17, 'overwrite chars');

    // Legacy per-recipient index collapses to one row per date|part.
    const dayDir22 = path.join(archiveDir, '2026-11-22');
    fs.mkdirSync(dayDir22, { recursive: true });
    const legacyA = path.join(dayDir22, '00860111_chen_jia_wu_part1.txt');
    const legacyB = path.join(dayDir22, '05408509_david_william_skinner_part1.txt');
    fs.writeFileSync(legacyA, 'body-a', 'utf8');
    fs.writeFileSync(legacyB, 'body-b', 'utf8');
    const collapsed = consolidateArchiveRows([
      {
        id: 'a',
        nyDate: '2026-11-22',
        sendTime: '02:00',
        part: 1,
        filename: '00860111_chen_jia_wu_part1.txt',
        localPath: legacyA,
        characters: 6,
      },
      {
        id: 'b',
        nyDate: '2026-11-22',
        sendTime: '02:00',
        part: 1,
        filename: '05408509_david_william_skinner_part1.txt',
        localPath: legacyB,
        characters: 6,
      },
    ]);
    assert(collapsed.length === 1, `collapse to 1 row, got ${collapsed.length}`);
    assert(collapsed[0].filename === '11222026_1.txt', 'canonical name after collapse');
    assert(fs.existsSync(collapsed[0].localPath), 'canonical file exists');
    assert(path.basename(collapsed[0].localPath) === '11222026_1.txt', 'canonical basename');
    assert(!fs.existsSync(legacyA) && !fs.existsSync(legacyB), 'legacy recipient copies removed');

    console.log('smoke-exchange-history-archive: ok');
  } finally {
    try {
      if (backupIndex != null) fs.writeFileSync(indexPath, backupIndex, 'utf8');
      else if (fs.existsSync(indexPath)) fs.unlinkSync(indexPath);
      for (const day of ['2026-11-21', '2026-11-22']) {
        const dayDir = path.join(archiveDir, day);
        if (!fs.existsSync(dayDir)) continue;
        for (const name of fs.readdirSync(dayDir)) {
          fs.unlinkSync(path.join(dayDir, name));
        }
        if (day === '2026-11-21') {
          for (const file of backupFiles) {
            fs.writeFileSync(path.join(dayDir, file.name), file.content, 'utf8');
          }
        }
        if (!fs.readdirSync(dayDir).length) fs.rmdirSync(dayDir);
      }
    } catch (_) {}
    try {
      fs.rmSync(tmpRoot, { recursive: true, force: true });
    } catch (_) {}
  }
}

main().catch((error) => {
  console.error(`smoke-exchange-history-archive: ${error.message || error}`);
  process.exit(1);
});
