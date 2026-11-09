const { TestEnvironment } = require('jest-environment-jsdom');

/**
 * jsdom doesn't implement the Fetch API, but React Router (navigation requests)
 * and RTK Query (fetchBaseQuery) depend on it. This exposes Node's built-in
 * implementations inside the jsdom sandbox.
 */
class JsdomWithFetchEnvironment extends TestEnvironment {
  constructor(...args) {
    super(...args);
    for (const key of [
      'fetch', 'Request', 'Response', 'Headers', 'FormData', 'AbortController', 'AbortSignal',
      'TextEncoder', 'TextDecoder', 'ReadableStream', 'TransformStream', 'WritableStream',
      'structuredClone', 'BroadcastChannel',
    ]) {
      if (globalThis[key] !== undefined) this.global[key] = globalThis[key];
    }
  }
}

module.exports = JsdomWithFetchEnvironment;
