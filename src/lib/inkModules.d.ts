import { FC } from 'react';

export interface SelectInputProps<T = any> {
  items: Array<{ label: string; value: T }>;
  onSelect: (item: { label: string; value: T }) => void;
  limit?: number;
  isFocused?: boolean;
}

export interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (value: string) => void;
  placeholder?: string;
  focus?: boolean;
  mask?: string;
}

export interface GradientProps {
  name?: string;
  children?: React.ReactNode;
}

export interface SpinnerProps {
  type?: string;
}

export interface ProgressBarProps {
  percent: number;
  left?: string;
  right?: string;
  character?: string;
  columns?: number;
  rightPad?: number;
}

export const SelectInput: FC<SelectInputProps>;
export const TextInput: FC<TextInputProps>;
export const Gradient: FC<GradientProps>;
export const Spinner: FC<SpinnerProps>;
export const ProgressBar: FC<ProgressBarProps>;