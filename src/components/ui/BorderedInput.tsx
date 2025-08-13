import React from 'react';
import { Box, Text } from 'ink';
import { TextInput } from '../../lib/inkModules.js';
import { theme } from '../../theme.js';

interface BorderedInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  mask?: string;
  focus?: boolean;
  borderColor?: string;
  width?: number;
}

export function BorderedInput({
  label,
  value,
  onChange,
  onSubmit,
  placeholder,
  mask,
  focus = true,
  borderColor = theme.colors.primary,
  width = 40
}: BorderedInputProps) {
  return (
    <Box flexDirection="column" marginY={1}>
      <Text color={theme.colors.primaryLight}>{label}</Text>
      <Box
        borderStyle="single"
        borderColor={borderColor}
        paddingX={1}
        width={width}
      >
        <TextInput
          value={value}
          onChange={onChange}
          onSubmit={onSubmit}
          placeholder={placeholder}
          mask={mask}
          focus={focus}
        />
      </Box>
    </Box>
  );
}

export default BorderedInput;