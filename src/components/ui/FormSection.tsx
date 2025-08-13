import React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../../theme.js';

interface FormSectionProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  borderStyle?: 'single' | 'double' | 'round' | 'bold' | 'singleDouble' | 'doubleSingle' | 'classic';
  borderColor?: string;
  padding?: number;
  width?: number | string;
}

export function FormSection({
  title,
  subtitle,
  children,
  borderStyle = 'round',
  borderColor = theme.colors.primary,
  padding = 2,
  width
}: FormSectionProps) {
  return (
    <Box
      flexDirection="column"
      borderStyle={borderStyle}
      borderColor={borderColor}
      padding={padding}
      width={width}
      marginY={1}
    >
      {title && (
        <Box flexDirection="column" marginBottom={1}>
          <Text color={theme.colors.primary} bold>
            {title}
          </Text>
          {subtitle && (
            <Text color={theme.colors.dim}>
              {subtitle}
            </Text>
          )}
        </Box>
      )}
      {children}
    </Box>
  );
}

export default FormSection;