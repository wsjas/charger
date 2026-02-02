/* simple service worker for offline cache */
const CACHE = "site-cache-v1";
const PRECACHE = ["./","./index.html","./404.html","./manifest.json"];

self.addEventListener("install", (e)=>{
  e.waitUntil((async ()=>{
    const c = await caches.open(CACHE);
    await c.addAll(PRECACHE);
    self.skipWaiting();
  })());
});

self.addEventListener("activate", (e)=>{
  e.waitUntil((async ()=>{
    const keys = await caches.keys();
    await Promise.all(keys.map(k => (k!==CACHE) ? caches.delete(k) : Promise.resolve()));
    self.clients.claim();
  })());
});

self.addEventListener("fetch", (e)=>{
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Only same-origin
  if (url.origin !== self.location.origin) return;

  e.respondWith((async ()=>{
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req, {ignoreSearch:true});
    if (cached) return cached;
    try{
      const res = await fetch(req);
      // cache successful responses
      if (res && res.status===200 && (res.type==="basic" || res.type==="cors")){
        cache.put(req, res.clone());
      }
      return res;
    }catch(err){
      // fallback to shell
      return (await cache.match("./index.html")) || Response.error();
    }
  })());
});
