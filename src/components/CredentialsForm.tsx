import React, { useEffect, useRef, useState } from "react";
import { Box, Text } from "ink";
import { TextInput, SelectInput, Gradient } from "../lib/inkModules.js";
import { theme } from "../theme.js";
import { BorderedInput } from "./ui/BorderedInput.js";
import { FormSection } from "./ui/FormSection.js";
import { StepIndicator } from "./ui/StepIndicator.js";

export type Region = "us" | "eu" | "aus" | "custom";

export interface CredentialsResult {
  // bearer token path
  token?: string;
  // oauth client credentials path
  clientId?: string;
  clientSecret?: string;
  scope?: string;
  region: Region;
  serverURL?: string;
  debug: boolean;
}

export function CredentialsForm({ onSubmit }: { onSubmit: (r: CredentialsResult) => void }) {
  const [mode, setMode] = useState<"token" | "oauth">("oauth");
  const [token, setToken] = useState<string>("");
  const [clientId, setClientId] = useState<string>("");
  const [clientSecret, setClientSecret] = useState<string>("");
  const [scope, setScope] = useState<string>("auditor-api.audit:read auditor-api.auditor:read");
  const [region, setRegion] = useState<Region>("us");
  const [serverURL, setServerURL] = useState<string>("");
  const [debug, setDebug] = useState<boolean>(process.argv.includes("--verbose"));
  const [stage, setStage] = useState<
    | "mode"
    | "token"
    | "oauthClientId"
    | "oauthClientSecret"
    | "oauthScope"
    | "region"
    | "custom"
    | "done"
  >("mode");

  useEffect(() => {
    // focus order managed by stage
  }, [stage]);

  // Submit once stage transitions to done. This must be declared before any early returns
  // so that hook order remains stable across renders.
  const submittedRef = useRef(false);
  useEffect(() => {
    if (stage === "done" && !submittedRef.current) {
      submittedRef.current = true;
      onSubmit({
        token: mode === "token" ? token : undefined,
        clientId: mode === "oauth" ? clientId : undefined,
        clientSecret: mode === "oauth" ? clientSecret : undefined,
        scope: mode === "oauth" ? scope : undefined,
        region,
        serverURL: serverURL || undefined,
        debug
      });
    }
  }, [stage, mode, token, clientId, clientSecret, scope, region, serverURL, debug]);

  // Auto-advance if env vars present for faster debugging
  useEffect(() => {
    if (stage !== "mode") return;
    if (token) {
      setMode("token");
      setStage("region");
    } else if (clientId && clientSecret) {
      setMode("oauth");
      setStage("region");
    }
  }, [stage]);

  if (stage === "mode") {
    const items = [
      { label: "OAuth client credentials", value: "oauth" },
      { label: "Bearer token", value: "token" }
    ] as const;
    return (
      <FormSection
        title="🦙 Welcome to Vanta Auditor TUI!"
        subtitle="Let's get your audit evidence exported"
        borderStyle="double"
      >
        <StepIndicator
          steps={[
            { label: "Auth Method", status: "active" },
            { label: "Credentials", status: "pending" },
            { label: "Region", status: "pending" }
          ]}
        />
        <Box flexDirection="column" marginTop={1}>
          <Text color={theme.colors.primaryLight}>Choose authentication method:</Text>
          <Box
            borderStyle="single"
            borderColor={theme.colors.primary}
            paddingX={1}
            paddingY={1}
            marginTop={1}
          >
            <SelectInput
              items={items as any}
              onSelect={(i: any) => {
                setMode(i.value);
                setStage(i.value === "oauth" ? "oauthClientId" : "token");
              }}
            />
          </Box>
        </Box>
      </FormSection>
    );
  }

  if (stage === "token") {
    return (
      <FormSection
        title="🔐 Bearer Token Authentication"
        subtitle="Enter your Vanta API bearer token"
      >
        <StepIndicator
          steps={[
            { label: "Auth Method", status: "completed" },
            { label: "API Token", status: "active" },
            { label: "Region", status: "pending" }
          ]}
        />
        <BorderedInput
          label="API Token:"
          value={token}
          onChange={setToken}
          mask="*"
          placeholder="vat_..."
          onSubmit={() => setStage("region")}
          width={50}
        />
      </FormSection>
    );
  }

  if (stage === "oauthClientId") {
    return (
      <FormSection
        title="🔐 OAuth Client Credentials"
        subtitle="Step 1 of 3: Enter your Client ID"
      >
        <StepIndicator
          steps={[
            { label: "Auth Method", status: "completed" },
            { label: "Client ID", status: "active" },
            { label: "Client Secret", status: "pending" },
            { label: "Scopes", status: "pending" },
            { label: "Region", status: "pending" }
          ]}
        />
        <BorderedInput
          label="Client ID:"
          value={clientId}
          onChange={setClientId}
          onSubmit={() => setStage("oauthClientSecret")}
          placeholder="Enter your OAuth client ID"
          width={50}
        />
      </FormSection>
    );
  }

  if (stage === "oauthClientSecret") {
    return (
      <FormSection
        title="🔐 OAuth Client Credentials"
        subtitle="Step 2 of 3: Enter your Client Secret"
      >
        <StepIndicator
          steps={[
            { label: "Auth Method", status: "completed" },
            { label: "Client ID", status: "completed" },
            { label: "Client Secret", status: "active" },
            { label: "Scopes", status: "pending" },
            { label: "Region", status: "pending" }
          ]}
        />
        <BorderedInput
          label="Client Secret:"
          value={clientSecret}
          onChange={setClientSecret}
          mask="*"
          onSubmit={() => setStage("oauthScope")}
          placeholder="Enter your OAuth client secret"
          width={50}
        />
      </FormSection>
    );
  }

  if (stage === "oauthScope") {
    return (
      <FormSection
        title="🔐 OAuth Client Credentials"
        subtitle="Step 3 of 3: Specify API scopes"
      >
        <StepIndicator
          steps={[
            { label: "Auth Method", status: "completed" },
            { label: "Client ID", status: "completed" },
            { label: "Client Secret", status: "completed" },
            { label: "Scopes", status: "active" },
            { label: "Region", status: "pending" }
          ]}
        />
        <BorderedInput
          label="Scopes (space-separated):"
          value={scope}
          onChange={setScope}
          onSubmit={() => setStage("region")}
          placeholder="auditor-api.audit:read auditor-api.auditor:read"
          width={60}
        />
      </FormSection>
    );
  }

  if (stage === "region") {
    const items = [
      { label: "US", value: "us" },
      { label: "EU", value: "eu" },
      { label: "AUS", value: "aus" },
      { label: "Custom URL", value: "custom" }
    ] as const;
    return (
      <FormSection
        title="🌎 Select Your Vanta Region"
        subtitle="Choose the region where your Vanta instance is hosted"
      >
        <Box
          borderStyle="single"
          borderColor={theme.colors.primary}
          paddingX={1}
          paddingY={1}
        >
          <SelectInput
            items={items as any}
            onSelect={(i: any) => {
              setRegion(i.value as Region);
              if (i.value === "custom") setStage("custom");
              else setStage("done");
            }}
          />
        </Box>
      </FormSection>
    );
  }

  if (stage === "custom") {
    return (
      <FormSection
        title="🌐 Custom Server URL"
        subtitle="Enter the full URL for your Vanta API endpoint"
      >
        <BorderedInput
          label="Server URL:"
          value={serverURL}
          onChange={setServerURL}
          placeholder="https://api.aus.vanta.com/v1"
          onSubmit={() => setStage("done")}
          width={60}
        />
      </FormSection>
    );
  }

  if (stage === "done") return null;

  return null;
}

export default CredentialsForm;


