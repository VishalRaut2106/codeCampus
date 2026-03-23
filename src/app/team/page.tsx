import Link from 'next/link'
import { Code2, Github, Linkedin, Twitter, Mail, Star, Users, Award, Zap, Target, Brain, Rocket } from 'lucide-react'

export default function TeamPage() {
  const coreTeam = [
    {
      name: "Alex Chen",
      role: "Founder & CEO",
      bio: "Full-stack developer with 8+ years of experience in building scalable web applications. Passionate about education technology and competitive programming.",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=alex",
      social: {
        github: "https://github.com/alexchen",
        linkedin: "https://linkedin.com/in/alexchen",
        twitter: "https://twitter.com/alexchen"
      }
    },
    {
      name: "Sarah Johnson",
      role: "CTO & Lead Developer",
      bio: "Expert in distributed systems and cloud architecture. Former Google engineer with a passion for creating innovative learning platforms.",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
      social: {
        github: "https://github.com/sarahjohnson",
        linkedin: "https://linkedin.com/in/sarahjohnson",
        twitter: "https://twitter.com/sarahjohnson"
      }
    },
    {
      name: "Mike Rodriguez",
      role: "Head of Product",
      bio: "Product strategist with a background in educational technology. Focused on creating intuitive user experiences that enhance learning outcomes.",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=mike",
      social: {
        github: "https://github.com/mikerodriguez",
        linkedin: "https://linkedin.com/in/mikerodriguez",
        twitter: "https://twitter.com/mikerodriguez"
      }
    },
    {
      name: "Emily Zhang",
      role: "Lead Designer",
      bio: "UI/UX designer with expertise in creating engaging digital experiences. Specializes in gamification and user-centered design principles.",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=emily",
      social: {
        github: "https://github.com/emilyzhang",
        linkedin: "https://linkedin.com/in/emilyzhang",
        twitter: "https://twitter.com/emilyzhang"
      }
    }
  ]

  const advisors = [
    {
      name: "Dr. Jennifer Liu",
      role: "Academic Advisor",
      bio: "Professor of Computer Science at Stanford University. Expert in algorithms and data structures with 20+ years of teaching experience.",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=jennifer",
      social: {
        linkedin: "https://linkedin.com/in/jenniferliu"
      }
    },
    {
      name: "David Park",
      role: "Industry Advisor",
      bio: "Senior Engineering Manager at Microsoft. Former competitive programmer and ACM ICPC world finalist with extensive industry experience.",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=david",
      social: {
        linkedin: "https://linkedin.com/in/davidpark"
      }
    }
  ]

  return (
    <div className="min-h-screen cyber-grid">
      {/* Hero Section
      <section className="relative h-full py-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-background/50"></div>
        <div className="relative z-10 max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-border mb-8">
            <Users className="h-4 w-4 text-purple-400" />
            <span className="text-sm font-medium text-purple-300">Meet the Team</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black mb-8 gradient-text">
            Our Team
          </h1>
          
          <p className="text-2xl md:text-3xl text-gray-300 font-light mb-12 max-w-4xl mx-auto leading-relaxed">
            The <span className="gradient-text font-bold">visionaries</span> behind the future of coding education
          </p>
        </div>
      </section> */}

      {/* Core Team */}
      <section className="py-24 px-4 h-[100vh] sm:px-6 lg:px-8 inset-0 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-black text-white mb-6">
              Core <span className="gradient-text">Team</span>
            </h2>
            <p className="text-xl text-gray-400">The brilliant minds building the platform</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {coreTeam.map((member, index) => (
              <div key={index} className="neo-card p-8 text-center group">
                <div className="relative mb-6">
                  <img 
                    src={member.image} 
                    alt={member.name}
                    className="w-24 h-24 rounded-full mx-auto border-4 border-purple-500/30 group-hover:border-purple-400 transition-colors"
                  />
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                    <Star className="h-4 w-4 text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{member.name}</h3>
                <p className="text-purple-400 font-semibold mb-4">{member.role}</p>
                <p className="text-gray-400 text-sm leading-relaxed mb-6">{member.bio}</p>
                <div className="flex justify-center gap-4">
                  {member.social.github && (
                    <a href={member.social.github} className="text-gray-400 hover:text-white transition-colors">
                      <Github className="h-5 w-5" />
                    </a>
                  )}
                  {member.social.linkedin && (
                    <a href={member.social.linkedin} className="text-gray-400 hover:text-blue-400 transition-colors">
                      <Linkedin className="h-5 w-5" />
                    </a>
                  )}
                  {member.social.twitter && (
                    <a href={member.social.twitter} className="text-gray-400 hover:text-blue-400 transition-colors">
                      <Twitter className="h-5 w-5" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Advisors Section */}
      <section className="py-16 px-4 h-[100vh] sm:px-6 lg:px-8 inset-0 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-black text-white mb-6">
              Advisory <span className="gradient-text">Board</span>
            </h2>
            <p className="text-xl text-gray-400">Industry experts guiding our vision</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {advisors.map((advisor, index) => (
              <div key={index} className="neo-card p-10 group">
                <div className="flex items-start gap-6">
                  <img 
                    src={advisor.image} 
                    alt={advisor.name}
                    className="w-20 h-20 rounded-full border-4 border-purple-500/30 group-hover:border-purple-400 transition-colors flex-shrink-0"
                  />
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white mb-2">{advisor.name}</h3>
                    <p className="text-purple-400 font-semibold mb-4">{advisor.role}</p>
                    <p className="text-gray-400 leading-relaxed mb-6">{advisor.bio}</p>
                    <div className="flex gap-4">
                      {advisor.social.linkedin && (
                        <a href={advisor.social.linkedin} className="text-gray-400 hover:text-blue-400 transition-colors">
                          <Linkedin className="h-6 w-6" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 px-4 h-[100vh] sm:px-6 lg:px-8 inset-0 bg-background">
        <div className="max-w-7xl mx-auto ">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-black text-white mb-6">
              Our <span className="gradient-text">Values</span>
            </h2>
            <p className="text-xl text-gray-400">The principles that drive everything we do</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="neo-card p-8 text-center group">
              <div className="w-16 h-16 bg-card border border-border rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-105 transition-transform">
                <Brain className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Innovation</h3>
              <p className="text-gray-400 leading-relaxed">
                Constantly pushing the boundaries of what&apos;s possible in educational technology
              </p>
            </div>

            <div className="neo-card p-8 text-center group">
              <div className="w-16 h-16 bg-card border border-border rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-105 transition-transform">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Community</h3>
              <p className="text-gray-400 leading-relaxed">
                Building inclusive spaces where every student can thrive and grow
              </p>
            </div>

            <div className="neo-card p-8 text-center group">
              <div className="w-16 h-16 bg-card border border-border rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-105 transition-transform">
                <Rocket className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Excellence</h3>
              <p className="text-gray-400 leading-relaxed">
                Committed to delivering the highest quality learning experiences
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-[8rem] px-4 h-[100vh] sm:px-6 lg:px-8 inset-0 bg-background">
        <div className="max-w-5xl mx-auto text-center">
          <div className="neo-card p-16 neon-glow">
            <h2 className="text-6xl font-black text-white mb-8">
              Ready to <span className="gradient-text">Join Our Mission</span>?
            </h2>
            <p className="text-2xl text-gray-300 mb-12 leading-relaxed">
              Become part of the revolution in coding education and help shape the future of technology
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link href="/auth/signup" className="neo-button text-2xl px-16 py-8 inline-flex items-center gap-4 group">
                <Zap className="h-8 w-8" />
                Start Your Journey
                <Target className="h-6 w-6 group-hover:translate-x-2 transition-transform" />
              </Link>
              <Link href="/about" className="neo-card p-6 text-white hover:text-purple-300 font-semibold text-xl transition-colors inline-flex items-center gap-4">
                <Award className="h-6 w-6" />
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}