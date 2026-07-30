/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { defaultCache } from '@serwist/next/worker';
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';
import { Serwist } from 'serwist';

/**
 * Full offline layer (M4): Serwist injects the complete build-asset
 * manifest, so the app shell works offline from install — not just after
 * pages happen to be visited. Key routes (SOS above all) are precached
 * explicitly; everything else uses Serwist's Next-tuned runtime caching
 * with /offline as the document fallback.
 */

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}
declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  // The manifest covers build assets + all prerendered routes (Essentials/SOS
  // included); serwist.config.js adds the dynamic /talk/[pack] routes.
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
  fallbacks: {
    entries: [
      {
        url: '/offline',
        matcher({ request }) {
          return request.destination === 'document';
        },
      },
    ],
  },
});

// Clear the pre-Serwist hand-rolled caches (overhear-m0/m3 era).
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k.startsWith('overhear-m')).map((k) => caches.delete(k))),
      ),
  );
});

serwist.addEventListeners();
