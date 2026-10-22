import { decryptSecret } from './security.js';
import { query } from './db.js';

type Provider = 'slack' | 'teams';
type Integration = { provider: Provider; encrypted_secret: string; destination: string | null; [column: string]: any };

function isAllowedTeamsWebhook(value: string) {
  let u: URL;
  try { u = new URL(value); } catch { return false; }
  if (u.protocol !== 'https:' || u.username || u.password || u.port) return false;
  const host = u.hostname.toLowerCase();
  return host === 'webhook.office.com' || host.endsWith('.webhook.office.com') ||
    host === 'logic.azure.com' || host.endsWith('.logic.azure.com') ||
    host === 'powerplatform.com' || host.endsWith('.powerplatform.com');
}

async function deliver(provider: Provider, secret: string, destination: string | null, message: string) {
  if (provider === 'slack') {
    if (!destination || !/^[A-Z0-9_-]{1,100}$/i.test(destination)) throw new Error('Slack destination must be a channel ID');
    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + secret, 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ channel: destination, text: message, unfurl_links: false, unfurl_media: false }),
      signal: AbortSignal.timeout(8000)
    });
    const data = await response.json() as { ok?: boolean; error?: string };
    if (!response.ok || !data.ok) throw new Error('Slack delivery failed: ' + (data.error ?? response.status));
    return;
  }
  if (!isAllowedTeamsWebhook(secret)) throw new Error('Teams webhook must use an approved Microsoft HTTPS webhook host');
  const response = await fetch(secret, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ text: message }),
    signal: AbortSignal.timeout(8000),
    redirect: 'error'
  });
  if (!response.ok) throw new Error('Teams delivery failed with HTTP ' + response.status);
}

export async function sendIntegrationMessage(provider: Provider, secret: string, destination: string | null, message: string) {
  if (!message.trim() || message.length > 3000) throw new Error('Message must be 1–3000 characters');
  await deliver(provider, secret, destination, message);
}

export async function sendWorkspaceIntegrationMessages(organizationId: string, message: string) {
  const rows = await query<Integration>(
    'SELECT provider, encrypted_secret, destination FROM integrations WHERE organization_id=$1 AND enabled=true ORDER BY provider',
    [organizationId]
  );
  const failures: string[] = [];
  for (const integration of rows.rows) {
    try {
      await sendIntegrationMessage(integration.provider, decryptSecret(integration.encrypted_secret), integration.destination, message);
    } catch (error) {
      failures.push(integration.provider + ': ' + (error instanceof Error ? error.message : 'delivery failed'));
    }
  }
  if (failures.length) throw new Error(failures.join('; ').slice(0, 500));
  return rows.rowCount ?? 0;
}
