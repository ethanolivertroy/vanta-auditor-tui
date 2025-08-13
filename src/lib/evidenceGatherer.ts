export interface GatherProgress {
  phase: 'discovering' | 'processing' | 'complete';
  current: number;
  total: number;
  message?: string;
}

export async function gatherEvidenceItems(
  sdk: any, 
  auditId: string, 
  verbose: boolean = false,
  onProgress?: (progress: GatherProgress) => void
): Promise<Array<{ downloadUrl: string; fileName?: string; evidenceKey?: string }>> {
  const items: Array<{ downloadUrl: string; fileName?: string; evidenceKey?: string }> = [];
  
  // Verbose logging handled by caller
  
  try {
    // Step 1: Get all evidence items for the audit
    onProgress?.({
      phase: 'discovering',
      current: 0,
      total: 0,
      message: 'Discovering evidence items...'
    });
    
    let cursor: string | undefined = undefined;
    const allEvidence: any[] = [];
    
    for (let page = 0; page < 100; page++) {
      // Page fetching in progress
      
      const response: any = await sdk.audits.listEvidence({
        auditId,
        pageSize: 100,
        pageCursor: cursor
      });
      
      const evidenceList = response?.results?.data || [];
      allEvidence.push(...evidenceList);
      
      onProgress?.({
        phase: 'discovering',
        current: allEvidence.length,
        total: allEvidence.length,
        message: `Found ${allEvidence.length} evidence items...`
      });
      
      // Evidence items collected from page
      
      // Check for next page
      const pageInfo: any = response?.results?.pageInfo;
      if (pageInfo?.hasNextPage && pageInfo?.endCursor) {
        cursor = pageInfo.endCursor;
      } else {
        break;
      }
    }
    
    // All evidence items discovered
    
    // Step 2: For each evidence item, get its download URLs
    for (let i = 0; i < allEvidence.length; i++) {
      const evidence = allEvidence[i];
      
      onProgress?.({
        phase: 'processing',
        current: i + 1,
        total: allEvidence.length,
        message: `Processing ${evidence.name || 'evidence'}...`
      });
      // Processing evidence item
      
      try {
        // Use getEvidenceUrls with the evidence ID
        const urlsResponse = await sdk.audits.getEvidenceUrls({
          auditId,
          auditEvidenceId: evidence.id,
          pageSize: 100
        });
        
        const urls = urlsResponse?.results?.data || [];
        
        // URLs retrieved for evidence
        
        // Add each URL to our items list
        for (const urlItem of urls) {
          if (urlItem.url && urlItem.isDownloadable !== false) {
            // Ensure we have a proper filename with extension
            let fileName = urlItem.filename || urlItem.id || evidence.name || 'document';
            
            // If the filename doesn't have an extension, try to infer one
            if (!fileName.includes('.')) {
              // Try to infer from the URL or evidence type
              const urlLower = urlItem.url?.toLowerCase() || '';
              
              if (urlLower.includes('.pdf')) {
                fileName += '.pdf';
              } else if (urlLower.includes('.json') || urlItem.id?.endsWith('.json')) {
                fileName += '.json';
              } else if (urlLower.includes('.docx')) {
                fileName += '.docx';
              } else if (urlLower.includes('.xlsx')) {
                fileName += '.xlsx';
              } else if (urlLower.includes('.png') || urlLower.includes('.jpg') || urlLower.includes('.jpeg')) {
                fileName += '.png';
              } else if (evidence.name?.toLowerCase().includes('policy') || 
                         evidence.name?.toLowerCase().includes('handbook') ||
                         evidence.name?.toLowerCase().includes('procedure') ||
                         evidence.name?.toLowerCase().includes('agreement') ||
                         evidence.name?.toLowerCase().includes('document')) {
                fileName += '.pdf'; // Most likely PDF for policy documents
              } else {
                fileName += '.pdf'; // Default to PDF for documents
              }
            }
            
            items.push({
              downloadUrl: urlItem.url,
              fileName: fileName,
              evidenceKey: evidence.id
            });
            
            // URL added to download list
          }
        }
      } catch (error) {
        // Some evidence items might not have URLs, that's okay
        if (verbose) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          // Evidence URLs not available - continuing
        }
      }
    }
    
    onProgress?.({
      phase: 'complete',
      current: items.length,
      total: items.length,
      message: 'Evidence discovery complete'
    });
    
    // Evidence gathering complete
    
  } catch (error) {
    // Error will be propagated to caller
    throw error;
  }
  
  return items;
}