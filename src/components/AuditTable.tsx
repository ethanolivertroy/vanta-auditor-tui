import React, { useState } from 'react';
import { Box, Text } from 'ink';
import { SelectInput } from '../lib/inkModules.js';
import figures from 'figures';
import { theme } from '../theme.js';

export interface AuditItem {
  id: string;
  name?: string;
  framework?: string;
  status?: string;
}

interface AuditTableProps {
  audits: AuditItem[];
  onSelect: (auditId: string) => void;
}

export function AuditTable({ audits, onSelect }: AuditTableProps) {
  const [useTable] = useState(true); // Can toggle between table and list view
  
  if (audits.length === 0) {
    return (
      <Box flexDirection="column" paddingY={1}>
        <Text color={theme.colors.warning}>
          {figures.warning} No audits found
        </Text>
        <Text color={theme.colors.dim}>
          Please check your credentials and try again.
        </Text>
      </Box>
    );
  }
  
  if (useTable && audits.length > 1) {
    // Custom table view for multiple audits
    return (
      <Box flexDirection="column" paddingY={1}>
        <Text color={theme.colors.primary} bold>
          🦙 Select an audit to export:
        </Text>
        
        {/* Table Header */}
        <Box marginTop={1} marginBottom={1}>
          <Box width={30}>
            <Text color={theme.colors.dim} bold>Client</Text>
          </Box>
          <Box width={20}>
            <Text color={theme.colors.dim} bold>Framework</Text>
          </Box>
          <Box width={15}>
            <Text color={theme.colors.dim} bold>Status</Text>
          </Box>
        </Box>
        
        {/* Table Separator */}
        <Text color={theme.colors.dim}>{'─'.repeat(65)}</Text>
        
        {/* Table Rows */}
        {audits.map((audit) => (
          <Box key={audit.id} marginY={0}>
            <Box width={30}>
              <Text color={theme.colors.text}>
                {audit.name?.split(' - ')[0] || 'Unknown'}
              </Text>
            </Box>
            <Box width={20}>
              <Text color={theme.colors.text}>
                {audit.framework || '-'}
              </Text>
            </Box>
            <Box width={15}>
              <Text color={getStatusColor(audit.status)}>
                {getStatusDisplay(audit.status)}
              </Text>
            </Box>
          </Box>
        ))}
        
        <Box flexDirection="column" marginTop={1}>
          <Text color={theme.colors.dim}>
            Use arrow keys to navigate, Enter to select:
          </Text>
          <SelectInput
            items={audits.map(a => ({
              label: formatAuditLabel(a),
              value: a.id
            }))}
            onSelect={item => onSelect(item.value)}
          />
        </Box>
      </Box>
    );
  }
  
  // List view (fallback or single audit)
  return (
    <Box flexDirection="column" paddingY={1}>
      <Text color={theme.colors.purple} bold>
        🦙 Select an audit to export:
      </Text>
      <Box marginTop={1}>
        <SelectInput
          items={audits.map(audit => ({
            label: formatAuditLabel(audit),
            value: audit.id
          }))}
          onSelect={item => onSelect(item.value)}
        />
      </Box>
    </Box>
  );
}

function getStatusDisplay(status?: string): string {
  if (!status) return '-';
  
  switch (status.toLowerCase()) {
    case 'active':
      return `${figures.circle} Active`;
    case 'completed':
      return `${figures.tick} Completed`;
    case 'expired':
      return `${figures.cross} Expired`;
    default:
      return status;
  }
}

function getStatusColor(status?: string): string {
  if (!status) return theme.colors.dim;
  
  switch (status.toLowerCase()) {
    case 'active':
      return theme.colors.success;
    case 'completed':
      return theme.colors.primary;
    case 'expired':
      return theme.colors.error;
    default:
      return theme.colors.text;
  }
}

function formatAuditLabel(audit: AuditItem): string {
  const parts = [];
  
  // Add status indicator
  if (audit.status) {
    switch (audit.status.toLowerCase()) {
      case 'active':
        parts.push(`[${figures.circle}]`);
        break;
      case 'completed':
        parts.push(`[${figures.tick}]`);
        break;
      case 'expired':
        parts.push(`[${figures.cross}]`);
        break;
    }
  }
  
  // Add name or ID
  parts.push(audit.name || audit.id);
  
  return parts.join(' ');
}

export default AuditTable;