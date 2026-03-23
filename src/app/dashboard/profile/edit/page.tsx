'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createClient } from '@/lib/supabase/client'
import { useUserProfile } from '@/hooks/useUserProfile'
import { toast } from 'sonner'
import {
  Eye,
  EyeOff
} from 'lucide-react'

interface UserProfile {
  id: string
  name: string
  email: string
  role: 'student' | 'admin'
  streak: number
  points: number
  badges: string[]
  department?: string
  mobile_number?: string
  github_url?: string
  linkedin_url?: string
  instagram_url?: string
  portfolio_url?: string
  username?: string
  prn?: string
  bio?: string
  profile_visible?: boolean
}

export default function EditProfilePage() {
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    prn: '',
    department: '',
    mobile_number: '',
    bio: '',
    github_url: '',
    linkedin_url: '',
    instagram_url: '',
    portfolio_url: ''
  })
  const { userProfile, loading, error, isAuthenticated, refreshProfile } = useUserProfile()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (userProfile) {
      setFormData({
        name: userProfile.name || '',
        username: userProfile.username || '',
        prn: userProfile.prn || '',
        department: userProfile.department || '',
        mobile_number: userProfile.mobile_number || '',
        bio: userProfile.bio || '',
        github_url: userProfile.github_url || '',
        linkedin_url: userProfile.linkedin_url || '',
        instagram_url: userProfile.instagram_url || '',
        portfolio_url: userProfile.portfolio_url || ''
      })
    }
  }, [userProfile])

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = async () => {
    if (!userProfile) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: formData.name,
          username: formData.username,
          prn: formData.prn,
          department: formData.department,
          mobile_number: formData.mobile_number,
          bio: formData.bio,
          github_url: formData.github_url.trim().startsWith('http') ? formData.github_url.trim() : (formData.github_url.trim() ? `https://github.com/${formData.github_url.trim()}` : ''),
          linkedin_url: formData.linkedin_url.trim().startsWith('http') ? formData.linkedin_url.trim() : (formData.linkedin_url.trim() ? `https://linkedin.com/in/${formData.linkedin_url.trim()}` : ''),
          instagram_url: formData.instagram_url.trim().startsWith('http') ? formData.instagram_url.trim() : (formData.instagram_url.trim() ? `https://instagram.com/${formData.instagram_url.trim()}` : ''),
          portfolio_url: formData.portfolio_url.trim(),
          profile_visible: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', userProfile.id)

      if (error) {
        console.error('Error updating profile:', error)
        toast.error('Failed to update profile. Please try again.')
        return
      }

      toast.success('Profile updated successfully!')
      router.push('/dashboard/profile')
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Error Loading Profile</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !userProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Profile Not Found</h1>
          <p className="text-gray-400 mb-6">Unable to load your profile information.</p>
          <Button onClick={() => window.location.href = '/dashboard'}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-[#eff1f6eb] font-sans">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              onClick={() => router.push('/dashboard/profile')}
              className="text-gray-400 hover:text-white hover:bg-[#282828]"
            >
              Back to Profile
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Edit Profile</h1>
          <p className="text-gray-400">Update your personal information and social links</p>
        </div>

        <div className="space-y-6">
          {/* Personal Information */}
          <div className="bg-[#282828] rounded-lg p-6 shadow-sm border border-[#3e3e3e]">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-[#3e3e3e] rounded-lg">

              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Personal Information</h2>
                <p className="text-sm text-gray-400">Update your basic profile information</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-300">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter your full name"
                    className="bg-[#3e3e3e] border-[#4e4e4e] text-white focus:border-[#2cbb5d] placeholder:text-gray-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-gray-300">Username</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    placeholder="Enter your username"
                    className="bg-[#3e3e3e] border-[#4e4e4e] text-white focus:border-[#2cbb5d] placeholder:text-gray-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prn" className="text-gray-300">PRN (Student ID)</Label>
                  <Input
                    id="prn"
                    value={formData.prn}
                    onChange={(e) => handleInputChange('prn', e.target.value)}
                    placeholder="Enter your PRN"
                    className="bg-[#3e3e3e] border-[#4e4e4e] text-white focus:border-[#2cbb5d] placeholder:text-gray-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department" className="text-gray-300">Department</Label>
                  <Select
                    value={formData.department}
                    onValueChange={(value) => handleInputChange('department', value)}
                  >
                    <SelectTrigger className="bg-[#3e3e3e] border-[#4e4e4e] text-white focus:ring-[#2cbb5d]">
                      <SelectValue placeholder="Select your department" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#282828] border-[#3e3e3e] text-white">
                      <SelectItem value="AI & DS">AI & DS</SelectItem>
                      <SelectItem value="CS">CS</SelectItem>
                      <SelectItem value="IT">IT</SelectItem>
                      <SelectItem value="ENTC">ENTC</SelectItem>
                      <SelectItem value="MECHANICAL">MECHANICAL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobile_number" className="text-gray-300">Mobile Number</Label>
                <Input
                  id="mobile_number"
                  value={formData.mobile_number}
                  onChange={(e) => handleInputChange('mobile_number', e.target.value)}
                  placeholder="Enter your mobile number"
                  className="bg-[#3e3e3e] border-[#4e4e4e] text-white focus:border-[#2cbb5d] placeholder:text-gray-500"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="bio" className="text-gray-300">Bio</Label>
                  <span className={`text-[10px] font-mono ${formData.bio.length > 150 ? 'text-red-500' : 'text-gray-500'}`}>
                    {formData.bio.length}/150
                  </span>
                </div>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder="Share a brief overview of your skills and interests (max 150 characters)..."
                  maxLength={150}
                  className="bg-[#3e3e3e] border-[#4e4e4e] text-white min-h-[100px] focus:border-[#2cbb5d] placeholder:text-gray-500 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="bg-[#282828] rounded-lg p-6 shadow-sm border border-[#3e3e3e]">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-[#3e3e3e] rounded-lg">

              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Social Links</h2>
                <p className="text-sm text-gray-400">Add your social media profiles</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="github_url" className="text-gray-300 flex items-center gap-2">
                  GitHub Profile
                </Label>
                <Input
                  id="github_url"
                  value={formData.github_url}
                  onChange={(e) => handleInputChange('github_url', e.target.value)}
                  placeholder="Username or full URL"
                  className="bg-[#3e3e3e] border-[#4e4e4e] text-white focus:border-[#2cbb5d] placeholder:text-gray-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkedin_url" className="text-gray-300 flex items-center gap-2">
                  LinkedIn Profile
                </Label>
                <Input
                  id="linkedin_url"
                  value={formData.linkedin_url}
                  onChange={(e) => handleInputChange('linkedin_url', e.target.value)}
                  placeholder="Username or full URL"
                  className="bg-[#3e3e3e] border-[#4e4e4e] text-white focus:border-[#2cbb5d] placeholder:text-gray-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instagram_url" className="text-gray-300 flex items-center gap-2">
                  Instagram Profile
                </Label>
                <Input
                  id="instagram_url"
                  value={formData.instagram_url}
                  onChange={(e) => handleInputChange('instagram_url', e.target.value)}
                  placeholder="Username or full URL"
                  className="bg-[#3e3e3e] border-[#4e4e4e] text-white focus:border-[#2cbb5d] placeholder:text-gray-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="portfolio_url" className="text-gray-300 flex items-center gap-2">
                  Portfolio Website
                </Label>
                <Input
                  id="portfolio_url"
                  value={formData.portfolio_url}
                  onChange={(e) => handleInputChange('portfolio_url', e.target.value)}
                  placeholder="https://yourportfolio.com"
                  className="bg-[#3e3e3e] border-[#4e4e4e] text-white focus:border-[#2cbb5d] placeholder:text-gray-500"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-end">
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard/profile')}
              className="text-gray-400 border-[#3e3e3e] hover:bg-[#3e3e3e] hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#2cbb5d] hover:bg-[#2cbb5d]/90 text-white font-medium"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
