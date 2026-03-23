import Link from 'next/link'
import { Code2, Target, Users, Trophy, Star, ArrowRight, Brain, Rocket, Globe, Heart } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="min-h-screen animated-bg">
      {/* Hero Section - 100vh */}
      <section className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5"></div>
        <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-r from-primary/20 to-primary/10 rounded-full blur-3xl floating"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-gradient-to-r from-primary/15 to-primary/5 rounded-full blur-3xl floating" style={{animationDelay: '2s'}}></div>
        
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8">
              <Code2 className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-primary">About Our Mission</span>
            </div>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black mb-8 gradient-text">
            About codCampus
          </h1>
          
          <p className="text-2xl md:text-3xl text-muted-foreground mb-12 max-w-4xl mx-auto leading-relaxed">
            Empowering college students to excel in competitive programming through
            <span className="gradient-text"> innovative technology</span> and <span className="gradient-text-secondary">community-driven</span> learning experiences.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Our Mission
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              To revolutionize coding education through immersive, competitive, and gamified learning experiences
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="simple-card text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-6">
                <Brain className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">Innovation</h3>
              <p className="text-muted-foreground">
                Cutting-edge technology meets educational excellence to create the ultimate learning platform
              </p>
            </div>

            <div className="simple-card text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-6">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">Community</h3>
              <p className="text-muted-foreground">
                Building a global network of passionate coders who learn, compete, and grow together
              </p>
            </div>

            <div className="simple-card text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-6">
                <Rocket className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">Excellence</h3>
              <p className="text-muted-foreground">
                Pushing boundaries and setting new standards in competitive programming education
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              What We Do
            </h2>
            <p className="text-lg text-muted-foreground">Empowering students through technology and innovation</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="simple-card">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Trophy className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">Competitive Programming</h3>
                  <p className="text-muted-foreground">
                    Host coding battles where students compete in real-time, solving algorithmic challenges and climbing leaderboards.
                  </p>
                </div>
              </div>
            </div>

            <div className="simple-card">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">Skill Development</h3>
                  <p className="text-muted-foreground">
                    Personalized learning paths with AI-powered recommendations to help students master programming concepts.
                  </p>
                </div>
              </div>
            </div>

            <div className="simple-card">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Globe className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">Global Community</h3>
                  <p className="text-muted-foreground">
                    Connect with coders from universities worldwide, share knowledge, and build professional relationships.
                  </p>
                </div>
              </div>
            </div>

            <div className="simple-card">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">Student-Focused</h3>
                  <p className="text-muted-foreground">
                    Built exclusively for college students with features designed to enhance academic and career development.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Powered by Technology
            </h2>
            <p className="text-lg text-muted-foreground">Built with cutting-edge tools and frameworks</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="simple-card text-center">
              <div className="text-2xl font-bold text-primary mb-2">Next.js 15</div>
              <div className="text-muted-foreground">React Framework</div>
            </div>
            <div className="simple-card text-center">
              <div className="text-2xl font-bold text-primary mb-2">Supabase</div>
              <div className="text-muted-foreground">Backend & Database</div>
            </div>
            <div className="simple-card text-center">
              <div className="text-2xl font-bold text-primary mb-2">Judge0</div>
              <div className="text-muted-foreground">Code Execution</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of students who are already improving their coding skills with codCampus.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup" className="simple-button inline-flex items-center gap-2">
              <Star className="h-5 w-5" />
              Start Your Journey
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/team" className="nav-link inline-flex items-center gap-2">
              <Users className="h-5 w-5" />
              Meet the Team
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}