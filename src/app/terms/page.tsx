import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Users, Shield, AlertTriangle, Scale, Gavel } from 'lucide-react'

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold gradient-text mb-4">Terms of Service</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Please read these terms carefully before using our platform.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Last updated: December 9, 2024
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Agreement */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Agreement to Terms
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                By accessing and using codCampus (&quot;the Platform&quot;), you accept and agree to be bound by the 
                terms and provision of this agreement. If you do not agree to abide by the above, please 
                do not use this service.
              </p>
            </CardContent>
          </Card>

          {/* Platform Description */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Platform Description</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                codCampus is an educational coding platform designed for college students to:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Practice coding problems and challenges</li>
                <li>Participate in programming contests</li>
                <li>Track progress and maintain coding streaks</li>
                <li>Compete on leaderboards</li>
                <li>Learn and improve programming skills</li>
              </ul>
            </CardContent>
          </Card>

          {/* User Accounts */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Accounts and Registration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Account Requirements</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Must be a current college student</li>
                  <li>Provide accurate and complete information</li>
                  <li>Maintain the security of your account credentials</li>
                  <li>Accept responsibility for all activities under your account</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Account Approval</h3>
                <p className="text-muted-foreground">
                  All accounts are subject to admin approval. We reserve the right to reject or 
                  terminate accounts that do not meet our requirements or violate these terms.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Acceptable Use */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Acceptable Use Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2 text-green-400">You May:</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Use the platform for educational purposes</li>
                  <li>Submit original code solutions</li>
                  <li>Participate in contests fairly</li>
                  <li>Share knowledge and help other students</li>
                  <li>Provide feedback and suggestions</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-red-400">You May Not:</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Copy or plagiarize solutions from others</li>
                  <li>Share your account credentials</li>
                  <li>Attempt to hack or exploit the platform</li>
                  <li>Submit malicious or harmful code</li>
                  <li>Harass or abuse other users</li>
                  <li>Use automated tools or bots</li>
                  <li>Violate any applicable laws or regulations</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Code Submissions */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Code Submissions and Intellectual Property</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Your Code</h3>
                <p className="text-muted-foreground">
                  You retain ownership of the code you submit. By submitting code to our platform, 
                  you grant us a license to store, process, and display your submissions for 
                  educational and platform operation purposes.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Platform Content</h3>
                <p className="text-muted-foreground">
                  All problems, test cases, and platform content are owned by codCampus or licensed 
                  from third parties. You may not reproduce or distribute this content without permission.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Prohibited Activities */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Prohibited Activities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Attempting to gain unauthorized access to the platform</li>
                <li>Interfering with the proper functioning of the platform</li>
                <li>Using the platform for commercial purposes without permission</li>
                <li>Impersonating other users or entities</li>
                <li>Distributing spam, viruses, or malicious content</li>
                <li>Collecting user information without consent</li>
                <li>Violating the privacy or rights of other users</li>
              </ul>
            </CardContent>
          </Card>

          {/* Termination */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gavel className="h-5 w-5" />
                Account Termination
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                We reserve the right to terminate or suspend your account at any time for violations 
                of these terms or for any other reason we deem appropriate.
              </p>
              <div>
                <h3 className="font-semibold mb-2">Grounds for Termination:</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Violation of these Terms of Service</li>
                  <li>Fraudulent or deceptive practices</li>
                  <li>Harmful behavior towards other users</li>
                  <li>Misuse of platform resources</li>
                  <li>Inactivity for extended periods</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Disclaimers */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5" />
                Disclaimers and Limitations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Service Availability</h3>
                <p className="text-muted-foreground">
                  The platform is provided "as is" without warranties of any kind. We do not guarantee 
                  uninterrupted service and may experience downtime for maintenance or technical issues.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Limitation of Liability</h3>
                <p className="text-muted-foreground">
                  codCampus shall not be liable for any indirect, incidental, special, or consequential 
                  damages arising from your use of the platform.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Educational Purpose</h3>
                <p className="text-muted-foreground">
                  This platform is designed for educational purposes only. We make no guarantees about 
                  the accuracy or completeness of the content provided.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Privacy */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Privacy and Data Protection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Your privacy is important to us. We collect and use your information in accordance 
                with our Privacy Policy. By using the platform, you consent to our data practices 
                as described in our Privacy Policy.
              </p>
              <div>
                <h3 className="font-semibold mb-2">Data We Collect:</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Account information (name, email, college details)</li>
                  <li>Code submissions and contest participation</li>
                  <li>Usage statistics and performance metrics</li>
                  <li>Technical information for platform improvement</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Changes to Terms */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Changes to Terms</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                We reserve the right to modify these terms at any time. Changes will be effective 
                immediately upon posting. Your continued use of the platform after changes constitutes 
                acceptance of the new terms. We recommend reviewing these terms periodically.
              </p>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                If you have any questions about these Terms of Service, please contact us through 
                the platform's support system or reach out to our administrators.
              </p>
            </CardContent>
          </Card>

          {/* Acceptance */}
          <Card className="glass-card border-primary/20">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-muted-foreground mb-4">
                  By using codCampus, you acknowledge that you have read, understood, and agree to be 
                  bound by these Terms of Service.
                </p>
                <p className="text-sm text-muted-foreground">
                  These terms constitute the entire agreement between you and codCampus regarding 
                  your use of the platform.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}