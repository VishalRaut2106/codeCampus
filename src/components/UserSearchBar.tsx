'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, User, X, Crown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useDebounce } from '@/hooks/useDebounce'

interface SearchUser {
  id: string
  name: string
  username?: string
  email: string
  role: string
  prn?: string
}

export default function UserSearchBar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchUser[]>([])
  const [isOpen, setIsOpen] = useState(false) // Dropdown open
  const [isExpanded, setIsExpanded] = useState(false) // Input visible
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Close dropdown AND collapse input when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        if (query.trim() === '') {
          setIsExpanded(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [query])

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isExpanded])

  // Debounce the query to avoid hitting API on every keystroke
  const debouncedQuery = useDebounce(query, 300)

  // Trigger search when debounced query changes
  useEffect(() => {
    const trimmedQuery = debouncedQuery.trim()
    if (trimmedQuery.length >= 2) {
      searchUsers()
    } else {
      setResults([])
      setIsOpen(false)
    }
  }, [debouncedQuery])

  const searchUsers = async () => {
    const trimmedQuery = query.trim()

    // Edge case: Empty query after trim
    if (trimmedQuery.length < 2) {
      setResults([])
      setIsOpen(false)
      return
    }

    setLoading(true)

    try {
      const url = `/api/search-user?q=${encodeURIComponent(trimmedQuery)}`

      const response = await fetch(url)

      // Edge case: Non-200 response
      if (!response.ok) {
        setResults([])
        setIsOpen(false)
        return
      }

      // Check if response is JSON
      const contentType = response.headers.get('content-type')

      if (!contentType || !contentType.includes('application/json')) {
        setResults([])
        setIsOpen(false)
        return
      }

      const data = await response.json()

      // Edge case: API returns success but no data
      if (data.success) {
        const users = data.data || []

        // Edge case: Filter out invalid users
        const validUsers = users.filter((user: SearchUser) =>
          user && user.id && user.name && (user.username || user.email)
        )

        setResults(validUsers)
        setIsOpen(validUsers.length > 0)
      } else {
        setResults([])
        setIsOpen(false)
      }
    } catch (error) {
      setResults([])
      setIsOpen(false)
    } finally {
      setLoading(false)
    }
  }

  const handleUserClick = (user: SearchUser) => {
    // Edge case: Invalid user data
    if (!user || !user.id) return

    // Prefer username, fallback to id
    const profilePath = user.username && user.username.trim()
      ? `/profile/${user.username}`
      : `/profile/${user.id}`

    router.push(profilePath)

    // Clear search and close
    setQuery('')
    setResults([])
    setIsOpen(false)
    setIsExpanded(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Remove @ symbol if user types it
    const cleanValue = value.startsWith('@') ? value.slice(1) : value
    setQuery(cleanValue)
  }

  const handleClear = () => {
    setQuery('')
    setResults([])
    setIsOpen(false)
    inputRef.current?.focus()
  }

  const toggleSearch = () => {
    setIsExpanded(!isExpanded)
    if (!isExpanded) {
      // Small delay to ensure render before focus (though useEffect handles it mostly)
    }
  }

  return (
    <div ref={searchRef} className="relative flex items-center justify-end">
      {/* Icon Trigger (Visible when collapsed) */}
      {!isExpanded && (
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSearch}
          className="text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-full h-9 w-9"
          title="Search users"
        >
          <Search className="h-5 w-5" />
        </Button>
      )}

      {/* Expanded Input Area */}
      {isExpanded && (
        <div className="relative animate-in fade-in slide-in-from-right-4 duration-200">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search by name or @username..."
            value={query}
            onChange={handleInputChange}
            className="pl-9 pr-9 w-64 md:w-80 h-9 bg-muted/30 focus:bg-background transition-colors"
          />
          <div className="absolute right-1 top-1/2 transform -translate-y-1/2 flex items-center">
            {query ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClear}
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsExpanded(false)}
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Dropdown Results */}
      {isOpen && isExpanded && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-card border border-border rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              <span className="animate-pulse">Searching...</span>
            </div>
          ) : results.length > 0 ? (
            <>
              <div className="max-h-[300px] overflow-y-auto">
                {results.slice(0, 5).map((user) => {
                  if (!user || !user.id || !user.name) return null

                  return (
                    <button
                      key={user.id}
                      onClick={() => handleUserClick(user)}
                      className="w-full px-4 py-3 text-left hover:bg-muted/80 flex items-center gap-3 transition-colors border-b border-border/40 last:border-b-0"
                    >
                      {user.role === 'admin' ? (
                        <Crown className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                      ) : (
                        <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate flex items-center gap-1.5">
                          <span className="text-foreground">{user.name}</span>
                          {user.role === 'admin' && (
                            <span className="text-[10px] bg-yellow-500/10 text-yellow-500 px-1.5 py-0.5 rounded font-medium border border-yellow-500/20">Admin</span>
                          )}
                        </div>
                        {user.username && (
                          <div className="text-xs text-muted-foreground">@{user.username}</div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
              {results.length > 5 && (
                <div className="px-3 py-2 text-center text-[10px] text-muted-foreground bg-muted/30 border-t border-border/40">
                  Showing 5 of {results.length} results
                </div>
              )}
            </>
          ) : query.length >= 2 && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No users found
            </div>
          )}
        </div>
      )}
    </div>
  )
}
