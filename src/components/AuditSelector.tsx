import React from "react";
import { AuditTable } from "./AuditTable.js";

export interface AuditItem {
  id: string;
  name: string;
  framework?: string;
  status?: string;
}

export function AuditSelector({
  audits,
  onSelect
}: {
  audits: AuditItem[];
  onSelect: (auditId: string) => void;
}) {
  return <AuditTable audits={audits} onSelect={onSelect} />;
}

export default AuditSelector;


