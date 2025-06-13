import { useState, useEffect, useCallback, useRef } from 'react'

export function useApi(url, options = {}) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Use refs to avoid dependency issues
  const urlRef = useRef(url)
  const optionsRef = useRef(options)
  
  // Update refs when values change
  useEffect(() => {
    urlRef.current = url
  }, [url])
  
  useEffect(() => {
    optionsRef.current = options
  }, [options])

  const fetchData = useCallback(async () => {
    const currentUrl = urlRef.current
    const currentOptions = optionsRef.current
    
    if (!currentUrl) return
    
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(currentUrl, {
        headers: {
          'Content-Type': 'application/json',
          ...currentOptions.headers
        },
        ...currentOptions
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err.message)
      console.error('API Error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Only fetch if URL is provided
    if (url) {
      fetchData()
    }
  }, [url]) // Only refetch when URL changes

  const refetch = () => {
    fetchData()
  }

  return { data, loading, error, refetch }
}

export async function apiCall(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    })
    
    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`
      try {
        const error = await response.json()
        errorMessage = error.details || error.error || errorMessage
      } catch (e) {
        // Response might not be JSON
        console.error('Failed to parse error response:', e)
      }
      throw new Error(errorMessage)
    }
    
    return await response.json()
  } catch (error) {
    console.error('API Call Error:', error)
    throw error
  }
}