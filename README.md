# 🦙 Vanta Auditor TUI

[![npm version](https://badge.fury.io/js/vanta-auditor-tui.svg)](https://www.npmjs.com/package/vanta-auditor-tui)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A beautiful terminal UI for exporting Vanta audit evidence with ZIP support, folder organization, and real-time progress tracking.

![Vanta Auditor TUI Demo](https://github.com/ethanolivertroy/vanta-auditor-tui/raw/main/demo.gif)

## ✨ Features

- 🎨 **Beautiful TUI** - Gorgeous purple/pink Vanta-themed interface
- 🔐 **Multiple Auth Methods** - OAuth client credentials or bearer token
- 🌍 **Multi-Region Support** - US, EU, AUS regions + custom URLs
- 📁 **Flexible Export Options**:
  - Single folder with all files
  - Separate folders per evidence item
  - Custom folder prefixes (e.g., CSP-001)
- 📦 **ZIP Archive Support** - Automatically create compressed archives
- 📊 **Real-Time Progress** - Track discovery, download, and archiving phases
- 🔄 **Robust Downloads** - Automatic retries and concurrent downloads
- 🦙 **Friendly Llama** - Your audit companion!

## 📦 Installation

### NPM (Recommended)

```bash
npm install -g vanta-auditor-tui
```

### From Source

```bash
git clone https://github.com/ethanolivertroy/vanta-auditor-tui.git
cd vanta-auditor-tui
npm install
npm run build
npm link
```

## 🚀 Usage

### Quick Start

```bash
vanta-audit
```

Or with the full command:

```bash
vanta-auditor-tui
```

### Navigation

- **Tab** / **Shift+Tab** - Navigate between fields
- **Arrow Keys** - Select options in dropdowns
- **Enter** - Confirm selection or submit
- **Ctrl+C** - Exit at any time

### Authentication

The tool supports two authentication methods:

#### 1. OAuth Client Credentials (Recommended)

Create OAuth credentials in your Vanta settings:
1. Go to Vanta Settings → Developer → API Tokens
2. Create a new OAuth application
3. Copy the Client ID and Client Secret
4. Use these credentials when prompted

#### 2. Bearer Token

Generate a bearer token from Vanta:
1. Go to Vanta Settings → Developer → API Tokens
2. Create a new bearer token with auditor scope
3. Copy the token and use when prompted

### Export Options

#### Folder Structure
- **Single Folder** - All files in one directory
- **Separate Folders** - Each evidence item in its own folder with format: `{prefix}-{number}__{evidenceId}/`

#### ZIP Archive
- **Create ZIP** - Compress all evidence into a single `.zip` file
- **Keep Files** - Export files without compression

## 🔒 Security

### Best Practices

1. **Never commit credentials** - Use environment variables or secure credential management
2. **Token Storage** - Store tokens in secure password managers
3. **Minimal Scope** - Only grant necessary API scopes
4. **Regular Rotation** - Rotate API credentials regularly

### Environment Variables (Optional)

You can set credentials via environment variables to avoid manual entry:

```bash
export VANTA_CLIENT_ID="your_client_id"
export VANTA_CLIENT_SECRET="your_client_secret"
# OR
export VANTA_BEARER_TOKEN="your_bearer_token"
```

## 🎨 Features in Detail

### Progress Tracking

The tool provides detailed progress through multiple phases:
1. **Discovery Phase** - Finding all evidence items
2. **Processing Phase** - Retrieving download URLs
3. **Download Phase** - Downloading files with progress bars
4. **Archive Phase** - Creating ZIP archive (if selected)

### File Organization

Files are automatically organized with:
- Sanitized filenames (safe for all filesystems)
- Preserved file extensions
- Automatic extension inference for missing extensions
- Duplicate file handling with numbered suffixes

### Robust Downloads

- Concurrent downloads (6 parallel by default)
- Automatic retry with exponential backoff
- Resume support for interrupted downloads
- GZIP decompression for compressed responses
- Redirect following

## 🛠️ Development

### Requirements

- Node.js 18+ (16+ with polyfills)
- TypeScript 5+

### Building

```bash
npm install
npm run build
```

### Running in Development

```bash
npm run dev
```

### Testing

```bash
npm test
```

## 📝 API Reference

This tool uses the [Vanta Auditor API SDK](https://github.com/VantaInc/vanta-auditor-api-sdk-typescript).

### Required Scopes

- `auditor-api.audit:read` - Read audit information
- `auditor-api.auditor:read` - Access auditor endpoints

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Vanta](https://www.vanta.com) for the Auditor API
- [Ink](https://github.com/vadimdemedes/ink) for the terminal UI framework
- [Archiver](https://github.com/archiverjs/node-archiver) for ZIP support

## 📧 Support

For issues and questions:
- [GitHub Issues](https://github.com/ethanolivertroy/vanta-auditor-tui/issues)
- [NPM Package](https://www.npmjs.com/package/vanta-auditor-tui)

---

Made with 💜 by Ethan Troy | Your Friendly Audit Llama 🦙