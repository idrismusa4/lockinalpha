"use client"

import { useUser, useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import {
  Video,
  Upload,
  Sparkles,
  ArrowRight,
  BookOpen,
  Clock,
  Zap,
  BarChart3,
  Lightbulb,
  Rocket,
  Shapes,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import RecentVideos from "@/components/dashboard/recent-videos"
import FloatingElement from "@/components/dashboard/floating-element"
import { WelcomeProfileModal } from "@/components/dashboard/welcome-profile-modal"

export default function DashboardPage() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace('/auth/login');
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded) return null;
  if (!isSignedIn) return null;

  return <DashboardContent />;
}

function DashboardContent() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [activeCard, setActiveCard] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    setIsLoaded(true)
    const timer = setTimeout(() => setProgress(70), 500)
    return () => clearTimeout(timer)
  }, [])

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  }

  const stats = [
    {
      title: "Videos Created",
      value: "12",
      icon: Video,
      color: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
    },
    {
      title: "Hours Saved",
      value: "24",
      icon: Clock,
      color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    },
    {
      title: "AI Insights",
      value: "5",
      icon: Lightbulb,
      color: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
    },
    {
      title: "Templates Used",
      value: "8",
      icon: Shapes,
      color: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
    },
  ]

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Floating elements for visual interest */}
      <FloatingElement
        className="absolute top-20 right-[10%] opacity-20 dark:opacity-10 z-0"
        icon={<Sparkles className="h-6 w-6 text-purple-500" />}
        size="lg"
      />
      <FloatingElement
        className="absolute bottom-40 left-[5%] opacity-20 dark:opacity-10 z-0"
        icon={<Zap className="h-5 w-5 text-blue-500" />}
        size="md"
      />
      <FloatingElement
        className="absolute top-60 left-[15%] opacity-20 dark:opacity-10 z-0"
        icon={<BookOpen className="h-4 w-4 text-green-500" />}
        size="sm"
      />

      {/* Welcome Modal - will only show after sign-up based on localStorage flag */}
      <WelcomeProfileModal />

      <main className="relative z-10 px-4 py-8 md:px-8 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Bring your <span className="gradient-text">learning to life</span> 🚀
          </h1>
          <p className="text-muted-foreground mt-2 max-w-3xl">
            Your learning style is unique—your educational tools should be too. Create your perfect video lectures with
            LockIn.
          </p>
        </motion.div>

        {/* Progress overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-lg font-semibold">Your Learning Progress</h2>
              <p className="text-sm text-muted-foreground">You're making great progress! Keep it up.</p>
            </div>
            <Badge
              variant="outline"
              className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800"
            >
              <Rocket className="mr-1 h-3 w-3" /> On Track
            </Badge>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Course completion</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </motion.div>

        {/* Main CTA Section */}
        <motion.div
          variants={container}
          initial="hidden"
          animate={isLoaded ? "show" : "hidden"}
          className="grid grid-cols-1 gap-6 md:grid-cols-2 mb-12"
        >
          <motion.div variants={item}>
            <Link
              href="/create-videos"
              className="block"
              onMouseEnter={() => setActiveCard("create")}
              onMouseLeave={() => setActiveCard(null)}
            >
              <Card
                className={`group relative overflow-hidden border-2 transition-all duration-300 card-hover ${
                  activeCard === "create"
                    ? "border-purple-400 dark:border-purple-600"
                    : "border-slate-200 dark:border-slate-800"
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 opacity-20 group-hover:opacity-40 transition-opacity" />
                <CardContent className="p-6 md:p-8">
                  <motion.div
                    className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <Video className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </motion.div>
                  <h3 className="text-xl font-semibold mb-2">Create a Video</h3>
                  <p className="text-muted-foreground mb-6">
                    Write a script or use AI to generate engaging video lectures from your ideas.
                  </p>
                  <div className="flex items-center text-purple-600 font-medium group-hover:text-purple-700 transition-colors">
                    Start Creating
                    <motion.div
                      animate={{ x: activeCard === "create" ? 5 : 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </motion.div>
                  </div>
                  <div className="absolute bottom-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Sparkles className="h-24 w-24 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>

          <motion.div variants={item}>
            <Link
              href="/upload-files"
              className="block"
              onMouseEnter={() => setActiveCard("upload")}
              onMouseLeave={() => setActiveCard(null)}
            >
              <Card
                className={`group relative overflow-hidden border-2 transition-all duration-300 card-hover ${
                  activeCard === "upload"
                    ? "border-blue-400 dark:border-blue-600"
                    : "border-slate-200 dark:border-slate-800"
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 opacity-20 group-hover:opacity-40 transition-opacity" />
                <CardContent className="p-6 md:p-8">
                  <motion.div
                    className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30"
                    whileHover={{ scale: 1.1, rotate: -5 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <Upload className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </motion.div>
                  <h3 className="text-xl font-semibold mb-2">Upload Files</h3>
                  <p className="text-muted-foreground mb-6">
                    Convert your study materials, notes, and documents into engaging video lectures.
                  </p>
                  <div className="flex items-center text-blue-600 font-medium group-hover:text-blue-700 transition-colors">
                    Upload Now
                    <motion.div
                      animate={{ x: activeCard === "upload" ? 5 : 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </motion.div>
                  </div>
                  <div className="absolute bottom-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Sparkles className="h-24 w-24 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-semibold mb-6">Your Stats</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.title}
                whileHover={{ scale: 1.03 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <Card className="border border-slate-200 dark:border-slate-800 card-hover">
                  <CardContent className="p-6">
                    <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-full ${stat.color}`}>
                      <stat.icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-3xl font-bold">{stat.value}</h3>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-semibold mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <QuickActionCard
              title="Browse Templates"
              description="Use pre-made templates to get started quickly"
              icon={BookOpen}
              color="purple"
              href="/templates"
            />
            <QuickActionCard
              title="AI Script Generator"
              description="Generate scripts with our AI assistant"
              icon={Lightbulb}
              color="blue"
              href="/ai-generator"
            />
            <QuickActionCard
              title="My Library"
              description="Access your saved videos and projects"
              icon={BookOpen}
              color="green"
              href="/library"
            />
            <QuickActionCard
              title="Interactive Elements"
              description="Add quizzes and interactive elements"
              icon={Shapes}
              color="amber"
              href="/interactive"
            />
          </div>
        </motion.div>

        {/* Recent Videos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <h2 className="text-2xl font-semibold mb-6">Recent Videos</h2>
          <RecentVideos />
        </motion.div>
      </main>
    </div>
  )
}

function QuickActionCard({
  title,
  description,
  icon: Icon,
  color,
  href,
}: {
  title: string
  description: string
  icon: any
  color: "purple" | "blue" | "green" | "amber"
  href: string
}) {
  const colorMap = {
    purple:
      "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/50",
    blue: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50",
    green:
      "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50",
    amber:
      "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50",
  }

  return (
    <Link href={href}>
      <motion.div
        whileHover={{ scale: 1.03 }}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
        className={`flex items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 ${colorMap[color]} transition-colors cursor-pointer`}
      >
        <div className="flex-shrink-0">
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <h3 className="font-medium">{title}</h3>
          <p className="text-sm opacity-80">{description}</p>
        </div>
      </motion.div>
    </Link>
  )
}
