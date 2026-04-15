// Polyfill Node 18+ Web APIs into the Jest VM sandbox so MSW v2 can load.
// This file runs via `setupFiles` (before module evaluation).
const nodeGlobals = [
  'fetch',
  'Request',
  'Response',
  'Headers',
  'ReadableStream',
  'WritableStream',
  'TransformStream',
  'TextEncoder',
  'TextDecoder',
  'BroadcastChannel',
  'MessageChannel',
  'MessageEvent',
  'FormData',
  'Blob',
  'File',
] as const

for (const name of nodeGlobals) {
  if (typeof (global as Record<string, unknown>)[name] === 'undefined') {
    ;(global as Record<string, unknown>)[name] = (globalThis as Record<string, unknown>)[name]
  }
}
