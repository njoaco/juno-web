import { Geist, Azeret_Mono as Geist_Mono } from "next/font/google"
import { Github } from "lucide-react"
import Link from "next/link"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata = {
  title: "Juno Model SSE",
  description: "Train and predict using Juno Model",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans bg-gray-900 text-gray-100`}>
        {children}
        <Link
          href="https://github.com/yourusername/your-repo"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-700 text-gray-200 p-2 rounded-full shadow-lg hover:bg-gray-600 transition-colors duration-300"
        >
          <Github size={24} />
        </Link>
      </body>
    </html>
  )
}