const V = 'ciclo-2026.10.30'; 

const CORE = [
  './', 
  'index.html', 
  'manifest.webmanifest', 
  'icons/icon.svg',      // Garante que este nome bate certo com o teu ficheiro
  'icons/icon-192.png', 
  'icons/icon-512.png', 
  'libs/dexie.min.js', 
  'libs/chart.umd.js'
];

// Instalação: pré-carrega todos os assets críticos
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(V).then(c => c.addAll(CORE)).then(() => self.skipWaiting())
  );
});

// Ativação: limpa caches antigas automaticamente
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(k => Promise.all(
      k.filter(x => x !== V).map(x => caches.delete(x))
    )).then(() => self.clients.claim())
  );
});

// Fetch: Estratégia híbrida inteligente
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  
  const u = new URL(r.url);
  if (u.origin !== location.origin) return;
  
  // Detecta se é uma navegação/página HTML
  const isHtml = r.mode === 'navigate' || u.pathname.endsWith('.html') || u.pathname.endsWith('/');
  
  if (isHtml) {
    // 🌐 NETWORK FIRST: Tenta sempre buscar a versão mais recente do servidor
    // Se falhar (offline), usa a última cópia guardada em cache
    e.respondWith(
      fetch(r, { cache: 'no-cache' })
        .then(res => {
          const c = res.clone();
          caches.open(V).then(x => x.put(r, c));
          return res;
        })
        .catch(() => caches.match(r).then(m => m || caches.match('index.html')))
    );
    return;
  }
  
  // 💾 CACHE FIRST: Para ícones, JS e CSS, serve instantaneamente do telemóvel
  e.respondWith(
    caches.match(r).then(m => m || fetch(r).then(res => {
      const c = res.clone();
      caches.open(V).then(x => x.put(r, c));
      return res;
    }))
  );
});
