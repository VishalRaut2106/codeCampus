'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'


interface AdminProfileProps {
  userProfile: any
}

export default function AdminProfile({ userProfile }: AdminProfileProps) {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <h1 className="text-4xl font-bold gradient-text">Admin Profile</h1>
          </div>
          <p className="text-muted-foreground">Administrator account information</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="text-center">
                  <Avatar className="h-24 w-24 mx-auto mb-4">
                    <AvatarImage src="" alt={userProfile.name} />
                    <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
                      {userProfile.name?.charAt(0)?.toUpperCase() || 'A'}
                    </AvatarFallback>
                  </Avatar>

                  <h2 className="text-2xl font-bold text-foreground mb-2">{userProfile.name}</h2>
                  <p className="text-muted-foreground mb-4">{userProfile.email}</p>

                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                      {userProfile.role}
                    </Badge>
                    <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
                      {userProfile.approval_status}
                    </Badge>
                  </div>

                  <Button
                    className="w-full gradient-button"
                    onClick={() => router.push('/dashboard/profile/edit')}
                  >
                    Edit Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Administrator Information
                </CardTitle>
                <CardDescription>Your administrative account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{userProfile.email}</p>
                    </div>
                  </div>

                  {userProfile.username && (
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Username</p>
                        <p className="font-medium">@{userProfile.username}</p>
                      </div>
                    </div>
                  )}

                  {userProfile.department && (
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Department</p>
                        <p className="font-medium">{userProfile.department}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Joined</p>
                      <p className="font-medium">
                        {userProfile.created_at ? new Date(userProfile.created_at).toLocaleDateString() : 'Unknown'}
                      </p>
                    </div>
                  </div>
                </div>

                {userProfile.bio && (
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground mb-2">Bio</p>
                    <p className="text-foreground bg-muted/10 p-3 rounded-lg">{userProfile.bio}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Social Links */}
            {(userProfile.github_url || userProfile.linkedin_url || userProfile.instagram_url) && (
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Social Links
                  </CardTitle>
                  <CardDescription>Your professional and social profiles</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {userProfile.github_url && (
                      <a
                        href={userProfile.github_url.startsWith('http') ? userProfile.github_url : `https://${userProfile.github_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 bg-muted/10 rounded-lg hover:bg-muted/20 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-800 rounded-lg">
                            <span className="text-white font-bold">GH</span>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">GitHub</p>
                            <p className="font-medium text-foreground">View Profile</p>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">Open</span>
                      </a>
                    )}

                    {userProfile.linkedin_url && (
                      <a
                        href={userProfile.linkedin_url.startsWith('http') ? userProfile.linkedin_url : `https://${userProfile.linkedin_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 bg-muted/10 rounded-lg hover:bg-muted/20 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-600 rounded-lg">
                            <span className="text-white font-bold">LI</span>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">LinkedIn</p>
                            <p className="font-medium text-foreground">View Profile</p>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">Open</span>
                      </a>
                    )}

                    {userProfile.instagram_url && (
                      <a
                        href={userProfile.instagram_url.startsWith('http') ? userProfile.instagram_url : `https://${userProfile.instagram_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 bg-muted/10 rounded-lg hover:bg-muted/20 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 rounded-lg">
                            <span className="text-white font-bold">IG</span>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Instagram</p>
                            <p className="font-medium text-foreground">View Profile</p>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">Open</span>
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Admin Privileges */}
            <Card className="glass-card border-yellow-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Administrator Privileges
                </CardTitle>
                <CardDescription>Your administrative access and permissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                    <p className="font-semibold text-foreground">Full Access</p>
                    <p className="text-xs text-muted-foreground">All platform features</p>
                  </div>
                  <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                    <p className="font-semibold text-foreground">User Management</p>
                    <p className="text-xs text-muted-foreground">Approve & manage users</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
