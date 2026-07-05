const CACHE_NAME = 'waktu-murottal-v1';
const urlsToCache = [
  './',
  './index.html',
  'https://iili.io/CYin1Sf.png' // Ikon aplikasi
];

// Install Service Worker dan simpan cache awal
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// Hapus cache lama jika ada update
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Strategi pengambilan data (Fetch)
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Pengecualian 1: Abaikan API Aladhan (Jadwal Sholat biarkan load dari internet jika online, atau gagal jika offline agar pakai data localStorage)
  // Pengecualian 2: Abaikan Dropbox (Audio Mode Default harus pakai internet)
  if (url.hostname.includes('api.aladhan.com') || url.hostname.includes('dropbox.com')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Untuk file lainnya (HTML, CSS, JS, Font, Icon Lucide), gunakan strategi Cache First
  event.respondWith(
    caches.match(event.request).then(response => {
      // Jika ada di cache, gunakan cache. Jika tidak, ambil dari internet.
      return response || fetch(event.request).then(fetchResponse => {
        // Simpan hasil dari internet ke cache agar bisa dipakai offline nanti
        return caches.open(CACHE_NAME).then(cache => {
          if (fetchResponse.status === 200) {
            cache.put(event.request, fetchResponse.clone());
          }
          return fetchResponse;
        });
      });
    }).catch(() => {
      // Jika offline dan tidak ada di cache, abaikan saja
      console.log('Gagal memuat aset, kemungkinan offline.');
    })
  );
});
