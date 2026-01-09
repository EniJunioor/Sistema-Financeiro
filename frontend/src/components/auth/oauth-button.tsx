"use client"

import { Button } from "@/components/ui/button"
import { LoadingButton } from "@/components/ui/loading-button"
import { oauthUrls } from "@/lib/auth-api"
import { useState } from "react"

interface OAuthButtonProps {
  provider: 'google' | 'microsoft' | 'facebook' | 'apple'
  children: React.ReactNode
  className?: string
  disabled?: boolean
}

const providerConfig = {
  google: {
    name: 'Google',
    color: 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-300',
  },
  microsoft: {
    name: 'Microsoft',
    color: 'bg-[#0078d4] hover:bg-[#106ebe] text-white',
  },
  facebook: {
    name: 'Facebook',
    color: 'bg-[#1877f2] hover:bg-[#166fe5] text-white',
  },
  apple: {
    name: 'Apple',
    color: 'bg-black hover:bg-gray-800 text-white',
  },
}

export function OAuthButton({ provider, children, className, disabled }: OAuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const config = providerConfig[provider]

  const handleOAuthLogin = () => {
    setIsLoading(true)
    
    // Store the current URL to redirect back after OAuth
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('oauth_redirect_url', window.location.pathname)
    }
    
    // Redirect to OAuth provider
    window.location.href = oauthUrls[provider]
  }

  return (
    <LoadingButton
      variant="outline"
      className={`${config.color} ${className}`}
      onClick={handleOAuthLogin}
      disabled={disabled}
      loading={isLoading}
      loadingText={`Conectando com ${config.name}...`}
    >
      {children}
    </LoadingButton>
  )
}