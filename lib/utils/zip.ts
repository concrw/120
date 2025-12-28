import archiver from "archiver";
import { createWriteStream } from "fs";
import { mkdir } from "fs/promises";
import path from "path";

/**
 * Create a ZIP file from multiple files
 */
export async function createZip(
  files: Array<{ path: string; name: string }>,
  outputPath: string
): Promise<string> {
  // Ensure output directory exists
  await mkdir(path.dirname(outputPath), { recursive: true });

  return new Promise((resolve, reject) => {
    const output = createWriteStream(outputPath);
    const archive = archiver("zip", {
      zlib: { level: 9 }, // Maximum compression
    });

    output.on("close", () => {
      console.log(`ZIP created: ${archive.pointer()} bytes`);
      resolve(outputPath);
    });

    archive.on("error", (err) => {
      reject(err);
    });

    archive.pipe(output);

    // Add files to archive
    for (const file of files) {
      archive.file(file.path, { name: file.name });
    }

    archive.finalize();
  });
}

/**
 * Create ZIP from URLs (download and compress)
 */
export async function createZipFromUrls(
  urls: string[],
  outputPath: string,
  tempDir: string
): Promise<string> {
  const downloadedFiles: Array<{ path: string; name: string }> = [];

  // Download all files
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const ext = path.extname(new URL(url).pathname) || ".jpg";
    const filename = `image_${String(i + 1).padStart(3, "0")}${ext}`;
    const filepath = path.join(tempDir, filename);

    const response = await fetch(url);
    if (!response.ok || !response.body) {
      throw new Error(`Failed to download ${url}`);
    }

    const buffer = await response.arrayBuffer();
    const fs = await import("fs/promises");
    await fs.writeFile(filepath, Buffer.from(buffer));

    downloadedFiles.push({ path: filepath, name: filename });
  }

  // Create ZIP
  return createZip(downloadedFiles, outputPath);
}
