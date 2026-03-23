'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Code, Trophy, Target, Users, Star, ArrowRight, LayoutDashboard } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#00C896]"></div>
      </div>
    )
  }
  return (
    <div className="min-h-screen animated-bg">
      {/* Hero Section - 100vh */}
      <section className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-transparent"></div>

        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8">
              <Code className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-primary">Next-Gen Coding Platform</span>
            </div>
          </div>

          <h1 className="text-6xl md:text-8xl font-black mb-8 gradient-text">
            CodePVG
          </h1>

          <p className="text-2xl md:text-3xl text-muted-foreground mb-12 max-w-4xl mx-auto leading-relaxed">
            The <span className="gradient-text">coding platform</span> where college students become <span className="gradient-text-secondary">coding legends</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
            {user ? (
              (user.role === 'admin' || user.role === 'super_admin') ? (
                // Admin View
                <>
                  <Link href="/dashboard/admin" className="simple-button inline-flex items-center gap-3 text-lg px-8 py-4">
                    <LayoutDashboard className="h-6 w-6" />
                    Admin Dashboard
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                  <Link href="/leaderboard" className="gradient-button-secondary inline-flex items-center gap-3 text-lg px-8 py-4">
                    <Trophy className="h-6 w-6" />
                    View Leaderboard
                  </Link>
                </>
              ) : (
                // Student View
                <>
                  <Link href="/dashboard" className="simple-button inline-flex items-center gap-3 text-lg px-8 py-4">
                    <Star className="h-6 w-6" />
                    Student Dashboard
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                  <Link href="/problems" className="gradient-button-secondary inline-flex items-center gap-3 text-lg px-8 py-4">
                    <Code className="h-6 w-6" />
                    Start Coding
                  </Link>
                </>
              )
            ) : (
              // Guest View
              <>
                <Link href="/auth/signup" className="simple-button inline-flex items-center gap-3 text-lg px-8 py-4">
                  <Star className="h-6 w-6" />
                  Get Started
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link href="/leaderboard" className="gradient-button-secondary inline-flex items-center gap-3 text-lg px-8 py-4">
                  <Trophy className="h-6 w-6" />
                  View Rankings
                </Link>
              </>
            )}
          </div>

          {/* Stats Preview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="glass rounded-xl p-6 text-center">
              <div className="text-3xl font-bold gradient-text mb-2">1K+</div>
              <div className="text-sm text-muted-foreground">Active Coders</div>
            </div>
            <div className="glass rounded-xl p-6 text-center">
              <div className="text-3xl font-bold gradient-text-secondary mb-2">50+</div>
              <div className="text-sm text-muted-foreground">Problems Solved</div>
            </div>
            <div className="glass rounded-xl p-6 text-center">
              <div className="text-3xl font-bold gradient-text mb-2">2+</div>
              <div className="text-sm text-muted-foreground">Contests</div>
            </div>
            <div className="glass rounded-xl p-6 text-center">
              <div className="text-3xl font-bold gradient-text-secondary mb-2">24/7</div>
              <div className="text-sm text-muted-foreground">Always Online</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - 100vh */}
      <section className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-transparent"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
              Why Choose <span className="gradient-text">CodePVG</span>?
            </h2>
            <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
              Experience the future of competitive programming with cutting-edge technology and immersive design
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="gradient-card text-center group hover:scale-105 transition-all duration-500">
              <div className="w-20 h-20 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-8 group-hover:scale-105 transition-transform duration-300">
                <Trophy className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-6 gradient-text">Compete</h3>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Battle in epic coding tournaments against the brightest minds from universities worldwide. Climb leaderboards and prove your skills.
              </p>
            </div>

            <div className="gradient-card text-center group hover:scale-105 transition-all duration-500">
              <div className="w-20 h-20 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-8 group-hover:scale-105 transition-transform duration-300">
                <Target className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-6 gradient-text-secondary">Master</h3>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Level up your skills with AI-powered problem recommendations and real-time performance analytics. Track your progress.
              </p>
            </div>

            <div className="gradient-card text-center group hover:scale-105 transition-all duration-500">
              <div className="w-20 h-20 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-8 group-hover:scale-105 transition-transform duration-300">
                <Code className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-6 gradient-text">Code</h3>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Write code in a modern editor with syntax highlighting and intelligent features. Experience coding like never before.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section - 100vh */}
      <section className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-transparent"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
              Platform <span className="gradient-text">Statistics</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">Join the thriving coding community</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="glass rounded-2xl p-8 text-center group hover:scale-105 transition-all duration-500">
              <div className="text-5xl font-black gradient-text mb-4 group-hover:scale-110 transition-transform duration-300">1K+</div>
              <div className="text-lg text-muted-foreground font-medium">Active Coders</div>
              <div className="text-sm text-muted-foreground mt-2">Growing daily</div>
            </div>
            <div className="glass rounded-2xl p-8 text-center group hover:scale-105 transition-all duration-500">
              <div className="text-5xl font-black gradient-text-secondary mb-4 group-hover:scale-110 transition-transform duration-300">50+</div>
              <div className="text-lg text-muted-foreground font-medium">Problems Solved</div>
              <div className="text-sm text-muted-foreground mt-2">And counting</div>
            </div>
            <div className="glass rounded-2xl p-8 text-center group hover:scale-105 transition-all duration-500">
              <div className="text-5xl font-black gradient-text mb-4 group-hover:scale-110 transition-transform duration-300">2+</div>
              <div className="text-lg text-muted-foreground font-medium">Contests Hosted</div>
              <div className="text-sm text-muted-foreground mt-2">Epic battles</div>
            </div>
            <div className="glass rounded-2xl p-8 text-center group hover:scale-105 transition-all duration-500">
              <div className="text-5xl font-black gradient-text-secondary mb-4 group-hover:scale-110 transition-transform duration-300">24/7</div>
              <div className="text-lg text-muted-foreground font-medium">Always Online</div>
              <div className="text-sm text-muted-foreground mt-2">Never sleeps</div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-20 text-center">
            <div className="inline-flex items-center gap-4 px-8 py-4 rounded-full glass">
              <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
              <span className="text-lg font-medium text-foreground">Live coding sessions happening now</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - 100vh */}
      <section className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-transparent"></div>

        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className="mb-12">
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full glass mb-8">
              <Star className="h-6 w-6 text-primary" />
              <span className="text-lg font-medium text-primary">Ready to Begin Your Journey?</span>
            </div>
          </div>

          <h2 className="text-6xl md:text-7xl font-black text-foreground mb-8">
            Ready to <span className="gradient-text">Get Started</span>?
          </h2>

          <p className="text-2xl text-muted-foreground mb-16 max-w-4xl mx-auto leading-relaxed">
            Join the most advanced coding platform and become a <span className="gradient-text-secondary">legend</span> in the digital realm
          </p>

          <div className="flex flex-col sm:flex-row gap-8 justify-center items-center mb-16">
            {user ? (
              (user.role === 'admin' || user.role === 'super_admin') ? (
                // Admin View
                <>
                  <Link href="/dashboard/admin" className="simple-button inline-flex items-center gap-4 text-xl px-12 py-6">
                    <LayoutDashboard className="h-7 w-7" />
                    Admin Dashboard
                    <ArrowRight className="h-6 w-6" />
                  </Link>
                  <Link href="/leaderboard" className="gradient-button-secondary inline-flex items-center gap-4 text-xl px-12 py-6">
                    <Trophy className="h-7 w-7" />
                    Leaderboard
                  </Link>
                </>
              ) : (
                // Student View
                <>
                  <Link href="/dashboard" className="simple-button inline-flex items-center gap-4 text-xl px-12 py-6">
                    <Star className="h-7 w-7" />
                    Student Dashboard
                    <ArrowRight className="h-6 w-6" />
                  </Link>
                  <Link href="/problems" className="gradient-button-secondary inline-flex items-center gap-4 text-xl px-12 py-6">
                    <Code className="h-7 w-7" />
                    Start Coding
                  </Link>
                </>
              )
            ) : (
              // Guest View
              <>
                <Link href="/auth/signup" className="simple-button inline-flex items-center gap-4 text-xl px-12 py-6">
                  <Star className="h-7 w-7" />
                  Start Your Journey
                  <ArrowRight className="h-6 w-6" />
                </Link>
                <Link href="/about" className="gradient-button-secondary inline-flex items-center gap-4 text-xl px-12 py-6">
                  <Users className="h-7 w-7" />
                  Learn More
                </Link>
              </>
            )}
          </div>

          {/* Final Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="glass rounded-xl p-6 text-center">
              <div className="text-2xl font-bold gradient-text mb-2">100%</div>
              <div className="text-sm text-muted-foreground">Free to Start</div>
            </div>
            <div className="glass rounded-xl p-6 text-center">
              <div className="text-2xl font-bold gradient-text-secondary mb-2">24/7</div>
              <div className="text-sm text-muted-foreground">Support Available</div>
            </div>
            <div className="glass rounded-xl p-6 text-center">
              <div className="text-2xl font-bold gradient-text mb-2">∞</div>
              <div className="text-sm text-muted-foreground">Possibilities</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
