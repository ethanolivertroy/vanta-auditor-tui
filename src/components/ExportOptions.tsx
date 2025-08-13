import React, { useMemo, useState, useEffect } from "react";
import { Box, Text, useInput, Key } from "ink";
import { SelectInput, TextInput } from "../lib/inkModules.js";
import { theme } from "../theme.js";
import { BorderedInput } from "./ui/BorderedInput.js";
import { FormSection } from "./ui/FormSection.js";
import path from "node:path";

export interface ExportOptionsResult {
  outputDir: string;
  structure: "single" | "separate";
  folderPrefix?: string;
  createZip?: boolean;
  zipName?: string;
}

type FocusableInput = "dir" | "structure" | "prefix" | "zip" | "zipName" | "submit";

export function ExportOptions({
  auditId,
  onSubmit
}: {
  auditId: string;
  onSubmit: (r: ExportOptionsResult) => void;
}) {
  const [structure, setStructure] = useState<"single" | "separate">("single");
  const [prefix, setPrefix] = useState<string>("CSP-001");
  const [createZip, setCreateZip] = useState<boolean>(true);
  const defaultDir = useMemo(() => {
    const now = new Date();
    const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
      now.getDate()
    ).padStart(2, "0")}-${String(now.getHours()).padStart(2, "0")}${String(
      now.getMinutes()
    ).padStart(2, "0")}`;
    return path.resolve(process.cwd(), "exports", `${auditId}-${stamp}`);
  }, [auditId]);
  const [dir, setDir] = useState<string>(defaultDir);
  const [zipName, setZipName] = useState<string>(`audit-${auditId}.zip`);
  const [focusedInput, setFocusedInput] = useState<FocusableInput>("dir");

  // Navigate between inputs with Tab
  useInput((input, key) => {
    if (key.tab) {
      const inputs: FocusableInput[] = ["dir", "structure"];
      if (structure === "separate") inputs.push("prefix");
      inputs.push("zip");
      if (createZip) inputs.push("zipName");
      inputs.push("submit");
      
      const currentIndex = inputs.indexOf(focusedInput);
      const nextIndex = key.shift 
        ? (currentIndex - 1 + inputs.length) % inputs.length
        : (currentIndex + 1) % inputs.length;
      setFocusedInput(inputs[nextIndex]);
    }
  });

  return (
    <Box flexDirection="column">
      <FormSection
        title="📁 Export Configuration"
        subtitle="Configure how your audit evidence will be exported"
      >
        <Box>
          <Text color={theme.colors.primaryLight}>Output directory:</Text>
          <Box
            borderStyle={focusedInput === "dir" ? "double" : "single"}
            borderColor={focusedInput === "dir" ? theme.colors.primary : theme.colors.border}
            paddingX={1}
            marginTop={1}
          >
            {focusedInput === "dir" ? (
              <TextInput
                value={dir}
                onChange={setDir}
                onSubmit={() => setFocusedInput("structure")}
              />
            ) : (
              <Text>{dir}</Text>
            )}
          </Box>
        </Box>

        <Box flexDirection="column" marginTop={2}>
          <Text color={theme.colors.primaryLight}>Folder structure:</Text>
          <Box
            borderStyle={focusedInput === "structure" ? "double" : "single"}
            borderColor={focusedInput === "structure" ? theme.colors.primary : theme.colors.border}
            paddingX={1}
            paddingY={1}
            marginTop={1}
          >
            {focusedInput === "structure" ? (
              <SelectInput
                items={[
                  { label: "Single folder (all files together)", value: "single" },
                  { label: "Separate folder per evidence", value: "separate" }
                ] as any}
                onSelect={(i: any) => {
                  setStructure(i.value);
                  setFocusedInput(structure === "single" && i.value === "separate" ? "prefix" : "zip");
                }}
              />
            ) : (
              <Text>
                {structure === "single" 
                  ? "Single folder (all files together)" 
                  : "Separate folder per evidence"}
              </Text>
            )}
          </Box>
        </Box>

        {structure === "separate" && (
          <Box marginTop={2}>
            <Text color={theme.colors.primaryLight}>Folder prefix:</Text>
            <Box
              borderStyle={focusedInput === "prefix" ? "double" : "single"}
              borderColor={focusedInput === "prefix" ? theme.colors.primary : theme.colors.border}
              paddingX={1}
              marginLeft={1}
            >
              {focusedInput === "prefix" ? (
                <TextInput
                  value={prefix}
                  onChange={setPrefix}
                  onSubmit={() => setFocusedInput("zip")}
                />
              ) : (
                <Text>{prefix}</Text>
              )}
            </Box>
          </Box>
        )}

        <Box flexDirection="column" marginTop={2}>
          <Text color={theme.colors.primaryLight}>Create ZIP archive:</Text>
          <Box
            borderStyle={focusedInput === "zip" ? "double" : "single"}
            borderColor={focusedInput === "zip" ? theme.colors.primary : theme.colors.border}
            paddingX={1}
            paddingY={1}
            marginTop={1}
          >
            {focusedInput === "zip" ? (
              <SelectInput
                items={[
                  { label: "Yes - Create a ZIP file", value: "yes" },
                  { label: "No - Keep files in folder", value: "no" }
                ] as any}
                onSelect={(i: any) => {
                  setCreateZip(i.value === "yes");
                  setFocusedInput(i.value === "yes" ? "zipName" : "submit");
                }}
              />
            ) : (
              <Text>
                {createZip ? "Yes - Create a ZIP file" : "No - Keep files in folder"}
              </Text>
            )}
          </Box>
        </Box>

        {createZip && (
          <Box marginTop={2}>
            <Text color={theme.colors.primaryLight}>ZIP filename:</Text>
            <Box
              borderStyle={focusedInput === "zipName" ? "double" : "single"}
              borderColor={focusedInput === "zipName" ? theme.colors.primary : theme.colors.border}
              paddingX={1}
              marginLeft={1}
            >
              {focusedInput === "zipName" ? (
                <TextInput
                  value={zipName}
                  onChange={setZipName}
                  onSubmit={() => setFocusedInput("submit")}
                />
              ) : (
                <Text>{zipName}</Text>
              )}
            </Box>
          </Box>
        )}

        <Box marginTop={2}>
          <Text color={theme.colors.text} dimColor>
            💡 Use Tab/Shift+Tab to navigate between fields
          </Text>
        </Box>

        <Box
          marginTop={1}
          borderStyle={focusedInput === "submit" ? "double" : "single"}
          borderColor={focusedInput === "submit" ? theme.colors.success : theme.colors.border}
          paddingX={2}
          paddingY={1}
        >
          <Text color={theme.colors.success} bold>
            {focusedInput === "submit" 
              ? "✨ Press Enter to start downloading evidence" 
              : "Navigate here and press Enter to start"}
          </Text>
        </Box>

        {focusedInput === "submit" && (
          <Box marginTop={1}>
            <TextInput
              value=""
              onChange={() => {}}
              onSubmit={() =>
                onSubmit({ 
                  outputDir: dir, 
                  structure, 
                  folderPrefix: structure === "separate" ? prefix : undefined,
                  createZip,
                  zipName: createZip ? zipName : undefined
                })
              }
              focus={true}
            />
          </Box>
        )}
      </FormSection>
    </Box>
  );
}

export default ExportOptions;


