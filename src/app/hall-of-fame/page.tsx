'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Crown, Trophy, Medal, Star, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

// Mock Data for Hall of Fame
const winners = [
    {
        month: 'January 2026',
        name: 'Aditya Patil',
        username: 'aditya_p',
        points: 2450,
        avatarSeed: 'Aditya',
        quote: "Consistency is key. Solved 50+ problems this month!",
        badge: 'gold'
    },
    {
        month: 'December 2025',
        name: 'Riya Sharma',
        username: 'riya_codes',
        points: 2100,
        avatarSeed: 'Riya',
        quote: "Loved the dynamic programming contest.",
        badge: 'gold'
    },
    {
        month: 'November 2025',
        name: 'Rahul Deshmukh',
        username: 'rahul_d',
        points: 1950,
        avatarSeed: 'Rahul',
        quote: "First time topping the leaderboard!",
        badge: 'gold'
    },
    {
        month: 'October 2025',
        name: 'Sneha Gupta',
        username: 'sneha_g',
        points: 2200,
        avatarSeed: 'Sneha',
        quote: "Algorithms are fun when you understand them.",
        badge: 'gold'
    },
    {
        month: 'September 2025',
        name: 'Rahul Deshmukh',
        username: 'rahul_d',
        points: 2050,
        avatarSeed: 'Rahul',
        quote: "Back to back wins! Consistency pays off.",
        badge: 'gold'
    }
]

export default function HallOfFamePage() {
    const router = useRouter()

    return (
        <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
            {/* Background Gradients */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px]" />
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">

                {/* Header */}
                <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
                    <div className="flex items-center gap-4 self-start">
                        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full hover:bg-white/10">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                                <Crown className="h-6 w-6 md:h-8 md:w-8 text-yellow-500" />
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-500">
                                    Hall of Fame
                                </span>
                            </h1>
                            <p className="text-sm text-muted-foreground mt-1">Celebrating our top performers and coding champions.</p>
                        </div>
                    </div>
                </div>

                {/* Winners Grid - Compact Design */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {winners.map((winner, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            className="group relative overflow-hidden rounded-xl border border-white/5 bg-[#0a0a0a]/50 hover:bg-[#0a0a0a]/80 transition-all duration-300 hover:border-yellow-500/20"
                        >
                            {/* Month Badge */}
                            <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-white/5 border border-white/5 text-[10px] uppercase font-bold tracking-wider text-muted-foreground group-hover:text-foreground transition-colors z-10">
                                {winner.month}
                            </div>

                            <div className="p-4 flex items-center gap-4">
                                <div className="relative flex-shrink-0">
                                    {/* Crown on Avatar */}
                                    <div className="absolute -top-3 -right-2 rotate-12 bg-black/80 rounded-full p-0.5 border border-yellow-500/30 backdrop-blur-sm z-20">
                                        <Crown className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                                    </div>
                                    <Avatar className="h-12 w-12 border-2 border-yellow-500/20 group-hover:border-yellow-500/50 transition-colors">
                                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${winner.avatarSeed}`} alt={winner.name} />
                                        <AvatarFallback className="text-xs">{winner.name[0]}</AvatarFallback>
                                    </Avatar>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h3 className="text-sm font-bold truncate group-hover:text-yellow-400 transition-colors">{winner.name}</h3>
                                    <p className="text-xs text-muted-foreground truncate">@{winner.username}</p>

                                    <div className="flex items-center gap-2 mt-1.5">
                                        <div className="flex items-center gap-1 text-[10px] font-medium text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 rounded">
                                            <Star className="h-3 w-3 fill-yellow-500" />
                                            {winner.points}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

            </div>
        </div>
    )
}

function QuoteIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="currentColor"
            stroke="none"
        >
            <path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C19.5693 16 20.017 15.5523 20.017 15V9C20.017 8.44772 19.5693 8 19.017 8H15.017C14.4647 8 14.017 8.44772 14.017 9V11C14.017 11.5523 13.5693 12 13.017 12H12.017V5H22.017V15C22.017 18.3137 19.3307 21 16.017 21H14.017ZM5.0166 21L5.0166 18C5.0166 16.8954 5.91203 16 7.0166 16H10.0166C10.5689 16 11.0166 15.5523 11.0166 15V9C11.0166 8.44772 10.5689 8 10.0166 8H6.0166C5.46432 8 5.0166 8.44772 5.0166 9V11C5.0166 11.5523 4.56889 12 4.0166 12H3.0166V5H13.0166V15C13.0166 18.3137 10.3303 21 7.0166 21H5.0166Z" />
        </svg>
    )
}
