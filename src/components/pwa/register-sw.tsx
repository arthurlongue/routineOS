"use client"

import { useEffect } from "react"

export function RegisterServiceWorker() {
	useEffect(() => {
		if (typeof window !== "undefined" && "serviceWorker" in navigator) {
			navigator.serviceWorker.register("/sw.js").catch(() => {
				// Silently fail as per PWA best practices in simple setups
			})
		}
	}, [])

	return null
}
