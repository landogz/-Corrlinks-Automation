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

    console.log('smoke-exchange-history-archive: ok');
  } finally {
    try {
      if (backupIndex != null) fs.writeFileSync(indexPath, backupIndex, 'utf8');
      else if (fs.existsSync(indexPath)) fs.unlinkSync(indexPath);
      const dayDir = path.join(archiveDir, '2026-11-21');
      if (fs.existsSync(dayDir)) {
        for (const name of fs.readdirSync(dayDir)) {
          fs.unlinkSync(path.join(dayDir, name));
        }
        for (const file of backupFiles) {
          fs.writeFileSync(path.join(dayDir, file.name), file.content, 'utf8');
        }
        if (!backupFiles.length && fs.existsSync(dayDir) && !fs.readdirSync(dayDir).length) {
          fs.rmdirSync(dayDir);
        }
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
