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
  safeFilename,
} = require('../main/exchangeHistoryArchive');

function assert(cond, msg) {
  if (!cond) {
    console.error(`smoke-exchange-history-archive: ${msg}`);
    process.exit(1);
  }
}

assert(safeFilename('a/b:c*.txt') === 'a_b_c_.txt' || safeFilename('a/b:c*.txt').includes('_'), 'safe filename');

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'exh-archive-'));
// Without Electron ready, archive root falls back to repo-relative exchange-history/.
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
        { filename: 'part-1.txt', text: 'hello one' },
        { filename: 'part-1.txt', text: 'dup ignored body' },
        { filename: 'part-2.txt', text: 'hello two' },
        { filename: 'skip-empty.txt', text: '' },
      ],
    });
    assert(first.ok === true, 'archive ok');
    assert(first.count === 2, `wrote 2 files, got ${first.count}`);

    const listed = listArchive();
    const rows = listed.filter((r) => r.nyDate === '2026-11-21' && r.sendTime === '02:00');
    assert(rows.length >= 2, 'list has archived rows');
    const part1 = rows.find((r) => r.filename === 'part-1.txt');
    assert(part1 && part1.characters === 9, 'part-1 chars');
    assert(fs.existsSync(part1.localPath), 'part-1 on disk');

    const read = readArchivedText(part1.id);
    assert(read.text === 'hello one', 'read by id');

    const again = await archiveSentFiles({
      nyDate: '2026-11-21',
      sendTime: '02:00',
      files: [{ filename: 'part-1.txt', text: 'hello one updated' }],
    });
    assert(again.count === 1, 'overwrite same slot+name');
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
