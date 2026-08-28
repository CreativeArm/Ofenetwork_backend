import { Jimp } from "jimp";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const inputPath = join(__dirname, "../public/logo.png");
const outputPath = join(__dirname, "../src/app/icon.png");

async function main() {
  try {
    const image = await Jimp.read(inputPath);
    const height = image.bitmap.height;
    
    // Crop a square from the left side. 
    // Trying both API styles just in case, but crop usually takes an object in Jimp v1, or positional args in v0
    try {
      image.crop({ x: 0, y: 0, w: height, h: height });
    } catch (e) {
      // Fallback for older jimp API
      image.crop(0, 0, height, height);
    }
    
    // Resize it to 256x256 for a standard icon size
    try {
        image.resize({ w: 256, h: 256 });
    } catch(e) {
        image.resize(256, 256);
    }

    await image.write(outputPath);
    console.log(`✅ Favicon saved to ${outputPath}`);
  } catch (error) {
    console.error(error);
  }
}

main();
