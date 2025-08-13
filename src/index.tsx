#!/usr/bin/env node
import React, { useEffect, useMemo, useState } from "react";
import { render, Box, Text } from "ink";
import { Gradient } from "./lib/inkModules.js";
import { CredentialsForm } from "./components/CredentialsForm.js";
import { AuditSelector, type AuditItem } from "./components/AuditSelector.js";
import { ExportOptions, type ExportOptionsResult } from "./components/ExportOptions.js";
import { DownloadProgress } from "./components/DownloadProgress.js";
import { ArchiveProgress } from "./components/ArchiveProgress.js";
import { LoadingSpinner } from "./components/LoadingSpinner.js";
import { createVantaClient } from "./lib/vantaClient.js";
import { downloadAll, type DownloadItem, type DownloadProgressUpdate } from "./lib/downloader.js";
import { gatherEvidenceItems, type GatherProgress } from "./lib/evidenceGatherer.js";
import { createZipArchive, type ArchiveProgress as ArchiveProgressType } from "./lib/archiver.js";
import { theme } from "./theme.js";
import path from "node:path";
import fs from "node:fs";
// Polyfill fetch/Headers/Web Streams for Node 16
import {
  fetch as undiciFetch,
  Headers as UndiciHeaders,
  Request as UndiciRequest,
  Response as UndiciResponse
} from "undici";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import UndiciBlob from "undici/types/file";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import UndiciFormData from "undici/types/formdata";
import { ReadableStream as WebReadableStream } from "stream/web";
import { TextEncoder as NodeTextEncoder, TextDecoder as NodeTextDecoder } from "node:util";
// @ts-ignore
if (typeof (globalThis as any).fetch === "undefined") {
  // @ts-ignore
  (globalThis as any).fetch = undiciFetch;
  // @ts-ignore
  (globalThis as any).Headers = UndiciHeaders;
  // @ts-ignore
  (globalThis as any).Request = UndiciRequest;
  // @ts-ignore
  (globalThis as any).Response = UndiciResponse;
}
// @ts-ignore
if (typeof (globalThis as any).ReadableStream === "undefined") {
  // @ts-ignore
  (globalThis as any).ReadableStream = WebReadableStream;
}
// @ts-ignore
// Blob/FormData polyfills are not critical for our flows and may be omitted on Node 16
// @ts-ignore
if (typeof (globalThis as any).TextEncoder === "undefined") {
  // @ts-ignore
  (globalThis as any).TextEncoder = NodeTextEncoder;
}
// @ts-ignore
if (typeof (globalThis as any).TextDecoder === "undefined") {
  // @ts-ignore
  (globalThis as any).TextDecoder = NodeTextDecoder as any;
}

type Step = "credentials" | "authenticating" | "audits" | "options" | "downloading" | "archiving" | "done" | "error";

interface DownloadResult {
  successes: number;
  failures: number;
  skipped: number;
  totalSize: number;
  startTime: number;
  endTime: number;
}

