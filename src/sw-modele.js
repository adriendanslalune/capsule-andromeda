// Le service hors ligne de la version installable (étape 12, accord d'Adrien du 22/10/2026). Vite le recopie en sw.js à
// chaque construction, la version du jeu à la place de __VERSION__ : un nouveau jeu donne un nouveau service, qui
// remplace l'ancien et vide ses caches.
// - la page (et ses navigations) : le réseau d'abord, la copie en cache si on est hors ligne ;
// - les fichiers du jeu (assets/…, leurs noms changent à chaque version) : le cache d'abord ;
// - les polices de Google : la copie en cache tout de suite, rafraîchie en douce ;
// - version.json n'est jamais servi par le cache (c'est lui qui annonce les mises à jour).
const CACHE = 'andromeda-__VERSION__'

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const cle of await caches.keys()) if (cle !== CACHE) await caches.delete(cle)
    await self.clients.claim()
  })())
})

const garder = async (requete, reponse) => {
  if (reponse && (reponse.ok || reponse.type === 'opaque')) {
    const cache = await caches.open(CACHE)
    await cache.put(requete, reponse.clone())
  }
  return reponse
}

self.addEventListener('fetch', (e) => {
  const requete = e.request
  if (requete.method !== 'GET') return
  const adresse = new URL(requete.url)
  if (adresse.pathname.endsWith('/version.json')) return
  if (requete.mode === 'navigate') {
    e.respondWith(fetch(requete).then((r) => garder(requete, r)).catch(async () =>
      (await caches.match(requete, { ignoreSearch: true })) ?? (await caches.match('./')) ?? Response.error()))
    return
  }
  if (adresse.hostname === 'fonts.googleapis.com' || adresse.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.match(requete).then((copie) => {
      const frais = fetch(requete).then((r) => garder(requete, r)).catch(() => copie)
      return copie ?? frais
    }))
    return
  }
  if (adresse.origin !== self.location.origin) return
  if (adresse.pathname.includes('/assets/')) {
    e.respondWith(caches.match(requete).then((copie) => copie ?? fetch(requete).then((r) => garder(requete, r))))
    return
  }
  e.respondWith(fetch(requete).then((r) => garder(requete, r)).catch(async () => (await caches.match(requete)) ?? Response.error()))
})
