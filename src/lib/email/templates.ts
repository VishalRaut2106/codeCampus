// Email templates for codCampus notifications

export interface EmailTemplate {
  subject: string
  html: string
  text: string
}

export function generateWelcomeEmail(name: string): EmailTemplate {
  return {
    subject: 'Welcome to codCampus! 🎉',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to codCampus</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #00C896 0%, #89F2E8 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: linear-gradient(135deg, #00C896 0%, #89F2E8 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
            .highlight { background: #e8f5e8; padding: 15px; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🎉 Welcome to codCampus!</h1>
            <p>Your journey to coding excellence starts now</p>
          </div>

          <div class="content">
            <h2>Hi ${name}!</h2>

            <p>Welcome to <strong>codCampus</strong>, the ultimate coding platform designed exclusively for college students!</p>

            <div class="highlight">
              <h3>🚀 What's Next?</h3>
              <ul>
                <li>Complete your profile setup</li>
                <li>Explore coding problems and challenges</li>
                <li>Join your first coding contest</li>
                <li>Start building your coding streak!</li>
              </ul>
            </div>

            <p>Your account is currently pending admin approval. You'll receive another email once your account is activated.</p>

            <p>In the meantime, you can:</p>
            <ul>
              <li>Browse our public leaderboard</li>
              <li>Read our blog posts about coding tips</li>
              <li>Prepare for your first contest</li>
            </ul>

            <div style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" class="button">
                Visit codCampus
              </a>
            </div>

            <p>Happy coding! 💻</p>

            <p><strong>The codCampus Team</strong></p>
          </div>

          <div class="footer">
            <p>© 2024 codCampus. All rights reserved.</p>
            <p>Questions? Contact us at support@codcampus.edu</p>
          </div>
        </body>
      </html>
    `,
    text: `
      Welcome to codCampus!

      Hi ${name}!

      Welcome to codCampus, the ultimate coding platform designed exclusively for college students!

      What's Next?
      - Complete your profile setup
      - Explore coding problems and challenges
      - Join your first coding contest
      - Start building your coding streak!

      Your account is currently pending admin approval. You'll receive another email once your account is activated.

      In the meantime, you can browse our public leaderboard and prepare for your first contest.

      Visit codCampus: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}

      Happy coding!

      The codCampus Team

      © 2024 codCampus. All rights reserved.
      Questions? Contact us at support@codcampus.edu
    `
  }
}

export function generateApprovalEmail(name: string): EmailTemplate {
  return {
    subject: '🎉 Your codCampus Account Has Been Approved!',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Account Approved - codCampus</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #00C896 0%, #89F2E8 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: linear-gradient(135deg, #00C896 0%, #89F2E8 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
            .highlight { background: #e8f5e8; padding: 15px; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🎉 Account Approved!</h1>
            <p>Welcome to the codCampus community</p>
          </div>

          <div class="content">
            <h2>Great news, ${name}!</h2>

            <p>Your codCampus account has been <strong>approved</strong> by our administrators! 🎊</p>

            <div class="highlight">
              <h3>🚀 You can now:</h3>
              <ul>
                <li>Access your personalized dashboard</li>
                <li>Participate in coding contests</li>
                <li>Submit solutions to problems</li>
                <li>Track your coding progress and streaks</li>
                <li>Compete on leaderboards</li>
                <li>Earn badges and achievements</li>
              </ul>
            </div>

            <p>Start your coding journey today by solving your first problem or joining an upcoming contest!</p>

            <div style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/student" class="button">
                Go to Dashboard
              </a>
            </div>

            <p>Remember to maintain your daily coding streak by solving at least one problem every day!</p>

            <p>Happy coding! 💻</p>

            <p><strong>The codCampus Team</strong></p>
          </div>

          <div class="footer">
            <p>© 2024 codCampus. All rights reserved.</p>
            <p>Questions? Contact us at support@codcampus.edu</p>
          </div>
        </body>
      </html>
    `,
    text: `
      Account Approved!

      Great news, ${name}!

      Your codCampus account has been approved by our administrators!

      You can now:
      - Access your personalized dashboard
      - Participate in coding contests
      - Submit solutions to problems
      - Track your coding progress and streaks
      - Compete on leaderboards
      - Earn badges and achievements

      Start your coding journey today!

      Go to Dashboard: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/student

      Remember to maintain your daily coding streak by solving at least one problem every day!

      Happy coding!

      The codCampus Team

      © 2024 codCampus. All rights reserved.
      Questions? Contact us at support@codcampus.edu
    `
  }
}

