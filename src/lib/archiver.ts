import archiver from "archiver";
import fs from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream/promises";

export interface ArchiveOptions {
  sourceDir: string;
  outputPath: string;
  compressionLevel?: number; // 0-9, default 9
  verbose?: boolean;
}

export interface ArchiveProgress {
  phase: "preparing" | "archiving" | "finalizing" | "complete";
  bytesProcessed: number;
  totalBytes?: number;
  filesProcessed: number;
  totalFiles?: number;
  message?: string;
}

export async function createZipArchive(
  options: ArchiveOptions,
  onProgress?: (progress: ArchiveProgress) => void
): Promise<{ outputPath: string; size: number; fileCount: number }> {
  const { sourceDir, outputPath, compressionLevel = 9, verbose } = options;

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Count files first for progress tracking
  const files = await countFilesRecursive(sourceDir);
  const totalFiles = files.length;
  let filesProcessed = 0;
  let bytesProcessed = 0;

  // Preparing ZIP archive

  onProgress?.({
    phase: "preparing",
    bytesProcessed: 0,
    filesProcessed: 0,
    totalFiles,
    message: "Preparing archive..."
  });

  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath);
    const archive = archiver("zip", {
      zlib: { level: compressionLevel }
    });

    // Handle errors
    archive.on("error", (err) => {
      // Archive error occurred
      reject(err);
    });

    // Track progress
    archive.on("entry", (entry) => {
      filesProcessed++;
      if (entry.stats && entry.stats.size) {
        bytesProcessed += entry.stats.size;
      }
      
      onProgress?.({
        phase: "archiving",
        bytesProcessed,
        filesProcessed,
        totalFiles,
        message: `Archiving ${entry.name}`
      });

      // Archive progress update
    });

    // Handle completion
    output.on("close", () => {
      const stats = fs.statSync(outputPath);
      
      onProgress?.({
        phase: "complete",
        bytesProcessed: stats.size,
        filesProcessed: totalFiles,
        totalFiles,
        message: "Archive complete"
      });

      // Archive completed

      resolve({
        outputPath,
        size: stats.size,
        fileCount: totalFiles
      });
    });

    // Pipe archive to output file
    archive.pipe(output);

    // Add entire directory to archive
    archive.directory(sourceDir, false);

    // Finalize the archive
    onProgress?.({
      phase: "finalizing",
      bytesProcessed,
      filesProcessed: totalFiles,
      totalFiles,
      message: "Finalizing archive..."
    });

    archive.finalize();
  });
}

async function countFilesRecursive(dir: string): Promise<string[]> {
  const files: string[] = [];
  
  async function walk(currentPath: string) {
    const entries = await fs.promises.readdir(currentPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.isFile()) {
        files.push(fullPath);
      }
    }
  }
  
  await walk(dir);
  return files;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}