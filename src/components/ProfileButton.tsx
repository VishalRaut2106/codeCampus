'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { User } from 'lucide-react'

interface ProfileButtonProps {
  username?: string
  userId?: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  showIcon?: boolean
  children?: React.ReactNode
}

export default function ProfileButton({
  username,
  userId,
  variant = 'outline',
  size = 'sm',
  className = '',
  showIcon = true,
  children
}: ProfileButtonProps) {
  const router = useRouter()

  const handleClick = () => {
    if (!username && !userId) {
      console.error('ProfileButton: No username or userId provided')
      return
    }

    const profilePath = username ? `/profile/${username}` : `/profile/${userId}`
    router.push(profilePath)
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={`${className} ${variant === 'outline' ? 'border-white/20 text-white hover:bg-white/10' : ''}`}
      title={`View ${username ? `@${username}'s` : 'user'} profile`}
    >
      {showIcon && <User className="h-4 w-4 mr-2" />}
      {children || 'View Profile'}
    </Button>
  )
}
