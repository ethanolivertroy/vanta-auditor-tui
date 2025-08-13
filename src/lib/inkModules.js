// ESM wrapper for CommonJS ink modules
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const inkSelectInput = require('ink-select-input');
const inkTextInput = require('ink-text-input');
const inkGradient = require('ink-gradient');
const inkSpinner = require('ink-spinner');
const inkProgressBar = require('ink-progress-bar');

export const SelectInput = inkSelectInput.default || inkSelectInput;
export const TextInput = inkTextInput.default || inkTextInput;
export const Gradient = inkGradient.default || inkGradient;
export const Spinner = inkSpinner.default || inkSpinner;
export const ProgressBar = inkProgressBar.default || inkProgressBar;