const CACHE_NAME = "routineos-v1"
const PRE_CACHE = ["/", "/manifest.webmanifest", "/icons/icon-192.svg", "/icons/icon-512.svg"]

self.addEventListener("install", (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => {
			return cache.addAll(PRE_CACHE)
		}),
	)
	self.skipWaiting()
})

self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches.keys().then((keys) => {
			return Promise.all(
				keys
					.filter((key) => key !== CACHE_NAME)
					.map((key) => {
						return caches.delete(key)
					}),
			)
		}),
	)
	self.clients.claim()
})

self.addEventListener("fetch", (event) => {
	if (event.request.method !== "GET") {
		return
	}

	const url = new URL(event.request.url)
	if (url.origin !== self.location.origin) {
		return
	}

	if (event.request.mode === "navigate") {
		event.respondWith(
			fetch(event.request)
				.then((response) => {
					const cloned = response.clone()
					void caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned))
					return response
				})
				.catch(async () => {
					const cached = await caches.match(event.request)
					if (cached) {
						return cached
					}
					return caches.match("/")
				}),
		)
		return
	}

	event.respondWith(
		caches.match(event.request).then((cached) => {
			if (cached) {
				return cached
			}

			return fetch(event.request).then((response) => {
				const cloned = response.clone()
				void caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned))
				return response
			})
		}),
	)
})
