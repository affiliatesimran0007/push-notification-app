/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // Allow loading push-widget.js from any domain
        source: '/js/push-widget.js',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET'
          }
        ]
      },
      {
        // Allow API calls from any domain
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, ngrok-skip-browser-warning'
          }
        ]
      },
      {
        // Allow bot-check page in iframe
        source: '/landing/bot-check',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL'
          }
        ]
      }
    ]
  }
}

export default nextConfig