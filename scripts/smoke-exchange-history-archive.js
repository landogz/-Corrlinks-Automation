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
  archiveDayFilename,
  consolidateArchiveRows,
  extractPartFromFilename,
  joinPartTexts,
} = require('../main/exchangeHistoryArchive');

function assert(cond, msg) {
  if (!cond) {
    console.error(`smoke-exchange-history-archive: ${msg}`);
    process.exit(1);
  }
}

assert(archiveDateStamp('2026-11-20') === '11202026', 'MMDDYYYY stamp');
assert(archiveDayFilename('2026-11-20') === '11202026.txt', 'day file name');
assert(extractPartFromFilename('00860111_chen_jia_wu_part1.txt') === 1, 'legacy part');
assert(extractPartFromFilename('11212026_2.txt') === 2, 'split part');
assert(joinPartTexts(['a', 'b']) === 'a\n\nb', 'join parts');

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
    assert(first.count === 1, `wrote 1 combined file, got ${first.count}`);

    const listed = listArchive();
    const rows = listed.filter((r) => r.nyDate === '2026-11-21');
    assert(rows.length === 1, `one row per day, got ${rows.length}`);
    const day = rows[0];
    assert(day.filename === '11212026.txt', 'day filename');
    assert(day.characters === 'hello one\n\nhello two'.length, 'combined chars');
    assert(fs.existsSync(day.localPath), 'day file on disk');
    assert(path.basename(day.localPath) === '11212026.txt', 'disk basename');

    const read = readArchivedText(day.id);
    assert(read.text === 'hello one\n\nhello two', 'read combined by id');

    const again = await archiveSentFiles({
      nyDate: '2026-11-21',
      sendTime: '02:00',
      files: [
        { part: 1, text: 'alpha' },
        { part: 2, text: 'beta' },
      ],
    });
    assert(again.count === 1, 'overwrite same day');
    const reread = readArchivedText(day.id);
    assert(reread.text === 'alpha\n\nbeta', 'overwrite combined content');

    // Legacy split part files collapse into one day file.
    const dayDir22 = path.join(archiveDir, '2026-11-22');
    fs.mkdirSync(dayDir22, { recursive: true });
    const p1 = path.join(dayDir22, '11222026_1.txt');
    const p2 = path.join(dayDir22, '11222026_2.txt');
    const p3 = path.join(dayDir22, '11222026_3.txt');
    fs.writeFileSync(p1, 'part-one', 'utf8');
    fs.writeFileSync(p2, 'part-two', 'utf8');
    fs.writeFileSync(p3, 'part-three', 'utf8');
    const collapsed = consolidateArchiveRows([
      {
        id: 'a',
        nyDate: '2026-11-22',
        sendTime: '02:00',
        part: 1,
        filename: '11222026_1.txt',
        localPath: p1,
      },
      {
        id: 'b',
        nyDate: '2026-11-22',
        sendTime: '02:00',
        part: 2,
        filename: '11222026_2.txt',
        localPath: p2,
      },
      {
        id: 'c',
        nyDate: '2026-11-22',
        sendTime: '02:00',
        part: 3,
        filename: '11222026_3.txt',
        localPath: p3,
      },
    ]);
    assert(collapsed.length === 1, `collapse to 1 row, got ${collapsed.length}`);
    assert(collapsed[0].filename === '11222026.txt', 'combined day name');
    assert(fs.existsSync(collapsed[0].localPath), 'combined file exists');
    assert(path.basename(collapsed[0].localPath) === '11222026.txt', 'combined basename');
    const combinedText = fs.readFileSync(collapsed[0].localPath, 'utf8');
    assert(combinedText === 'part-one\n\npart-two\n\npart-three', 'joined parts');
    assert(!fs.existsSync(p1) && !fs.existsSync(p2) && !fs.existsSync(p3), 'split files removed');

    console.log('smoke-exchange-history-archive: ok');
  } finally {
    try {
      if (backupIndex != null) fs.writeFileSync(indexPath, backupIndex, 'utf8');
      else if (fs.existsSync(indexPath)) fs.unlinkSync(indexPath);
      for (const day of ['2026-11-21', '2026-11-22']) {
        const dir = path.join(archiveDir, day);
        if (!fs.existsSync(dir)) continue;
        for (const name of fs.readdirSync(dir)) {
          fs.unlinkSync(path.join(dir, name));
        }
        if (day === '2026-11-21') {
          for (const file of backupFiles) {
            fs.writeFileSync(path.join(dir, file.name), file.content, 'utf8');
          }
        }
        if (!fs.readdirSync(dir).length) fs.rmdirSync(dir);
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
