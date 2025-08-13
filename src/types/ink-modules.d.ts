declare module 'ink-gradient' {
  import { FC } from 'react';
  
  interface GradientProps {
    name?: string;
    children?: React.ReactNode;
  }
  
  const Gradient: FC<GradientProps>;
  export default Gradient;
}

declare module 'ink-select-input' {
  import { FC } from 'react';
  
  interface SelectInputProps<T = any> {
    items: Array<{ label: string; value: T }>;
    onSelect: (item: { label: string; value: T }) => void;
    limit?: number;
    isFocused?: boolean;
  }
  
  const SelectInput: FC<SelectInputProps>;
  export default SelectInput;
}

declare module 'ink-text-input' {
  import { FC } from 'react';
  
  interface TextInputProps {
    value: string;
    onChange: (value: string) => void;
    onSubmit?: (value: string) => void;
    placeholder?: string;
    focus?: boolean;
    mask?: string;
  }
  
  const TextInput: FC<TextInputProps>;
  export default TextInput;
}