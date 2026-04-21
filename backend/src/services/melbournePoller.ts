import * as MelbourneService from './melbourne.service';

const POLL_INTERVAL_MS = 60_000; // 1 minute

export function startMelbournePoller() {
  MelbourneService.fetchAndSync().catch(console.error);
  setInterval(() => MelbourneService.fetchAndSync().catch(console.error), POLL_INTERVAL_MS);
}
