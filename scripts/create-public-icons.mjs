import sharp from "sharp";
const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#0E5C2F"/><path d="M12 24 32 14l20 10-20 10-20-10Zm7 5v13c7 7 19 7 26 0V29l-13 7-13-7Zm32-3v13" fill="none" stroke="#fff" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/></svg>');
const png = await sharp(svg).resize(32, 32).png().toBuffer();
const header = Buffer.alloc(22);
header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(1, 4);
header.writeUInt8(32, 6); header.writeUInt8(32, 7); header.writeUInt16LE(1, 10); header.writeUInt16LE(32, 12);
header.writeUInt32LE(png.length, 14); header.writeUInt32LE(22, 18);
await sharp(svg).resize(180, 180).png().toFile("public/apple-touch-icon.png");
await import("node:fs/promises").then(({ writeFile }) => writeFile("public/favicon.ico", Buffer.concat([header, png])));
