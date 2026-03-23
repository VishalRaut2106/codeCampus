'use client'

import { usePathname } from 'next/navigation'
import Navbar from './Navbar'

export default function ConditionalNavbar() {
  const pathname = usePathname()
  
  // Hide navbar on pending approval page
  const hideNavbarPaths = [
    '/auth/pending-approval'
  ]
  
  const shouldHideNavbar = hideNavbarPaths.includes(pathname)
  
  if (shouldHideNavbar) {
    return null
  }
  
  return <Navbar />
}