export function generateContestReminderEmail(name: string, contestName: string, startTime: string): EmailTemplate {
  return {
    subject: `⏰ Reminder: ${contestName} starts soon!`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Contest Reminder - codCampus</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #00C896 0%, #89F2E8 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: linear-gradient(135deg, #00C896 0%, #89F2E8 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
            .highlight { background: #fff3cd; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #ffc107; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>⏰ Contest Reminder</h1>
            <p>Get ready for ${contestName}</p>
          </div>

          <div class="content">
            <h2>Hi ${name}!</h2>

            <p>Just a friendly reminder that <strong>${contestName}</strong> is starting soon!</p>

            <div class="highlight">
              <h3>📅 Contest Details:</h3>
              <p><strong>Contest:</strong> ${contestName}</p>
              <p><strong>Start Time:</strong> ${new Date(startTime).toLocaleString()}</p>
              <p><strong>Duration:</strong> Check the contest page for details</p>
            </div>

            <p>Make sure you're prepared:</p>
            <ul>
              <li>✅ Review the contest rules</li>
              <li>✅ Check your internet connection</li>
              <li>✅ Have your coding environment ready</li>
              <li>✅ Join a few minutes early</li>
            </ul>

            <div style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/contests" class="button">
                View Contest Details
              </a>
            </div>

            <p>Good luck and may the best coder win! 🏆</p>

            <p><strong>The codCampus Team</strong></p>
          </div>

          <div class="footer">
            <p>© 2024 codCampus. All rights reserved.</p>
            <p>Questions? Contact us at support@codcampus.edu</p>
          </div>
        </body>
      </html>
    `,
    text: `
      Contest Reminder

      Hi ${name}!

      Just a friendly reminder that ${contestName} is starting soon!

      Contest Details:
      - Contest: ${contestName}
      - Start Time: ${new Date(startTime).toLocaleString()}

      Make sure you're prepared:
      - Review the contest rules
      - Check your internet connection
      - Have your coding environment ready
      - Join a few minutes early

      View Contest Details: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/contests

      Good luck and may the best coder win!

      The codCampus Team

      © 2024 codCampus. All rights reserved.
      Questions? Contact us at support@codcampus.edu
    `
  }
}

export function generateStreakMilestoneEmail(name: string, streakDays: number): EmailTemplate {
  const milestones = {
    7: { name: "Week Warrior", icon: "🔥" },
    30: { name: "Consistency King", icon: "👑" },
    100: { name: "Century Champion", icon: "💯" }
  }

  const milestone = milestones[streakDays as keyof typeof milestones]

  return {
    subject: `${milestone?.icon || '🎉'} Congratulations! ${streakDays}-Day Streak Achieved!`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Streak Milestone - codCampus</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #00C896 0%, #89F2E8 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: linear-gradient(135deg, #00C896 0%, #89F2E8 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
            .highlight { background: #e8f5e8; padding: 15px; border-radius: 6px; margin: 20px 0; }
            .streak-number { font-size: 48px; font-weight: bold; color: #00C896; text-align: center; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${milestone?.icon || '🎉'} Amazing Achievement!</h1>
            <p>You've reached a new coding milestone</p>
          </div>

          <div class="content">
            <h2>Congratulations, ${name}!</h2>

            <div class="streak-number">
              ${streakDays} Days! 🔥
            </div>

            <p><strong>You've maintained a ${streakDays}-day coding streak!</strong> 🎊</p>

            ${milestone ? `
              <div class="highlight">
                <h3>🏆 Badge Earned: ${milestone.name}</h3>
                <p>This achievement has been added to your profile. Keep up the fantastic work!</p>
              </div>
            ` : ''}

            <p>Your dedication to daily coding practice is truly inspiring. Consistency is key to becoming a great programmer!</p>

            <div class="highlight">
              <h3>💡 Tips to Maintain Your Streak:</h3>
              <ul>
                <li>Set aside dedicated coding time each day</li>
                <li>Start with easier problems when you're short on time</li>
                <li>Join the community for motivation and support</li>
                <li>Track your progress and celebrate small wins</li>
              </ul>
            </div>

            <div style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/profile" class="button">
                View Your Profile
              </a>
            </div>

            <p>You're doing amazing! Keep coding! 💻✨</p>

            <p><strong>The codCampus Team</strong></p>
          </div>

          <div class="footer">
            <p>© 2024 codCampus. All rights reserved.</p>
            <p>Questions? Contact us at support@codcampus.edu</p>
          </div>
        </body>
      </html>
    `,
    text: `
      Amazing Achievement!

      Congratulations, ${name}!

      You've maintained a ${streakDays}-day coding streak!

      ${milestone ? `Badge Earned: ${milestone.name}` : ''}

      Your dedication to daily coding practice is truly inspiring. Consistency is key to becoming a great programmer!

      Tips to Maintain Your Streak:
      - Set aside dedicated coding time each day
      - Start with easier problems when you're short on time
      - Join the community for motivation and support
      - Track your progress and celebrate small wins

      View Your Profile: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/profile

      You're doing amazing! Keep coding!

      The codCampus Team

      © 2024 codCampus. All rights reserved.
      Questions? Contact us at support@codcampus.edu
    `
  }
}

export function generateContestResultsEmail(name: string, contestName: string, rank: number, score: number): EmailTemplate {
  return {
    subject: `🏆 ${contestName} Results Are In!`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Contest Results - codCampus</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #00C896 0%, #89F2E8 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: linear-gradient(135deg, #00C896 0%, #89F2E8 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
            .highlight { background: #e8f5e8; padding: 15px; border-radius: 6px; margin: 20px 0; }
            .rank-display { font-size: 36px; font-weight: bold; color: #00C896; text-align: center; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🏆 Contest Results!</h1>
            <p>${contestName} has concluded</p>
          </div>

          <div class="content">
            <h2>Hi ${name}!</h2>

            <p>The results for <strong>${contestName}</strong> are now available! 🎉</p>

            <div class="rank-display">
              Rank #${rank}
            </div>

            <div class="highlight">
              <h3>📊 Your Performance:</h3>
              <p><strong>Final Rank:</strong> #${rank}</p>
              <p><strong>Score:</strong> ${score} points</p>
              ${rank <= 3 ? '<p>🎖️ Congratulations on your top placement!</p>' : ''}
            </div>

            <p>Whether you finished at the top or learned valuable lessons along the way, every contest is a step forward in your coding journey!</p>

            <div class="highlight">
              <h3>💡 What to do next:</h3>
              <ul>
                <li>Review your submissions and learn from mistakes</li>
                <li>Practice similar problems to improve</li>
                <li>Join the next contest to climb higher</li>
                <li>Share your experience with the community</li>
              </ul>
            </div>

            <div style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/leaderboard" class="button">
                View Full Leaderboard
              </a>
            </div>

            <p>Keep pushing your limits! 🚀</p>

            <p><strong>The codCampus Team</strong></p>
          </div>

          <div class="footer">
            <p>© 2024 codCampus. All rights reserved.</p>
            <p>Questions? Contact us at support@codcampus.edu</p>
          </div>
        </body>
      </html>
    `,
    text: `
      Contest Results!

      Hi ${name}!

      The results for ${contestName} are now available!

      Your Performance:
      - Final Rank: #${rank}
      - Score: ${score} points
      ${rank <= 3 ? '- Congratulations on your top placement!' : ''}

      Whether you finished at the top or learned valuable lessons along the way, every contest is a step forward in your coding journey!

      What to do next:
      - Review your submissions and learn from mistakes
      - Practice similar problems to improve
      - Join the next contest to climb higher
      - Share your experience with the community

      View Full Leaderboard: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/leaderboard

      Keep pushing your limits!

      The codCampus Team

      © 2024 codCampus. All rights reserved.
      Questions? Contact us at support@codcampus.edu
    `
  }
}

export function generateRestrictionEmail(name: string, reason: string): EmailTemplate {
  return {
    subject: '⚠️ Important: Your codCampus Account Has Been Restricted',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Account Restricted - codCampus</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #EF4444 0%, #F87171 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
            .reason-box { background: #FEE2E2; border-left: 4px solid #EF4444; padding: 15px; margin: 20px 0; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>⚠️ Account Restricted</h1>
            <p>Access to codCampus features has been limited</p>
          </div>

          <div class="content">
            <h2>Hi ${name},</h2>

            <p>We are writing to inform you that your codCampus account has been <strong>restricted</strong> by an administrator.</p>

            <div class="reason-box">
              <h3>Restriction Reason:</h3>
              <p>${reason}</p>
            </div>

            <p>While restricted, you will have limited access to the platform. You may still be able to view certain public pages, but contest participation and problem submissions may be disabled.</p>

            <p>If you believe this is a mistake or would like to appeal this decision, please contact the administration department at your earliest convenience.</p>

            <p>Regards,</p>
            <p><strong>The codCampus Admin Team</strong></p>
          </div>

          <div class="footer">
            <p>© 2024 codCampus. All rights reserved.</p>
            <p>Technical Support: support@codcampus.edu</p>
          </div>
        </body>
      </html>
    `,
    text: `
      Account Restricted

      Hi ${name},

      We are writing to inform you that your codCampus account has been restricted by an administrator.

      Restriction Reason:
      ${reason}

      While restricted, you will have limited access to the platform. Contest participation and problem submissions may be disabled.

      If you believe this is a mistake, please contact the administration department.

      Regards,
      The codCampus Admin Team

      © 2024 codCampus. All rights reserved.
    `
  }
}

export function generateRevocationEmail(name: string): EmailTemplate {
  return {
    subject: '✅ codCampus Account Restriction Lifted',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Restriction Lifted - codCampus</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10B981 0%, #34D399 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: linear-gradient(135deg, #10B981 0%, #34D399 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>✅ Restriction Lifted</h1>
            <p>Your full access has been restored</p>
          </div>

          <div class="content">
            <h2>Hi ${name}!</h2>

            <p>Good news! The restriction on your codCampus account has been <strong>lifted</strong> by an administrator.</p>

            <p>You now have full access to all platform features, including:</p>
            <ul>
              <li>Participating in live contests</li>
              <li>Submitting solutions to problems</li>
              <li>Tracking streaks and leaderboard progress</li>
            </ul>

            <div style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard" class="button">
                Return to Dashboard
              </a>
            </div>

            <p>Welcome back! Let's get back to coding.</p>

            <p>Regards,</p>
            <p><strong>The codCampus Team</strong></p>
          </div>

          <div class="footer">
            <p>© 2024 codCampus. All rights reserved.</p>
          </div>
        </body>
      </html>
    `,
    text: `
      Restriction Lifted

      Hi ${name}!

      Good news! The restriction on your codCampus account has been lifted by an administrator.

      You now have full access to all platform features.

      Welcome back! Let's get back to coding.

      Return to Dashboard: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard

      Regards,
      The codCampus Team

      © 2024 codCampus. All rights reserved.
    `
  }
}
