import React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../../theme.js';
import figures from 'figures';

interface Step {
  label: string;
  status: 'pending' | 'active' | 'completed';
}

interface StepIndicatorProps {
  steps: Step[];
}

export function StepIndicator({ steps }: StepIndicatorProps) {
  return (
    <Box marginBottom={1}>
      {steps.map((step, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <Text color={theme.colors.dim}> → </Text>
          )}
          <Box>
            <Text color={
              step.status === 'completed' ? theme.colors.success :
              step.status === 'active' ? theme.colors.primary :
              theme.colors.dim
            }>
              {step.status === 'completed' ? figures.tick :
               step.status === 'active' ? figures.pointer :
               figures.circle} {step.label}
            </Text>
          </Box>
        </React.Fragment>
      ))}
    </Box>
  );
}

export default StepIndicator;