import type { HostToWorkerMessage, LayerInitPayload, WorkerToHostMessage } from './protocol';

export interface WorkerLike {
  postMessage(message: unknown, transfer?: Transferable[]): void;
  addEventListener(type: 'message', listener: (event: MessageEvent<WorkerToHostMessage>) => void): void;
  removeEventListener(type: 'message', listener: (event: MessageEvent<WorkerToHostMessage>) => void): void;
  terminate?(): void;
}

export type WorkerFactory = () => WorkerLike;

function createDefaultWorker(): WorkerLike {
  return new Worker(new URL('./worker/visualWorker.ts', import.meta.url), { type: 'module' });
}

/**
 * Host-side handle to the single shared visuals worker. One `Worker` backs
 * every `OffscreenWorkerBackend` layer on the page (starfield, particle
 * network, matrix rain, cursor trail) — spinning up a worker per effect would
 * cost more startup/thread overhead than it isolates.
 */
export class VisualWorkerClient {
  private worker: WorkerLike | null = null;

  constructor(private workerFactory: WorkerFactory = createDefaultWorker) {}

  private ensureWorker(): WorkerLike {
    if (!this.worker) {
      const worker = this.workerFactory();
      worker.addEventListener('message', (event) => {
        if (event.data?.type === 'error') {
          console.error('[visuals worker]', event.data.message);
        }
      });
      this.worker = worker;
    }
    return this.worker;
  }

  initLayer(payload: LayerInitPayload, transfer: Transferable[]): void {
    const message: HostToWorkerMessage = { type: 'init', payload };
    this.ensureWorker().postMessage(message, transfer);
  }

  send(message: Exclude<HostToWorkerMessage, { type: 'init' }>): void {
    this.worker?.postMessage(message);
  }
}

let singleton: VisualWorkerClient | null = null;

export function getVisualWorkerClient(): VisualWorkerClient {
  if (!singleton) singleton = new VisualWorkerClient();
  return singleton;
}
