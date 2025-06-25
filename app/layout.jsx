import './globals.css'
import { AuthProvider } from './contexts/AuthContext'

export const metadata = {
  title: 'Push Notification App',
  description: 'Comprehensive push notification platform',
  manifest: '/manifest.json',
  themeColor: '#2196f3',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
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