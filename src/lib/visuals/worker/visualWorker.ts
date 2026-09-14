import { VisualWorkerRuntime } from './visualWorkerRuntime';
import type { HostToWorkerMessage, WorkerToHostMessage } from '../protocol';

// Locally shadows the ambient DOM `self` (this file is a module, so the
// declaration is scoped here) with just the worker-global members this file
// needs, rather than pulling in the `webworker` lib — which conflicts with
// the `dom` lib this project's single tsconfig already uses everywhere else.
declare const self: {
  onmessage: ((event: MessageEvent<HostToWorkerMessage>) => void) | null;
  postMessage(message: WorkerToHostMessage): void;
};

const runtime = new VisualWorkerRuntime((message) => self.postMessage(message));

self.onmessage = (event) => runtime.handleMessage(event.data);
