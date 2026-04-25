/**
 * Contrats partagés entre toutes les intégrations externes.
 */
import type { ExternalProvider } from '@prisma/client';

export interface IntegrationContext {
  triggeredBy?: string | null;
  signal?: AbortSignal;
}

export interface IntegrationJobResult {
  provider: ExternalProvider;
  job: string;
  itemsRead: number;
  itemsWritten: number;
  itemsFailed: number;
}
