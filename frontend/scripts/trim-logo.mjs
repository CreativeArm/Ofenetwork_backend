// Trims whitespace/transparent padding from logo.png using Jimp
import { Jimp } from "jimp";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const inputPath = join(__dirname, "../public/logo.png");
const outputPath = join(__dirname, "../public/logo.png");

const image = await Jimp.read(inputPath);

// autocrop removes surrounding whitespace/transparent pixels
image.autocrop({ tolerance: 0.02, cropOnlyFrames: false });

await image.write(outputPath);
console.log(`✅ Trimmed logo saved to ${outputPath}`);
console.log(`   New size: ${image.bitmap.width}x${image.bitmap.height}px`);
