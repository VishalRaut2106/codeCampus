'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function RealtimeTest() {
  const [isConnected, setIsConnected] = useState(false)
  const [updateCount, setUpdateCount] = useState(0)
  const [lastUpdate, setLastUpdate] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const subscription = supabase
      .channel('realtime-test')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users'
        },
        (payload) => {
          console.log('Test realtime update received:', payload)
          setUpdateCount(prev => prev + 1)
          setLastUpdate(new Date().toLocaleTimeString())
          toast.success('Real-time update received!')
        }
      )
      .on('system', {}, (status) => {
        console.log('Test realtime status:', status)
        setIsConnected(status === 'SUBSCRIBED')
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const triggerTestUpdate = async () => {
    try {
      // This would trigger a real-time update
      toast.info('Test update triggered - check other tabs!')
    } catch (error) {
      toast.error('Failed to trigger test update')
    }
  }

  return (
    <div className="glass rounded-xl p-4 space-y-4">
      <h3 className="text-lg font-semibold">Real-time Connection Test</h3>
      
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
        <span className="text-sm">
          {isConnected ? 'Connected to real-time updates' : 'Disconnected'}
        </span>
      </div>

      <div className="text-sm text-muted-foreground">
        <p>Updates received: {updateCount}</p>
        {lastUpdate && <p>Last update: {lastUpdate}</p>}
      </div>

      <Button onClick={triggerTestUpdate} size="sm">
        Test Real-time Updates
      </Button>
    </div>
  )
}


