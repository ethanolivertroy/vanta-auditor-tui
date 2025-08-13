import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { theme } from '../theme.js';

interface AnimatedProgressBarProps {
  value: number; // 0-100
  label?: string;
  width?: number;
  showPercentage?: boolean;
  animationSpeed?: number; // milliseconds per step
}

export function AnimatedProgressBar({
  value,
  label,
  width = 30,
  showPercentage = true,
  animationSpeed = 20
}: AnimatedProgressBarProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [springVelocity, setSpringVelocity] = useState(0);
  
  useEffect(() => {
    const targetValue = Math.max(0, Math.min(100, value));
    let currentValue = displayValue;
    let velocity = springVelocity;
    
    const interval = setInterval(() => {
      // Spring physics simulation
      const stiffness = 0.15;
      const damping = 0.85;
      
      const force = (targetValue - currentValue) * stiffness;
      velocity = velocity * damping + force;
      currentValue += velocity;
      
      // Check if we're close enough to the target
      if (Math.abs(targetValue - currentValue) < 0.1 && Math.abs(velocity) < 0.1) {
        currentValue = targetValue;
        clearInterval(interval);
      }
      
      setDisplayValue(currentValue);
      setSpringVelocity(velocity);
    }, animationSpeed);
    
    return () => clearInterval(interval);
  }, [value]);
  
  const filledWidth = Math.round((displayValue / 100) * width);
  const emptyWidth = width - filledWidth;
  
  // Create gradient effect with multiple characters
  const getBarCharacter = (position: number, filled: number, total: number) => {
    const relativePos = position / total;
    const fillRatio = filled / total;
    
    if (relativePos < fillRatio - 0.1) return '█';
    if (relativePos < fillRatio - 0.05) return '▓';
    if (relativePos < fillRatio) return '▒';
    return '░';
  };
  
  const barContent = Array.from({ length: width }, (_, i) => 
    getBarCharacter(i, filledWidth, width)
  ).join('');
  
  // Pulsing effect for active downloads
  const pulseIntensity = Math.sin(Date.now() / 200) * 0.5 + 0.5;
  const barColor = displayValue < 100 
    ? pulseIntensity > 0.5 ? theme.colors.primary : theme.colors.primaryLight
    : theme.colors.success;
  
  return (
    <Box flexDirection="column">
      {label && (
        <Box marginBottom={0}>
          <Text color={theme.colors.text}>{label}</Text>
        </Box>
      )}
      <Box>
        <Text color={theme.colors.dim}>[</Text>
        <Text color={barColor}>{barContent}</Text>
        <Text color={theme.colors.dim}>]</Text>
        {showPercentage && (
          <Box marginLeft={1}>
            <Text color={displayValue === 100 ? theme.colors.success : theme.colors.text}>
              {Math.round(displayValue)}%
            </Text>
          </Box>
        )}
      </Box>
    </Box>
  );
}

interface MultiLevelProgressProps {
  overall: number;
  current?: number;
  label?: string;
  stats?: {
    downloaded: number;
    total: number;
    speed?: string;
    eta?: string;
  };
}

export function MultiLevelProgress({
  overall,
  current = 0,
  label,
  stats
}: MultiLevelProgressProps) {
  return (
    <Box flexDirection="column" paddingY={1}>
      <AnimatedProgressBar
        value={overall}
        label="Overall Progress"
        width={40}
      />
      
      {current > 0 && (
        <Box marginTop={1}>
          <AnimatedProgressBar
            value={current}
            label={label || "Current File"}
            width={40}
          />
        </Box>
      )}
      
      {stats && (
        <Box marginTop={1} flexDirection="column">
          <Text color={theme.colors.dim}>
            📊 {stats.downloaded}/{stats.total} files
            {stats.speed && ` • ${stats.speed}`}
            {stats.eta && ` • ETA: ${stats.eta}`}
          </Text>
        </Box>
      )}
    </Box>
  );
}