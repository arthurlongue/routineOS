import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: "RoutineOS",
		short_name: "RoutineOS",
		description: "Acompanhamento de rotina com foco em TDAH",
		start_url: "/",
		display: "standalone",
		background_color: "#09090b",
		theme_color: "#09090b",
		orientation: "portrait",
		icons: [
			{
				src: "/icons/icon-192.svg",
				sizes: "192x192",
				type: "image/svg+xml",
				purpose: "any",
			},
			{
				src: "/icons/icon-512.svg",
				sizes: "512x512",
				type: "image/svg+xml",
				purpose: "maskable",
			},
		],
	}
}
