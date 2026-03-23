'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { User, Settings, LogOut } from 'lucide-react'

export default function DropdownTest() {
  const [isOpen, setIsOpen] = useState(false)

  const handleAction = (action: string) => {
    console.log(`Action clicked: ${action}`)
    setIsOpen(false) // Close dropdown immediately
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Dropdown Test</h2>
      
      <div className="relative">
        <Button onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? 'Close Menu' : 'Open Menu'}
        </Button>
        
        {isOpen && (
          <div className="absolute top-12 left-0 bg-white border border-gray-200 rounded-md shadow-lg z-50 min-w-[200px]">
            <div className="py-1">
              <button
                className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
                onClick={() => handleAction('Profile')}
              >
                <User className="h-4 w-4" />
                Profile
              </button>
              <button
                className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
                onClick={() => handleAction('Settings')}
              >
                <Settings className="h-4 w-4" />
                Settings
              </button>
              <button
                className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
                onClick={() => handleAction('Logout')}
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        Status: {isOpen ? 'Open' : 'Closed'}
      </div>
    </div>
  )
}
