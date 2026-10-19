import sharp from "sharp";

const svg = Buffer.from(`<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg"><rect width="1200" height="630" fill="#0e5c2f"/><circle cx="1080" cy="80" r="260" fill="#1b7541"/><path d="M0 520Q280 400 600 530T1200 460V630H0Z" fill="#084321"/><text x="90" y="250" font-family="Arial,sans-serif" font-size="76" font-weight="700" fill="white">StudentOS Africa</text><text x="95" y="330" font-family="Arial,sans-serif" font-size="34" fill="#e1f0e5">Scholarships, internships and student benefits</text><text x="95" y="380" font-family="Arial,sans-serif" font-size="34" fill="#e1f0e5">for Africa’s next generation.</text></svg>`);
await sharp(svg).png().toFile("public/og-image.png");
