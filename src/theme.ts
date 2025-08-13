export const theme = {
  colors: {
    // Vanta brand colors
    primary: "#AC55FF",      // Vanta's signature purple
    primaryDark: "#240642",  // Dark purple for emphasis
    primaryLight: "#D4B5FF", // Light purple for accents
    
    // Functional colors
    success: "#22c55e",      // Green for success states
    warning: "#f59e0b",      // Orange for warnings
    error: "#ef4444",        // Red for errors
    
    // UI colors
    text: "#F5F5F5",         // Light text for dark terminal
    dim: "#6B7280",          // Dimmed text
    background: "#1A1A1A",   // Dark background
    border: "#4A4B5C",       // Border color for unfocused elements
    
    // Legacy color mappings for compatibility
    purple: "#AC55FF",       // Maps to Vanta purple
    pink: "#D4B5FF",        // Maps to light purple
    vantaBlue: "#AC55FF",   // Use purple as primary brand color
    vantaTeal: "#22c55e"    // Use success green
  }
};

export function dim(text: string): string {
  return text;
}

