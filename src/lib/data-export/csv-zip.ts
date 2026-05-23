import "server-only";

type CsvValue = string | number | boolean | Date | null | undefined | bigint;
type CsvRow = Record<string, CsvValue>;

type ZipEntry = {
  name: string;
  content: string | Buffer;
};

const textEncoder = new TextEncoder();

function formatCsvValue(value: CsvValue) {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function escapeCsvValue(value: CsvValue) {
  const formatted = formatCsvValue(value);

  if (
    formatted.includes(",") ||
    formatted.includes("\n") ||
    formatted.includes("\r") ||
    formatted.includes('"')
  ) {
    return `"${formatted.replaceAll('"', '""')}"`;
  }

  return formatted;
}

export function rowsToCsv(rows: CsvRow[]) {
  if (rows.length === 0) return "";

  const headers = Object.keys(rows[0] ?? {});
  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => escapeCsvValue(row[header])).join(",")),
  ];

  return `${lines.join("\n")}\n`;
}

function makeCrcTable() {
  const table = new Uint32Array(256);

  for (let i = 0; i < 256; i += 1) {
    let value = i;

    for (let j = 0; j < 8; j += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }

    table[i] = value >>> 0;
  }

  return table;
}

const crcTable = makeCrcTable();

function crc32(buffer: Buffer) {
  let crc = 0xffffffff;

  for (const byte of buffer) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(date = new Date()) {
  const year = Math.max(1980, date.getFullYear());
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = Math.floor(date.getSeconds() / 2);

  return {
    time: (hours << 11) | (minutes << 5) | seconds,
    date: ((year - 1980) << 9) | (month << 5) | day,
  };
}

function writeLocalHeader(input: {
  name: Buffer;
  crc: number;
  size: number;
  time: number;
  date: number;
}) {
  const header = Buffer.alloc(30);
  header.writeUInt32LE(0x04034b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(0x0800, 6);
  header.writeUInt16LE(0, 8);
  header.writeUInt16LE(input.time, 10);
  header.writeUInt16LE(input.date, 12);
  header.writeUInt32LE(input.crc, 14);
  header.writeUInt32LE(input.size, 18);
  header.writeUInt32LE(input.size, 22);
  header.writeUInt16LE(input.name.length, 26);
  header.writeUInt16LE(0, 28);
  return Buffer.concat([header, input.name]);
}

function writeCentralHeader(input: {
  name: Buffer;
  crc: number;
  size: number;
  time: number;
  date: number;
  offset: number;
}) {
  const header = Buffer.alloc(46);
  header.writeUInt32LE(0x02014b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(20, 6);
  header.writeUInt16LE(0x0800, 8);
  header.writeUInt16LE(0, 10);
  header.writeUInt16LE(input.time, 12);
  header.writeUInt16LE(input.date, 14);
  header.writeUInt32LE(input.crc, 16);
  header.writeUInt32LE(input.size, 20);
  header.writeUInt32LE(input.size, 24);
  header.writeUInt16LE(input.name.length, 28);
  header.writeUInt16LE(0, 30);
  header.writeUInt16LE(0, 32);
  header.writeUInt16LE(0, 34);
  header.writeUInt16LE(0, 36);
  header.writeUInt32LE(0, 38);
  header.writeUInt32LE(input.offset, 42);
  return Buffer.concat([header, input.name]);
}

function writeEndRecord(input: {
  entries: number;
  centralDirectorySize: number;
  centralDirectoryOffset: number;
}) {
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(input.entries, 8);
  end.writeUInt16LE(input.entries, 10);
  end.writeUInt32LE(input.centralDirectorySize, 12);
  end.writeUInt32LE(input.centralDirectoryOffset, 16);
  end.writeUInt16LE(0, 20);
  return end;
}

export function createZip(entries: ZipEntry[]) {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  const stamp = dosDateTime();
  let offset = 0;

  for (const entry of entries) {
    const safeName = entry.name.replaceAll("\\", "/").replace(/^\/+/, "");
    const name = Buffer.from(textEncoder.encode(safeName));
    const content =
      typeof entry.content === "string"
        ? Buffer.from(textEncoder.encode(entry.content))
        : entry.content;
    const crc = crc32(content);
    const size = content.length;
    const localHeader = writeLocalHeader({
      name,
      crc,
      size,
      time: stamp.time,
      date: stamp.date,
    });

    localParts.push(localHeader, content);
    centralParts.push(
      writeCentralHeader({
        name,
        crc,
        size,
        time: stamp.time,
        date: stamp.date,
        offset,
      }),
    );

    offset += localHeader.length + content.length;
  }

  const centralDirectoryOffset = offset;
  const centralDirectory = Buffer.concat(centralParts);
  const endRecord = writeEndRecord({
    entries: entries.length,
    centralDirectorySize: centralDirectory.length,
    centralDirectoryOffset,
  });

  return Buffer.concat([...localParts, centralDirectory, endRecord]);
}
