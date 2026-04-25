# /server/integrations

Conteneur futur des intégrations externes (Zoho CRM/Books/Inventory/Creator,
Google Drive, etc.).

**Règle MVP** : aucune intégration n'est encore implémentée. Le contrat
ci-dessous définit la forme attendue des futurs adapters.

## Convention

Chaque sous-dossier = un provider (`zoho/`, `drive/`, ...). Il expose :

- un `client.ts` (HTTP/SDK, lecture des secrets via `getEnv()`),
- un ou plusieurs `*Service.ts` (sync/import/push), retournant
  un `IntegrationSyncRun` enrichi de compteurs et d'erreurs,
- jamais de secrets en dur ; tout passe par `.env`.

## Persistance commune

- `ExternalReference` pour mapper interne ↔ externe,
- `IntegrationSyncRun` pour tracer les exécutions,
- `IntegrationSyncError` pour stocker les erreurs item par item.
