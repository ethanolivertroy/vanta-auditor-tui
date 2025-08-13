import React from "react";
import { Box, Text } from "ink";
import { ProgressBar, Spinner } from "../lib/inkModules.js";
import { theme } from "../theme.js";
import type { ArchiveProgress } from "../lib/archiver.js";

export function ArchiveProgress({ progress }: { progress: ArchiveProgress | null }) {
  if (!progress) {
    return (
      <Box flexDirection="column">
        <Box>
          <Text color={theme.colors.primaryLight}>
            <Spinner type="dots" /> Initializing archive...
          </Text>
        </Box>
      </Box>
    );
  }

  const progressPercent = progress.totalFiles 
    ? progress.filesProcessed / progress.totalFiles
    : 0;

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text color={theme.colors.primary} bold>
          📦 Creating ZIP Archive
        </Text>
      </Box>

      <Box flexDirection="column">
        <Box>
          <Text color={theme.colors.text}>
            Phase: {progress.phase === "preparing" && "Preparing archive"}
            {progress.phase === "archiving" && "Adding files to archive"}
            {progress.phase === "finalizing" && "Finalizing archive"}
            {progress.phase === "complete" && "Archive complete"}
          </Text>
        </Box>

        {progress.totalFiles && (
          <Box>
            <Text color={theme.colors.text}>
              Files: {progress.filesProcessed}/{progress.totalFiles}
            </Text>
          </Box>
        )}

        <Box width={50}>
          <ProgressBar 
            percent={progressPercent}
          />
        </Box>

        {progress.message && (
          <Box>
            <Text color={theme.colors.primaryLight}>
              {progress.phase === "complete" ? "✅" : <Spinner type="dots" />} {progress.message}
            </Text>
          </Box>
        )}

        {progress.bytesProcessed > 0 && (
          <Box>
            <Text color={theme.colors.text}>
              Size: {formatBytes(progress.bytesProcessed)}
            </Text>
          </Box>
        )}
      </Box>
    </Box>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export default ArchiveProgress;