function App() {
  const [step, setStep] = useState<Step>("credentials");
  const [token, setToken] = useState<string>("");
  const [region, setRegion] = useState<"us" | "eu" | "aus" | "custom">("us");
  const [serverURL, setServerURL] = useState<string | undefined>();
  const [sdk, setSdk] = useState<ReturnType<typeof createVantaClient> | null>(null);
  const [audits, setAudits] = useState<AuditItem[]>([]);
  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null);
  const [exportOptions, setExportOptions] = useState<ExportOptionsResult | null>(null);
  const [progress, setProgress] = useState<DownloadProgressUpdate[]>([]);
  const [gatherProgress, setGatherProgress] = useState<GatherProgress | null>(null);
  const [archiveProgress, setArchiveProgress] = useState<ArchiveProgressType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloadResult, setDownloadResult] = useState<DownloadResult | null>(null);
  const [verboseMode, setVerboseMode] = useState<boolean>(process.argv.includes("--verbose"));

  // Step 1: credentials
  const handleCredentials = async (r: any) => {
    setStep("authenticating");
    try {
      setToken(r.token ?? "");
      setRegion(r.region ?? "us");
      setServerURL(r.serverURL ?? undefined);
      const client = await createVantaClient({
        token: r.token,
        clientId: r.clientId,
        clientSecret: r.clientSecret,
        scope: r.scope,
        region: r.region ?? "us",
        serverURL: r.serverURL,
        debug: r.debug
      });
      setSdk(client as any);
      // Fetch audits (paginated)
      const auditsList = await fetchAllAudits(client);
      const items: AuditItem[] = auditsList.map((a: any) => ({
        id: a.id ?? a.auditId ?? a.uuid ?? String(a),
        name: `${a.customerDisplayName || a.customerOrganizationName || 'Unknown'} - ${a.framework || 'Audit'}`,
        framework: a.framework ?? a.standard ?? undefined,
        status: a.completionDate ? 'Completed' : (a.auditEndDate && new Date(a.auditEndDate) < new Date() ? 'Expired' : 'Active')
      }));
      // If empty, keep moving to audits step but show helpful message in UI
      setAudits(items);
      setStep("audits");
    } catch (e: any) {
      setError(`Authentication failed: ${e?.message ?? String(e)}`);
      setStep("error");
    }
  };

  // Step 2: audit selection → options
  const handleSelectAudit = (auditId: string) => {
    setSelectedAuditId(auditId);
    setStep("options");
  };

  // Step 3: options → downloading
  const handleOptions = async (opts: ExportOptionsResult) => {
    setExportOptions(opts);
    setStep("downloading");
    const startTime = Date.now();
    try {
      if (!sdk || !selectedAuditId) throw new Error("missing sdk or audit id");
      
      // Starting evidence gathering
      
      // Discover evidence artifacts
      const items = await gatherEvidenceItems(sdk, selectedAuditId, verboseMode, (gProgress) => {
        setGatherProgress(gProgress);
      });
      
      if (items.length === 0) {
        throw new Error("No evidence items found for this audit. The audit may not have any attached evidence.");
      }
      
      // Evidence items ready for download
      
      const downloads: DownloadItem[] = items.map((it, idx) => ({
        url: it.downloadUrl,
        fileName: it.fileName ?? `artifact-${idx + 1}`,
        evidenceKey: it.evidenceKey
      }));
      
      // Determine output directory - use temp if creating ZIP
      const downloadDir = opts.createZip 
        ? path.join(opts.outputDir, ".tmp-download")
        : opts.outputDir;
      
      const updates: DownloadProgressUpdate[] = [];
      const result = await downloadAll(downloads, {
        outputDir: downloadDir,
        structure: opts.structure,
        folderPrefix: opts.folderPrefix,
        concurrency: 6,
        maxRetries: 3,
        verbose: verboseMode
      }, (u) => {
        updates.push(u);
        setProgress([...updates]);
      });
      
      // Create ZIP if requested
      if (opts.createZip && opts.zipName) {
        setStep("archiving");
        
        const zipPath = path.join(opts.outputDir, opts.zipName);
        
        // Creating ZIP archive
        
        await createZipArchive({
          sourceDir: downloadDir,
          outputPath: zipPath,
          compressionLevel: 9,
          verbose: verboseMode
        }, (progress) => {
          setArchiveProgress(progress);
        });
        
        // Clean up temp directory
        // Cleaning up temporary files
        
        // Remove temp directory
        fs.rmSync(downloadDir, { recursive: true, force: true });
      }
      
      const endTime = Date.now();
      setDownloadResult({
        ...result,
        totalSize: updates.reduce((acc, u) => acc + (u.totalBytes || 0), 0),
        startTime,
        endTime
      });
      setStep("done");
    } catch (e: any) {
      setError(`Download failed: ${e?.message ?? String(e)}`);
      setStep("error");
    }
  };

  return (
    <Box flexDirection="column">
      <Box flexDirection="column" marginBottom={1}>
        <Gradient name="vice">
          <Text bold>🦙 Vanta Auditor TUI</Text>
        </Gradient>
        <Text color={theme.colors.primary}>Your Friendly Audit Llama</Text>
      </Box>

      {step === "credentials" && <CredentialsForm onSubmit={handleCredentials} />}
      {step === "authenticating" && (
        <LoadingSpinner 
          message="🦙 Authenticating with Vanta..." 
          subMessage="Validating credentials and fetching audits"
        />
      )}
      {step === "audits" && <AuditSelector audits={audits} onSelect={handleSelectAudit} />}
      {step === "options" && selectedAuditId && (
        <ExportOptions auditId={selectedAuditId} onSubmit={handleOptions} />
      )}
      {step === "downloading" && <DownloadProgress updates={progress} gatherProgress={gatherProgress} />}
      {step === "archiving" && <ArchiveProgress progress={archiveProgress} />}
      {step === "done" && downloadResult && (
        <Box flexDirection="column">
          <Text color={theme.colors.success}>✨ All done! Your audit evidence is ready!</Text>
          <Text> </Text>
          {exportOptions?.createZip ? (
            <Text color={theme.colors.text}>📦 ZIP archive: {path.join(exportOptions.outputDir, exportOptions.zipName || "audit.zip")}</Text>
          ) : (
            <Text color={theme.colors.text}>📁 Files saved to: {exportOptions?.outputDir}</Text>
          )}
          <Text color={theme.colors.text}>📊 Summary:</Text>
          <Text color={theme.colors.success}>   ✓ Downloaded: {downloadResult.successes} files</Text>
          {downloadResult.failures > 0 && (
            <Text color={theme.colors.error}>   ✗ Failed: {downloadResult.failures} files</Text>
          )}
          {downloadResult.skipped > 0 && (
            <Text color={theme.colors.warning}>   ↷ Skipped: {downloadResult.skipped} files (already exist)</Text>
          )}
          <Text color={theme.colors.text}>   💾 Total size: {formatBytes(downloadResult.totalSize)}</Text>
          <Text color={theme.colors.text}>   ⏱️  Duration: {((downloadResult.endTime - downloadResult.startTime) / 1000).toFixed(1)}s</Text>
          <Text> </Text>
          <Text color={theme.colors.primaryLight}>🦙 Happy auditing!</Text>
        </Box>
      )}
      {step === "error" && <Text color={theme.colors.error}>{error}</Text>}
    </Box>
  );
}

// Evidence gathering moved to lib/evidenceGatherer.ts
async function fetchAllAudits(sdk: any): Promise<any[]> {
  const all: any[] = [];
  let cursor: string | undefined = undefined;
  for (let i = 0; i < 50; i++) {
    const res: any = await sdk.audits.list({ pageSize: 100, pageCursor: cursor });
    const pageData: any[] = res?.results?.data ?? [];
    all.push(...pageData);
    const pageInfo: any = res?.results?.pageInfo;
    if (pageInfo?.hasNextPage && pageInfo?.endCursor) {
      cursor = pageInfo.endCursor;
    } else {
      break;
    }
  }
  return all;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

render(<App />);


