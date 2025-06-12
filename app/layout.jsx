import './globals.css'
import ServiceWorkerProvider from './components/ServiceWorkerProvider'

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
        <ServiceWorkerProvider />
        {children}
      </body>
    </html>
  )
}