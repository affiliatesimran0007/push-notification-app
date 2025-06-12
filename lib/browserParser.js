// Parse user agent string to extract browser, version, OS, and device info
export function parseBrowserInfo(userAgent) {
  if (!userAgent) {
    return {
      browser: 'unknown',
      version: 'unknown',
      os: 'unknown',
      device: 'desktop'
    }
  }

  let browser = 'unknown'
  let version = 'unknown'
  let os = 'unknown'
  let device = 'desktop'

  // Browser detection
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    browser = 'Chrome'
    const match = userAgent.match(/Chrome\/(\d+)/)
    if (match) version = match[1]
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    browser = 'Safari'
    const match = userAgent.match(/Version\/(\d+)/)
    if (match) version = match[1]
  } else if (userAgent.includes('Firefox')) {
    browser = 'Firefox'
    const match = userAgent.match(/Firefox\/(\d+)/)
    if (match) version = match[1]
  } else if (userAgent.includes('Edg')) {
    browser = 'Edge'
    const match = userAgent.match(/Edg\/(\d+)/)
    if (match) version = match[1]
  } else if (userAgent.includes('Opera') || userAgent.includes('OPR')) {
    browser = 'Opera'
    const match = userAgent.match(/(?:Opera|OPR)\/(\d+)/)
    if (match) version = match[1]
  }

  // OS detection
  if (userAgent.includes('Windows')) {
    os = 'Windows'
    if (userAgent.includes('Windows NT 10.0')) os = 'Windows 10'
    else if (userAgent.includes('Windows NT 11.0')) os = 'Windows 11'
  } else if (userAgent.includes('Mac OS X')) {
    os = 'macOS'
  } else if (userAgent.includes('Linux')) {
    os = 'Linux'
  } else if (userAgent.includes('Android')) {
    os = 'Android'
  } else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    os = 'iOS'
  }

  // Device detection
  if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
    device = 'mobile'
  } else if (userAgent.includes('Tablet') || userAgent.includes('iPad')) {
    device = 'tablet'
  }

  return {
    browser,
    version,
    os,
    device
  }
}