import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { Spinner } from '../lib/inkModules.js';
import figures from 'figures';
import { theme } from '../theme.js';
import { AnimatedProgressBar } from './AnimatedProgressBar.js';

interface LoadingSpinnerProps {
  message?: string;
  subMessage?: string;
  type?: 'dots' | 'dots2' | 'dots3' | 'dots4' | 'dots5' | 'dots6' | 'dots7' | 'dots8' | 'dots9' | 'dots10' | 'dots11' | 'dots12';
}

const loadingMessages = [
  "🦙 Gathering your audit evidence...",
  "🦙 Herding the documents...",
  "🦙 Organizing compliance artifacts...",
  "🦙 Preparing your audit package...",
  "🦙 Collecting evidence files...",
];

const authMessages = [
  "🦙 Authenticating with Vanta...",
  "🦙 Establishing secure connection...",
  "🦙 Verifying credentials...",
  "🦙 Loading audit data...",
];

export function LoadingSpinner({ 
  message, 
  subMessage,
  type = 'dots' 
}: LoadingSpinnerProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const messages = message ? [message] : (subMessage?.includes('auth') ? authMessages : loadingMessages);
  
  useEffect(() => {
    if (messages.length > 1) {
      const interval = setInterval(() => {
        setMessageIndex((prev) => (prev + 1) % messages.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [messages.length]);
  
  // Indeterminate progress animation
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        // Create a wave effect that goes from 0 to 100 and back
        const wave = Math.sin(Date.now() / 1000) * 50 + 50;
        return wave;
      });
    }, 50);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <Box flexDirection="column" paddingY={1}>
      <Box>
        <Box marginRight={1}>
          <Spinner type={type} />
        </Box>
        <Text color={theme.colors.primary}>
          {messages[messageIndex]}
        </Text>
      </Box>
      {subMessage && (
        <Box paddingLeft={3}>
          <Text color={theme.colors.dim}>{subMessage}</Text>
        </Box>
      )}
      <Box marginTop={1}>
        <AnimatedProgressBar 
          value={progress}
          width={30}
          showPercentage={false}
          animationSpeed={10}
        />
      </Box>
    </Box>
  );
}

export function LoadingOverlay({ 
  isLoading, 
  message,
  children 
}: { 
  isLoading: boolean; 
  message?: string;
  children: React.ReactNode;
}) {
  if (isLoading) {
    return <LoadingSpinner message={message} />;
  }
  return <>{children}</>;
}

export default LoadingSpinner;