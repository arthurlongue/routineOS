import type { Metadata, Viewport } from "next"
import { JetBrains_Mono, Manrope } from "next/font/google"

import { RegisterServiceWorker } from "@/components/pwa/register-sw"

import "./globals.css"

const manrope = Manrope({
	subsets: ["latin"],
	variable: "--font-sans",
})

const jetbrainsMono = JetBrains_Mono({
	subsets: ["latin"],
	variable: "--font-mono",
})

export const metadata: Metadata = {
	title: "RoutineOS",
	description: "Rastreador de rotina com foco em TDAH",
	applicationName: "RoutineOS",
	manifest: "/manifest.webmanifest",
}

export const viewport: Viewport = {
	themeColor: "#09090b",
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html lang="pt-BR" data-theme="night">
			<body className={`${manrope.variable} ${jetbrainsMono.variable} antialiased`}>
				<RegisterServiceWorker />
				{children}
			</body>
		</html>
	)
}
