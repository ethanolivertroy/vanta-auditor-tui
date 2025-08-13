import fs from "node:fs";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import https from "node:https";
import http from "node:http";
import { URL } from "node:url";
import zlib from "node:zlib";
import PQueue from "p-queue";
import sanitize from "sanitize-filename";

export interface DownloadItem {
  url: string;
  fileName: string; // suggested filename (with extension)
  evidenceKey?: string; // optional for naming
}

export interface DownloadOptions {
  outputDir: string;
  structure: "single" | "separate";
  folderPrefix?: string; // when structure === "separate"
  concurrency?: number;
  maxRetries?: number;
  verbose?: boolean;
}

export interface DownloadProgressUpdate {
  itemIndex: number;
  totalItems: number;
  filePath: string;
  receivedBytes?: number;
  totalBytes?: number;
  status: "pending" | "downloading" | "success" | "skipped" | "failed";
  error?: string;
}

export async function downloadAll(
  items: DownloadItem[],
  options: DownloadOptions,
  onProgress?: (u: DownloadProgressUpdate) => void
): Promise<{ successes: number; failures: number; skipped: number; totalSize: number }> {
  if (!fs.existsSync(options.outputDir)) {
    fs.mkdirSync(options.outputDir, { recursive: true });
  }

  const queue = new PQueue({ concurrency: options.concurrency ?? 6 });
  let successes = 0;
  let failures = 0;
  let skipped = 0;
  let totalSize = 0;
  
  // Download process starting

  await Promise.all(
    items.map((item, index) =>
      queue.add(async () => {
        const targetPath = computeTargetPath(index, item, options);
        const dir = path.dirname(targetPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        // Skip if exists with non-zero size
        if (fs.existsSync(targetPath)) {
          const stats = fs.statSync(targetPath);
          if (stats.size > 0) {
            skipped += 1;
            totalSize += stats.size;
            // File exists, skipping
            onProgress?.({
              itemIndex: index + 1,
              totalItems: items.length,
              filePath: targetPath,
              totalBytes: stats.size,
              status: "skipped"
            });
            return;
          }
        }

        // Validate URL before attempting download
        if (!item.url || !isValidUrl(item.url)) {
          // Invalid URL detected
          failures += 1;
          onProgress?.({
            itemIndex: index + 1,
            totalItems: items.length,
            filePath: targetPath,
            status: "failed",
            error: "Invalid or missing download URL"
          });
          return;
        }
        
        const maxRetries = options.maxRetries ?? 3;
        let attempt = 0;
        // eslint-disable-next-line no-constant-condition
        while (true) {
          try {
            // Download attempt in progress
            onProgress?.({
              itemIndex: index + 1,
              totalItems: items.length,
              filePath: targetPath,
              status: "downloading"
            });
            const fileSize = await streamToFile(item.url, targetPath, (received, total) => {
              onProgress?.({
                itemIndex: index + 1,
                totalItems: items.length,
                filePath: targetPath,
                receivedBytes: received,
                totalBytes: total,
                status: "downloading"
              });
            }, options.verbose);
            
            successes += 1;
            totalSize += fileSize;
            
            // Download completed successfully
            onProgress?.({
              itemIndex: index + 1,
              totalItems: items.length,
              filePath: targetPath,
              status: "success"
            });
            return;
          } catch (error) {
            attempt += 1;
            if (attempt > maxRetries) {
              failures += 1;
              // Download failed after retries
              onProgress?.({
                itemIndex: index + 1,
                totalItems: items.length,
                filePath: targetPath,
                status: "failed",
                error: (error as Error)?.message ?? String(error)
              });
              return;
            }
            const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 8000);
            await delay(backoffMs);
          }
        }
      })
    )
  );

  // Download process complete
  
  return { successes, failures, skipped, totalSize };
}

function computeTargetPath(index: number, item: DownloadItem, options: DownloadOptions): string {
  // Preserve file extension while sanitizing the name
  const fileName = item.fileName || `artifact-${index}`;
  const ext = path.extname(fileName);
  const nameWithoutExt = path.basename(fileName, ext);
  const safeName = sanitize(nameWithoutExt) + ext;
  
  if (options.structure === "single") {
    return uniquePath(path.join(options.outputDir, safeName));
  }
  const prefix = options.folderPrefix ?? "evidence";
  const evidenceIndex = String(index + 1).padStart(3, "0");
  const evKey = sanitize(item.evidenceKey ?? "item");
  const folder = `${prefix}-${evidenceIndex}__${evKey}`;
  return uniquePath(path.join(options.outputDir, folder, safeName));
}

function uniquePath(targetPath: string): string {
  if (!fs.existsSync(targetPath)) return targetPath;
  const dir = path.dirname(targetPath);
  const ext = path.extname(targetPath);
  const base = path.basename(targetPath, ext);
  let i = 1;
  while (true) {
    const candidate = path.join(dir, `${base} (${i})${ext}`);
    if (!fs.existsSync(candidate)) return candidate;
    i += 1;
  }
}

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

async function streamToFile(
  urlStr: string,
  targetPath: string,
  onBytes?: (received: number, total?: number) => void,
  verbose: boolean = false,
  redirectCount = 0
): Promise<number> {
  const urlObj = new URL(urlStr);
  const client = urlObj.protocol === "http:" ? http : https;
  const tmp = `${targetPath}.part`;

  return new Promise<number>((resolve, reject) => {
    const req = client.get(
      urlObj,
      {
        headers: {
          "user-agent": "vanta-auditor-tui/0.1.0"
        }
      },
      (res) => {
        const status = res.statusCode ?? 0;
        if (status >= 300 && status < 400 && res.headers.location) {
          // handle redirect
          if (redirectCount > 5) return reject(new Error("Too many redirects"));
          const nextUrl = new URL(res.headers.location, urlStr).toString();
          // Following redirect
          res.resume();
          streamToFile(nextUrl, targetPath, onBytes, verbose, redirectCount + 1)
            .then(resolve)
            .catch(reject);
          return;
        }
        if (status < 200 || status >= 300) {
          res.resume();
          return reject(new Error(`HTTP ${status} ${res.statusMessage ?? ""}`));
        }

        const total = res.headers["content-length"] ? Number(res.headers["content-length"]) : undefined;
        const file = fs.createWriteStream(tmp);
        let received = 0;
        
        // Check if response is gzipped
        const contentEncoding = res.headers["content-encoding"];
        let stream = res as NodeJS.ReadableStream;
        
        if (contentEncoding === "gzip" || contentEncoding === "deflate") {
          // Decompressing content
          // Decompress the stream
          const decompress = contentEncoding === "gzip" ? zlib.createGunzip() : zlib.createInflate();
          stream = res.pipe(decompress);
          
          // Track compressed bytes received
          res.on("data", (chunk: Buffer) => {
            received += chunk.length;
            onBytes?.(received, total);
          });
        } else {
          // Track uncompressed bytes
          stream.on("data", (chunk: Buffer) => {
            received += chunk.length;
            onBytes?.(received, total);
          });
        }
        
        stream.pipe(file);
        stream.on("error", reject);
        file.on("finish", () => {
          try {
            fs.renameSync(tmp, targetPath);
            const stats = fs.statSync(targetPath);
            resolve(stats.size);
          } catch (err) {
            reject(err);
          }
        });
        file.on("error", reject);
      }
    );
    req.on("error", reject);
  });
}


