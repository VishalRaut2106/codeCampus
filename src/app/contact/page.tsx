'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Send, 
  MessageCircle, 
  Bug, 
  HelpCircle,
  Lightbulb,
  Shield
} from 'lucide-react'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    category: 'general',
    message: ''
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Simulate form submission
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast.success('Message sent successfully! We\'ll get back to you within 24 hours.')
      setFormData({
        name: '',
        email: '',
        subject: '',
        category: 'general',
        message: ''
      })
    } catch (error) {
      toast.error('Failed to send message. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const categories = [
    { value: 'general', label: 'General Inquiry', icon: MessageCircle },
    { value: 'bug', label: 'Bug Report', icon: Bug },
    { value: 'feature', label: 'Feature Request', icon: Lightbulb },
    { value: 'help', label: 'Technical Support', icon: HelpCircle },
    { value: 'security', label: 'Security Issue', icon: Shield }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold gradient-text mb-4">Contact Support</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Need help? Have a question? We're here to assist you. Get in touch with our support team.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Send us a Message
                </CardTitle>
                <CardDescription>
                  Fill out the form below and we'll respond as soon as possible
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium mb-2">
                        Full Name *
                      </label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Your full name"
                        className="bg-white/5 border-white/20"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium mb-2">
                        Email Address *
                      </label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="your.email@example.com"
                        className="bg-white/5 border-white/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="category" className="block text-sm font-medium mb-2">
                      Category *
                    </label>
                    <select
                      id="category"
                      name="category"
                      required
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00C896] focus:border-transparent"
                    >
                      {categories.map((category) => (
                        <option key={category.value} value={category.value} className="bg-background">
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium mb-2">
                      Subject *
                    </label>
                    <Input
                      id="subject"
                      name="subject"
                      type="text"
                      required
                      value={formData.subject}
                      onChange={handleInputChange}
                      placeholder="Brief description of your inquiry"
                      className="bg-white/5 border-white/20"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium mb-2">
                      Message *
                    </label>
                    <Textarea
                      id="message"
                      name="message"
                      required
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="Please provide detailed information about your inquiry..."
                      rows={6}
                      className="bg-white/5 border-white/20 resize-none"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full glass-button"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Contact Information */}
          <div className="space-y-6">
            {/* Quick Contact */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Quick Contact</CardTitle>
                <CardDescription>
                  Get in touch with us directly
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#00C896]/20 rounded-full">
                    <Mail className="h-4 w-4 text-[#00C896]" />
                  </div>
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">support@codepvg.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#00C896]/20 rounded-full">
                    <Phone className="h-4 w-4 text-[#00C896]" />
                  </div>
                  <div>
                    <p className="font-medium">Phone</p>
                    <p className="text-sm text-muted-foreground">+91 98765 43210</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#00C896]/20 rounded-full">
                    <MapPin className="h-4 w-4 text-[#00C896]" />
                  </div>
                  <div>
                    <p className="font-medium">Location</p>
                    <p className="text-sm text-muted-foreground">Pune, Maharashtra, India</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#00C896]/20 rounded-full">
                    <Clock className="h-4 w-4 text-[#00C896]" />
                  </div>
                  <div>
                    <p className="font-medium">Response Time</p>
                    <p className="text-sm text-muted-foreground">Within 24 hours</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Support Categories */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Support Categories</CardTitle>
                <CardDescription>
                  Choose the right category for faster assistance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {categories.map((category) => {
                  const Icon = category.icon
                  return (
                    <div key={category.value} className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                      <Icon className="h-4 w-4 text-[#00C896]" />
                      <span className="text-sm">{category.label}</span>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            {/* FAQ Link */}
            <Card className="glass-card">
              <CardContent className="p-6 text-center">
                <HelpCircle className="h-8 w-8 text-[#00C896] mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Need Quick Answers?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Check our FAQ section for common questions and solutions.
                </p>
                <Button variant="outline" className="w-full border-white/20">
                  View FAQ
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}