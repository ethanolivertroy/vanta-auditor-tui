import React from 'react';
import { Box, Text } from 'ink';
import { ProgressBar, Spinner } from '../lib/inkModules.js';
import figures from 'figures';
import { theme } from '../theme.js';

interface ProgressBarProps {
  label?: string;
  value: number; // 0-100
  total?: number;
  current?: number;
  showPercentage?: boolean;
  showSpinner?: boolean;
  color?: string;
  width?: number;
}

export function CustomProgressBar({
  label,
  value,
  total,
  current,
  showPercentage = true,
  showSpinner = false,
  color = theme.colors.primary,
  width = 30
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, value));
  
  return (
    <Box flexDirection="column">
      {label && (
        <Box marginBottom={1}>
          <Text color={theme.colors.text}>{label}</Text>
        </Box>
      )}
      <Box>
        {showSpinner && percentage < 100 && (
          <Box marginRight={1}>
            <Spinner type="dots" />
          </Box>
        )}
        {percentage === 100 && (
          <Box marginRight={1}>
            <Text color={theme.colors.success}>{figures.tick}</Text>
          </Box>
        )}
        <Box width={width}>
          <ProgressBar 
            percent={percentage / 100} 
            left={`[`}
            right={`]`}
            character="█"
          />
        </Box>
        <Box marginLeft={1}>
          {showPercentage && (
            <Text color={color}>{percentage.toFixed(0)}%</Text>
          )}
          {current !== undefined && total !== undefined && (
            <Text color={theme.colors.dim}> ({current}/{total})</Text>
          )}
        </Box>
      </Box>
    </Box>
  );
}

interface MultiProgressBarProps {
  overall: {
    label: string;
    value: number;
    current: number;
    total: number;
  };
  current?: {
    fileName: string;
    value: number;
    size?: string;
    speed?: string;
  };
  stats?: {
    completed: number;
    failed: number;
    skipped: number;
    remaining: number;
    totalSize?: string;
  };
}

export function MultiProgressBar({ overall, current, stats }: MultiProgressBarProps) {
  return (
    <Box flexDirection="column" paddingY={1}>
      {/* Overall Progress */}
      <Box flexDirection="column" marginBottom={1}>
        <Text color={theme.colors.primary} bold>
          🦙 {overall.label}
        </Text>
        <CustomProgressBar
          value={overall.value}
          current={overall.current}
          total={overall.total}
          showSpinner={true}
          width={40}
        />
      </Box>
      
      {/* Current File Progress */}
      {current && (
        <Box flexDirection="column" marginBottom={1} paddingLeft={2}>
          <Text color={theme.colors.primaryLight}>
            {figures.arrowRight} Current: {current.fileName}
          </Text>
          <Box paddingLeft={2}>
            <CustomProgressBar
              value={current.value}
              width={30}
              color={theme.colors.primaryLight}
              showSpinner={false}
            />
            {(current.size || current.speed) && (
              <Box marginLeft={1}>
                {current.size && <Text color={theme.colors.dim}>{current.size}</Text>}
                {current.speed && <Text color={theme.colors.dim}> @ {current.speed}</Text>}
              </Box>
            )}
          </Box>
        </Box>
      )}
      
      {/* Statistics */}
      {stats && (
        <Box flexDirection="column" paddingLeft={2}>
          <Box>
            <Text color={theme.colors.success}>{figures.tick} Completed: {stats.completed}</Text>
            {stats.failed > 0 && (
              <Text color={theme.colors.error}> {figures.cross} Failed: {stats.failed}</Text>
            )}
            {stats.skipped > 0 && (
              <Text color={theme.colors.warning}> {figures.arrowUp} Skipped: {stats.skipped}</Text>
            )}
          </Box>
          <Box>
            <Text color={theme.colors.dim}>
              {figures.ellipsis} Remaining: {stats.remaining} files
            </Text>
            {stats.totalSize && (
              <Text color={theme.colors.dim}> | Total: {stats.totalSize}</Text>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
}

export default CustomProgressBar;