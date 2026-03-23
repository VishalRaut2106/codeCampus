// GSAP animations for codCampus

import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { TextPlugin } from 'gsap/TextPlugin'

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger, TextPlugin)

export class AnimationController {
  private animations: Map<string, GSAPTimeline> = new Map()

  /**
   * Animate elements on scroll
   */
  animateOnScroll(selector: string, animation: GSAPAnimationConfig) {
    const elements = document.querySelectorAll(selector)

    elements.forEach((element, index) => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: element,
          start: "top 80%",
          end: "bottom 20%",
          toggleActions: "play none none reverse"
        }
      })

      if (animation.type === 'fadeInUp') {
        tl.from(element, {
          opacity: 0,
          y: 50,
          duration: animation.duration || 0.8,
          delay: (animation.delay || 0) + (index * (animation.stagger || 0.1))
        })
      } else if (animation.type === 'fadeInLeft') {
        tl.from(element, {
          opacity: 0,
          x: -50,
          duration: animation.duration || 0.8,
          delay: (animation.delay || 0) + (index * (animation.stagger || 0.1))
        })
      } else if (animation.type === 'fadeInRight') {
        tl.from(element, {
          opacity: 0,
          x: 50,
          duration: animation.duration || 0.8,
          delay: (animation.delay || 0) + (index * (animation.stagger || 0.1))
        })
      } else if (animation.type === 'scaleIn') {
        tl.from(element, {
          scale: 0.8,
          opacity: 0,
          duration: animation.duration || 0.8,
          delay: (animation.delay || 0) + (index * (animation.stagger || 0.1))
        })
      }

      this.animations.set(`${selector}_${index}`, tl)
    })
  }

  /**
   * Animate cards with stagger effect
   */
  animateCards(selector: string = '.glass-card') {
    this.animateOnScroll(selector, {
      type: 'fadeInUp',
      duration: 0.6,
      stagger: 0.1
    })
  }

  /**
   * Animate hero section
   */
  animateHero() {
    const heroTitle = document.querySelector('.hero-title')
    const heroSubtitle = document.querySelector('.hero-subtitle')
    const heroButton = document.querySelector('.hero-button')

    if (heroTitle) {
      gsap.from(heroTitle, {
        duration: 1.2,
        y: 50,
        opacity: 0,
        ease: "power3.out"
      })
    }

    if (heroSubtitle) {
      gsap.from(heroSubtitle, {
        duration: 1.2,
        y: 30,
        opacity: 0,
        delay: 0.3,
        ease: "power3.out"
      })
    }

    if (heroButton) {
      gsap.from(heroButton, {
        duration: 1.2,
        y: 20,
        opacity: 0,
        delay: 0.6,
        ease: "power3.out"
      })
    }
  }

  /**
   * Animate floating elements
   */
  animateFloatingElements() {
    const floatingElements = document.querySelectorAll('.animate-float')

    floatingElements.forEach((element, index) => {
      gsap.to(element, {
        y: -10,
        duration: 2 + (index * 0.5),
        repeat: -1,
        yoyo: true,
        ease: "power2.inOut",
        delay: index * 0.3
      })
    })
  }

  /**
   * Animate typing effect
   */
  animateTyping(selector: string, text: string, speed: number = 50) {
    const element = document.querySelector(selector)
    if (!element) return

    let i = 0
    const timer = setInterval(() => {
      if (i < text.length) {
        element.textContent += text.charAt(i)
        i++
      } else {
        clearInterval(timer)
      }
    }, speed)
  }

  /**
   * Animate motivational quotes rotation
   */
  animateQuoteRotation(selector: string = '.quote-text') {
    const quotes = document.querySelectorAll(selector)

    quotes.forEach((quote, index) => {
      gsap.set(quote, { opacity: 0, y: 20 })

      gsap.to(quote, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        delay: index * 3,
        repeat: -1,
        repeatDelay: (quotes.length - 1) * 3
      })
    })
  }

  /**
   * Animate button hover effects
   */
  animateButtonHovers() {
    const buttons = document.querySelectorAll('.glass-button')

    buttons.forEach(button => {
      button.addEventListener('mouseenter', () => {
        gsap.to(button, {
          scale: 1.05,
          duration: 0.3,
          ease: "power2.out"
        })
      })

      button.addEventListener('mouseleave', () => {
        gsap.to(button, {
          scale: 1,
          duration: 0.3,
          ease: "power2.out"
        })
      })
    })
  }

  /**
   * Animate leaderboard rank changes
   */
  animateLeaderboardUpdates() {
    const leaderboardItems = document.querySelectorAll('.leaderboard-item')

    leaderboardItems.forEach((item, index) => {
      gsap.from(item, {
        opacity: 0,
        x: -50,
        duration: 0.6,
        delay: index * 0.1,
        ease: "power3.out"
      })
    })
  }

  /**
   * Animate streak counter
   */
  animateStreakCounter(selector: string = '.streak-counter') {
    const counter = document.querySelector(selector)
    if (!counter) return

    gsap.from(counter, {
      scale: 0.8,
      opacity: 0,
      duration: 0.5,
      ease: "back.out(1.7)"
    })
  }

  /**
   * Animate badge earning
   */
  animateBadgeEarn(badgeElement: Element) {
    gsap.from(badgeElement, {
      scale: 0,
      rotation: 360,
      duration: 0.8,
      ease: "back.out(1.7)"
    })

    // Add sparkle effect
    const sparkle = document.createElement('div')
    sparkle.innerHTML = '✨'
    sparkle.style.position = 'absolute'
    sparkle.style.fontSize = '24px'
    sparkle.style.pointerEvents = 'none'

    if (badgeElement.parentElement) {
      badgeElement.parentElement.style.position = 'relative'
      badgeElement.parentElement.appendChild(sparkle)

      gsap.from(sparkle, {
        opacity: 0,
        scale: 0,
        duration: 0.5,
        ease: "power3.out"
      })

      setTimeout(() => {
        sparkle.remove()
      }, 2000)
    }
  }

  /**
   * Animate contest timer
   */
  animateContestTimer(selector: string = '.contest-timer') {
    const timer = document.querySelector(selector)
    if (!timer) return

    gsap.to(timer, {
      scale: 1.02,
      duration: 1,
      repeat: -1,
      yoyo: true,
      ease: "power2.inOut"
    })
  }

  /**
   * Animate page transitions
   */
  animatePageTransition() {
    gsap.from('.page-content', {
      opacity: 0,
      y: 20,
      duration: 0.6,
      ease: "power3.out"
    })
  }

  /**
   * Initialize all animations
   */
  init() {
    // Animate cards on scroll
    this.animateCards()

    // Animate floating elements
    this.animateFloatingElements()

    // Animate button hovers
    this.animateButtonHovers()

    // Animate page content
    this.animatePageTransition()
  }

  /**
   * Clean up animations
   */
  destroy() {
    this.animations.forEach(tl => tl.kill())
    this.animations.clear()
  }
}

// Animation configuration interface
interface GSAPAnimationConfig {
  type: 'fadeInUp' | 'fadeInLeft' | 'fadeInRight' | 'scaleIn'
  duration?: number
  delay?: number
  stagger?: number
}

// Create singleton instance
export const animationController = new AnimationController()
