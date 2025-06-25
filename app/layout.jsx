import './globals.css'
import { AuthProvider } from './contexts/AuthContext'

export const metadata = {
  title: 'Push Notification App',
  description: 'Internal push notification platform',
  manifest: '/manifest.json',
  themeColor: '#2196f3',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      'max-video-preview': -1,
      'max-image-preview': 'none',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}