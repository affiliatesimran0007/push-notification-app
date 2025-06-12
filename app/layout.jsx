import './globals.css'

export const metadata = {
  title: 'Push Notification App',
  description: 'Comprehensive push notification platform',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}