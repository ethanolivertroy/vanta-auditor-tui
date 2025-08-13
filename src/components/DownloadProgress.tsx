import React, { useEffect, useMemo, useState } from "react";
import { Box, Text } from "ink";
import { Spinner } from '../lib/inkModules.js';
import figures from 'figures';
import { theme } from "../theme.js";
import { MultiLevelProgress } from "./AnimatedProgressBar.js";
import type { DownloadProgressUpdate } from "../lib/downloader.js";
import type { GatherProgress } from "../lib/evidenceGatherer.js";

export function DownloadProgress({
  updates,
  gatherProgress
}: {
  updates: ReadonlyArray<DownloadProgressUpdate>;
  gatherProgress?: GatherProgress | null;
}) {
  const [startTime] = useState(Date.now());
  const [currentSpeed, setCurrentSpeed] = useState<string>("0 KB/s");
  
  const totals = useMemo(() => {
    // If we're still gathering, use that progress
    if (gatherProgress && gatherProgress.phase !== 'complete') {
      const discoveryProgress = gatherProgress.phase === 'discovering' 
        ? 5  // Discovery phase is 0-5%
        : 10 + (gatherProgress.current / Math.max(1, gatherProgress.total)) * 5; // Processing is 10-15%
        
      return {
        total: gatherProgress.total,
        success: 0,
        failed: 0,
        skipped: 0,
        completed: 0,
        remaining: gatherProgress.total,
        progress: discoveryProgress,
        totalBytes: 0,
        phase: gatherProgress.phase,
        phaseMessage: gatherProgress.message
      };
    }
    
    // Download phase (15-100%)
    const total = updates.at(-1)?.totalItems ?? updates.length;
    const success = updates.filter((u) => u.status === "success").length;
    const failed = updates.filter((u) => u.status === "failed").length;
    const skipped = updates.filter((u) => u.status === "skipped").length;
    const completed = success + failed + skipped;
    const remaining = total - completed;
    
    // Calculate weighted progress including partial downloads
    let weightedProgress = 0;
    const downloadingFiles = updates.filter(u => u.status === "downloading");
    
    if (total > 0) {
      // Base progress from completed files (85% of the remaining progress)
      const baseProgress = (completed / total) * 85;
      
      // Add partial progress from currently downloading files
      let partialProgress = 0;
      downloadingFiles.forEach(file => {
        if (file.totalBytes && file.receivedBytes) {
          const fileProgress = file.receivedBytes / file.totalBytes;
          partialProgress += (fileProgress / total) * 85;
        }
      });
      
      weightedProgress = 15 + baseProgress + partialProgress; // Start at 15% after discovery
    }
    
    // Calculate total size
    const totalBytes = updates.reduce((acc, u) => acc + (u.totalBytes || 0), 0);
    
    return { 
      total, 
      success, 
      failed, 
      skipped, 
      completed, 
      remaining, 
      progress: weightedProgress,
      totalBytes,
      phase: 'downloading' as const,
      phaseMessage: undefined
    };
  }, [updates, gatherProgress]);
  
  // Get current downloading file
  const currentFile = useMemo(() => {
    const downloading = updates.filter(u => u.status === "downloading").pop();
    if (!downloading) return null;
    
    const progress = downloading.totalBytes 
      ? (downloading.receivedBytes || 0) / downloading.totalBytes * 100 
      : 0;
    
    const fileName = downloading.filePath.split('/').pop() || 'file';
    const size = downloading.receivedBytes && downloading.totalBytes
      ? `${formatBytes(downloading.receivedBytes)}/${formatBytes(downloading.totalBytes)}`
      : undefined;
    
    return { fileName, progress, size };
  }, [updates]);
  
  // Calculate download speed
  useEffect(() => {
    const elapsed = (Date.now() - startTime) / 1000; // seconds
    const totalReceived = updates.reduce((acc, u) => acc + (u.receivedBytes || 0), 0);
    const speed = elapsed > 0 ? totalReceived / elapsed : 0;
    setCurrentSpeed(formatSpeed(speed));
  }, [updates, startTime]);

  // Determine current phase label
  const phaseLabel = totals.phase === 'discovering' 
    ? '🔍 Discovering evidence...'
    : totals.phase === 'processing'
    ? '⚙️ Processing evidence items...'
    : '📥 Downloading files';
    
  const currentLabel = totals.phaseMessage 
    || (currentFile ? `Downloading: ${currentFile.fileName}` : phaseLabel);

  return (
    <Box flexDirection="column">
      {/* Phase indicator */}
      <Box marginBottom={1}>
        <Text color={theme.colors.primary} bold>
          {phaseLabel}
        </Text>
      </Box>
      
      <MultiLevelProgress
        overall={totals.progress}
        current={currentFile?.progress || 0}
        label={currentLabel}
        stats={{
          downloaded: totals.completed,
          total: totals.total,
          speed: totals.phase === 'downloading' ? currentSpeed : undefined,
          eta: totals.remaining > 0 && totals.phase === 'downloading' 
            ? `${totals.remaining} files remaining` 
            : undefined
        }}
      />
      
      {/* Recent files */}
      <Box flexDirection="column" marginTop={1} paddingLeft={2}>
        <Text color={theme.colors.dim}>Recent files:</Text>
        {updates.slice(-3).map((u, idx) => (
          <Box key={`${u.filePath}-${idx}`} paddingLeft={2}>
            <Text>
              {u.status === "downloading" && (
                <Text color={theme.colors.primaryLight}>
                  <Spinner type="dots" /> 
                </Text>
              )}
              {u.status === "success" && (
                <Text color={theme.colors.success}>{figures.tick} </Text>
              )}
              {u.status === "failed" && (
                <Text color={theme.colors.error}>{figures.cross} </Text>
              )}
              {u.status === "skipped" && (
                <Text color={theme.colors.warning}>{figures.arrowUp} </Text>
              )}
              <Text color={theme.colors.text}>{truncate(u.filePath.split('/').pop() || '', 50)}</Text>
            </Text>
          </Box>
        ))}
      </Box>
      
      {/* Failed downloads if any */}
      {totals.failed > 0 && (
        <Box flexDirection="column" marginTop={1} paddingLeft={2}>
          <Text color={theme.colors.error}>
            {figures.warning} {totals.failed} file(s) failed to download
          </Text>
        </Box>
      )}
    </Box>
  );
}

function truncate(s: string, n: number) {
  if (s.length <= n) return s;
  return s.slice(0, n - 1) + "…";
}

function formatBytes(bytes: number) {
  const units = ["B", "KB", "MB", "GB", "TB"] as const;
  let i = 0;
  let v = bytes;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  return `${v.toFixed(1)} ${units[i]}`;
}

function formatSpeed(bytesPerSecond: number): string {
  if (bytesPerSecond === 0) return "0 KB/s";
  const kbps = bytesPerSecond / 1024;
  if (kbps < 1024) {
    return `${kbps.toFixed(1)} KB/s`;
  }
  const mbps = kbps / 1024;
  return `${mbps.toFixed(1)} MB/s`;
}

export default DownloadProgress;


