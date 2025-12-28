import ffmpeg from "fluent-ffmpeg";
import { createWriteStream, createReadStream } from "fs";
import { mkdir, unlink, readdir } from "fs/promises";
import path from "path";
import { tmpdir } from "os";

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  fps: number;
  format: string;
}

/**
 * Get video metadata
 */
export async function getVideoMetadata(videoPath: string): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }

      const videoStream = metadata.streams.find((s) => s.codec_type === "video");
      if (!videoStream) {
        reject(new Error("No video stream found"));
        return;
      }

      resolve({
        duration: metadata.format.duration || 0,
        width: videoStream.width || 0,
        height: videoStream.height || 0,
        fps: eval(videoStream.r_frame_rate || "30") as number, // e.g., "30/1" -> 30
        format: metadata.format.format_name || "unknown",
      });
    });
  });
}

/**
 * Extract frames from video
 */
export async function extractFrames(
  videoPath: string,
  outputDir: string,
  options: {
    fps?: number; // frames per second to extract
    maxFrames?: number;
    format?: "png" | "jpg";
  } = {}
): Promise<string[]> {
  const { fps = 1, maxFrames, format = "png" } = options;

  // Create output directory
  await mkdir(outputDir, { recursive: true });

  return new Promise((resolve, reject) => {
    const command = ffmpeg(videoPath).outputOptions([`-vf fps=${fps}`]);

    if (maxFrames) {
      command.outputOptions([`-frames:v ${maxFrames}`]);
    }

    command
      .output(path.join(outputDir, `frame-%04d.${format}`))
      .on("end", async () => {
        try {
          const files = await readdir(outputDir);
          const framePaths = files
            .filter((f) => f.endsWith(`.${format}`))
            .sort()
            .map((f) => path.join(outputDir, f));
          resolve(framePaths);
        } catch (error) {
          reject(error);
        }
      })
      .on("error", reject)
      .run();
  });
}

/**
 * Extract first frame as thumbnail
 */
export async function extractThumbnail(
  videoPath: string,
  outputPath: string,
  timeInSeconds: number = 0
): Promise<string> {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .screenshots({
        timestamps: [timeInSeconds],
        filename: path.basename(outputPath),
        folder: path.dirname(outputPath),
        size: "1280x720",
      })
      .on("end", () => resolve(outputPath))
      .on("error", reject);
  });
}

/**
 * Combine frames into video
 */
export async function framesToVideo(
  framesDir: string,
  outputPath: string,
  options: {
    fps?: number;
    codec?: string;
    quality?: number; // 0-51, lower is better
  } = {}
): Promise<string> {
  const { fps = 30, codec = "libx264", quality = 23 } = options;

  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(path.join(framesDir, "frame-%04d.png"))
      .inputFPS(fps)
      .videoCodec(codec)
      .outputOptions([`-crf ${quality}`, "-pix_fmt yuv420p"])
      .output(outputPath)
      .on("end", () => resolve(outputPath))
      .on("error", reject)
      .run();
  });
}

/**
 * Convert video format
 */
export async function convertVideo(
  inputPath: string,
  outputPath: string,
  options: {
    codec?: string;
    bitrate?: string;
    scale?: { width: number; height: number };
  } = {}
): Promise<string> {
  const { codec = "libx264", bitrate = "2000k", scale } = options;

  return new Promise((resolve, reject) => {
    const command = ffmpeg(inputPath).videoCodec(codec).videoBitrate(bitrate);

    if (scale) {
      command.size(`${scale.width}x${scale.height}`);
    }

    command
      .output(outputPath)
      .on("end", () => resolve(outputPath))
      .on("error", reject)
      .run();
  });
}

/**
 * Trim video
 */
export async function trimVideo(
  inputPath: string,
  outputPath: string,
  options: {
    start: number; // seconds
    duration: number; // seconds
  }
): Promise<string> {
  const { start, duration } = options;

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .setStartTime(start)
      .setDuration(duration)
      .output(outputPath)
      .on("end", () => resolve(outputPath))
      .on("error", reject)
      .run();
  });
}

/**
 * Create temporary directory for video processing
 */
export async function createTempDir(prefix: string = "video-"): Promise<string> {
  const tempDir = path.join(tmpdir(), `${prefix}${Date.now()}`);
  await mkdir(tempDir, { recursive: true });
  return tempDir;
}

/**
 * Cleanup temporary files
 */
export async function cleanup(paths: string[]): Promise<void> {
  await Promise.all(
    paths.map((p) =>
      unlink(p).catch((err) => {
        console.warn(`Failed to delete ${p}:`, err);
      })
    )
  );
}

/**
 * Download video from URL to local file
 */
export async function downloadVideo(url: string, outputPath: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok || !response.body) {
    throw new Error(`Failed to download video: ${response.statusText}`);
  }

  const fileStream = createWriteStream(outputPath);
  const reader = response.body.getReader();

  return new Promise((resolve, reject) => {
    const pump = async () => {
      try {
        const { done, value } = await reader.read();
        if (done) {
          fileStream.end();
          resolve(outputPath);
          return;
        }
        fileStream.write(value);
        pump();
      } catch (error) {
        reject(error);
      }
    };

    pump();
  });
}
