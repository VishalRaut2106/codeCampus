'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Code2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import UserSearchBar from '@/components/UserSearchBar'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const { user, loading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const closeAllMenus = () => {
    setIsOpen(false)
  }

  const navItems = [
    { name: 'Home', href: '/', roles: ['student', 'admin', 'super_admin', 'public'] },
    { name: 'Problems', href: '/problems', roles: ['student', 'admin', 'super_admin'], requireAuth: true },
    { name: 'Contests', href: '/contests', roles: ['student', 'admin', 'super_admin'], requireAuth: true },
    { name: 'Leaderboard', href: '/leaderboard', roles: ['student', 'admin', 'super_admin', 'public'] },
  ]

  const dashboardLink = (user?.role === 'admin' || user?.role === 'super_admin')
    ? '/dashboard/admin'
    : (user?.username ? `/profile/${user.username}` : '/')

  const [visible, setVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  // Handle scroll behavior to hide/show navbar
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY

      // Always show at top (threshold of 10px)
      if (currentScrollY < 10) {
        setVisible(true)
      } else {
        // Show when scrolling UP, hide when scrolling DOWN
        // Added sensitivity buffer of 5px to prevent jitter
        if (Math.abs(currentScrollY - lastScrollY) > 5) {
          setVisible(currentScrollY < lastScrollY)
        }
      }
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  // Close mobile menu when route changes
  useEffect(() => {
    closeAllMenus()
  }, [pathname])

  return (
    <nav
      className={`fixed top-0 w-full z-50 bg-background/95 backdrop-blur-md border-b border-border transition-transform duration-300 ease-in-out lg:translate-y-0 ${visible ? 'translate-y-0' : '-translate-y-full'
        }`}
    >
      <div className="w-full mx-auto gap-5 flex justify-between items-center px-12 md:px-24 py-3 h-16">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-xl font-bold text-foreground hover:opacity-80 transition-opacity">
            <Code2 className="h-8 w-8 text-primary" />
            <span>codCampus</span>
          </Link>


          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => {
              // Show item if user has required role OR if it doesn't require auth
              const canAccess = item.requireAuth ? user && item.roles.includes(user.role) : item.roles.includes(user?.role || 'public')

              return canAccess && (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-2 text-sm font-medium ${pathname === item.href
                    ? 'text-primary font-semibold'
                    : 'text-muted-foreground hover:text-foreground transition-colors'
                    }`}
                >
                  <span className="hidden lg:inline">{item.name}</span>
                </Link>
              )
            })}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* User Search Bar - Only for non-admin users */}
          {user && user.role !== 'admin' && user.role !== 'super_admin' && (
            <UserSearchBar />
          )}

          {loading ? (
            <div className="h-10 w-32 animate-pulse bg-gray-700 rounded-lg"></div>
          ) : user ? (
            <div className="flex items-center gap-2 lg:gap-4">
              {(user.role === 'admin' || user.role === 'super_admin') && (
                <Link href={dashboardLink} className="hidden lg:flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Dashboard
                </Link>
              )}
              <div className="hidden lg:flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-muted-foreground hover:text-foreground text-xs"
                >
                  Logout
                </Button>
                <Link href={user.username ? `/profile/${user.username}` : '/dashboard/profile'}>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full hover:bg-transparent p-0">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} alt={user.name} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="hidden lg:flex gap-2">
              <Link href="/auth/login">
                <Button variant="ghost" className="text-muted-foreground hover:bg-transparent hover:text-foreground text-xs">
                  Login
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button className="text-muted-foreground bg-transparent hover:text-foreground text-xs">
                  Sign Up
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center gap-2 sm:gap-4">
          {loading ? (
            <div className="h-8 sm:h-10 w-8 sm:w-10 animate-pulse bg-gray-700 rounded-full"></div>
          ) : user ? (
            <div className="flex items-center gap-2">
              <Link href={user.username ? `/profile/${user.username}` : '/dashboard/profile'}>
                <Button variant="ghost" className="relative h-8 sm:h-10 w-8 sm:w-10 rounded-full hover:bg-transparent p-0">
                  <Avatar className="h-8 sm:h-10 w-8 sm:w-10 border-2 border-purple-400">
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} alt={user.name} />
                    <AvatarFallback className="bg-secondary text-secondary-foreground font-bold text-xs">
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </Link>
            </div>
          ) : null}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
            className="text-foreground hover:text-primary transition-all duration-200"
          >
            <div className="relative font-medium">
              {isOpen ? 'Close' : 'Menu'}
            </div>
          </Button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="md:hidden fixed top-16 left-0 w-full h-[calc(100dvh-4rem)] bg-black/95  border-t border-white/10 shadow-2xl z-50 flex flex-col items-start justify-start py-6 px-4 animate-in slide-in-from-top-2 duration-300 overflow-y-auto overscroll-contain">
          {navItems.map((item, index) => {
            // Show item if user has required role OR if it doesn't require auth
            const canAccess = item.requireAuth ? user && item.roles.includes(user.role) : item.roles.includes(user?.role || 'public')

            return canAccess && (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 w-full text-base font-medium px-4 py-3 ${pathname === item.href
                  ? 'text-primary'
                  : 'text-muted-foreground'
                  }`}
                onClick={() => setIsOpen(false)}
              >
                {item.name}
              </Link>
            )
          })}

          <div className="w-full h-px bg-border my-4" />

          {loading ? (
            <div className="h-10 w-full animate-pulse bg-muted rounded"></div>
          ) : user ? (
            <div className="flex flex-col gap-2 w-full">
              {(user.role === 'admin' || user.role === 'super_admin') && (
                <Link
                  href={dashboardLink}
                  className="flex items-center gap-3 w-full text-base font-medium text-muted-foreground hover:text-foreground transition-all duration-200 hover:bg-muted/50 px-4 py-3 rounded-lg"
                  onClick={() => setIsOpen(false)}
                >
                  Dashboard
                </Link>
              )}
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="justify-start w-full text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 h-auto px-4 py-3"
              >
                Logout
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3 w-full pt-2">
              <Link href="/auth/login" onClick={() => setIsOpen(false)} className="w-full">
                <Button variant="outline" className="w-full justify-center">
                  Login
                </Button>
              </Link>
              <Link href="/auth/signup" onClick={() => setIsOpen(false)} className="w-full">
                <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground justify-center">
                  Sign Up
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}