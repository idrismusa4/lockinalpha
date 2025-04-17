"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { motion, useScroll, useTransform, useInView } from "framer-motion"
import { ArrowRight, CheckCircle2, Play, Sparkles, Video, Upload, Brain, Zap, Users, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Lexend } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"
import { initializeSupabaseStorage } from "./supabase"
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from '@vercel/speed-insights/next'
import LandingHeader from "../components/landing/landing-header"
import LandingFooter from "../components/landing/landing-footer"
import GridBackground from "../components/ui/grid-background"

// Ensure Supabase storage is initialized on the server side
if (typeof window === 'undefined') {
  try {
    console.log('Server-side initialization of Supabase storage buckets...');
    // Use this pattern to ensure the promise is handled
    initializeSupabaseStorage().then(() => {
      console.log('Supabase storage buckets initialized successfully');
    }).catch((error) => {
      console.error('Failed to initialize Supabase storage buckets:', error);
    });
  } catch (error) {
    console.error('Error during Supabase storage initialization:', error);
  }
}

const lexend = Lexend({ subsets: ["latin"] });

export default function LandingPage() {
  const [isLoaded, setIsLoaded] = useState(false)
  const heroRef = useRef(null)
  const featuresRef = useRef(null)
  const testimonialsRef = useRef(null)
  const isHeroInView = useInView(heroRef, { once: true })
  const isFeaturesInView = useInView(featuresRef, { once: true, margin: "-100px" })
  const isTestimonialsInView = useInView(testimonialsRef, { once: true, margin: "-100px" })

  const { scrollYProgress } = useScroll()
  const y = useTransform(scrollYProgress, [0, 1], [0, -100])

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  }

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Script Generation",
      description: "Transform your notes into engaging scripts with our advanced AI technology.",
      color: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
    },
    {
      icon: Video,
      title: "Automatic Video Creation",
      description: "Convert scripts into professional-quality video lectures with just a few clicks.",
      color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    },
    {
      icon: Upload,
      title: "Easy Document Upload",
      description: "Upload your study materials and convert them directly into video content.",
      color: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
    },
    {
      icon: Zap,
      title: "Fast Processing",
      description: "Get your videos ready in minutes, not hours, with our optimized processing.",
      color: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
    },
    {
      icon: Users,
      title: "Collaboration Tools",
      description: "Share and collaborate on videos with classmates and teachers.",
      color: "bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400",
    },
    {
      icon: Shield,
      title: "Secure Content",
      description: "Your content is protected with enterprise-grade security and privacy controls.",
      color: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400",
    },
  ]

  const testimonials = [
    {
      name: "Alex Johnson",
      role: "Biology Student",
      content:
        "LockIn has completely transformed how I study. I can turn my lecture notes into engaging videos that make complex concepts easier to understand and remember.",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      name: "Sarah Williams",
      role: "Chemistry Teacher",
      content:
        "As an educator, LockIn has been a game-changer. I can quickly create supplementary video materials for my students, saving me hours of preparation time.",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      name: "Michael Chen",
      role: "Computer Science Major",
      content:
        "The AI script generation is incredibly accurate for technical content. I've used LockIn to create tutorial videos for programming concepts that my study group loves.",
      avatar: "/placeholder.svg?height=40&width=40",
    },
  ]

  // Floating elements for visual interest
  const floatingElements = [
    { top: "10%", left: "10%", size: 60, rotate: 15, delay: 0 },
    { top: "20%", right: "15%", size: 40, rotate: -10, delay: 0.2 },
    { top: "60%", left: "5%", size: 50, rotate: 5, delay: 0.4 },
    { top: "70%", right: "10%", size: 70, rotate: -5, delay: 0.6 },
    { top: "85%", left: "20%", size: 45, rotate: 12, delay: 0.8 },
  ]

  return (
    <div className={lexend.className}>
      <Providers>
        <Analytics />
        <SpeedInsights />
        <div className="flex min-h-screen flex-col">
          <main className="flex-1">
            <GridBackground className="min-h-screen overflow-hidden">
              <LandingHeader />

              {/* Hero Section */}
              <section ref={heroRef} className="relative overflow-hidden pt-24 pb-20 md:pt-32 md:pb-24">
                <div className="container mx-auto px-4 md:px-6">
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-12 items-center">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={isHeroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                      transition={{ duration: 0.5 }}
                      className="space-y-4"
                    >
                      <Badge
                        className="inline-flex bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 mb-2"
                        variant="secondary"
                      >
                        <Sparkles className="mr-1 h-3 w-3" /> New AI Features
                      </Badge>
                      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter">
                        Bring your learning to{" "}
                        <span className="bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
                          life.
                        </span>
                      </h1>
                      <p className="text-xl text-muted-foreground md:text-2xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                        Your learning style is unique—your educational tools should be too. Create your perfect learning
                        environment with LockIn's interactive tools.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3 pt-4">
                        <Button
                          size="lg"
                          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                          asChild
                        >
                          <Link href="/auth/signup">
                            Start Learning <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                        <Button size="lg" variant="outline" asChild>
                          <Link href="#how-it-works">
                            <Play className="mr-2 h-4 w-4" /> See How It Works
                          </Link>
                        </Button>
                      </div>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={isHeroInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      className="relative"
                    >
                      <div className="relative overflow-hidden rounded-xl border-2 border-slate-200 dark:border-slate-800 shadow-2xl -rotate-5 md:-rotate-3">
                        <img
                          src="/hero.png"
                          alt="LockIn Dashboard Preview"
                          className="w-full h-auto"
                        />
                        <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 to-blue-500/20 pointer-events-none" />
                      </div>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={isHeroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="absolute -bottom-6 -right-6 md:-bottom-8 md:-right-8 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4 shadow-lg"
                      >
                        <div className="flex items-center gap-4 rotate-5 md:rotate-0">
                          <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <p className="font-medium">Video Generated</p>
                            <p className="text-sm text-muted-foreground">Ready in just 2 minutes</p>
                          </div>
                        </div>
                      </motion.div>
                    </motion.div>
                  </div>
                </div>
              </section>

              {/* Trusted By Section */}
              <section className="py-12 border-y border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                <div className="container mx-auto px-4 md:px-6">
                  <div className="text-center mb-8">
                    <h2 className="text-xl font-medium text-muted-foreground">Loved by 50,000+ Students At</h2>
                  </div>
                  <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 opacity-70">
                    <img src="/placeholder.svg?height=40&width=120" alt="University Logo" className="h-8 md:h-10" />
                    <img src="/placeholder.svg?height=40&width=120" alt="University Logo" className="h-8 md:h-10" />
                    <img src="/placeholder.svg?height=40&width=120" alt="University Logo" className="h-8 md:h-10" />
                    <img src="/placeholder.svg?height=40&width=120" alt="University Logo" className="h-8 md:h-10" />
                    <img src="/placeholder.svg?height=40&width=120" alt="University Logo" className="h-8 md:h-10" />
                  </div>
                </div>
              </section>

              {/* Features Section */}
              <section ref={featuresRef} id="features" className="py-20 md:py-24">
                <div className="container mx-auto px-4 md:px-6">
                  <div className="text-center mb-12 md:mb-16">
                    <Badge
                      className="mb-4 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                      variant="secondary"
                    >
                      Features
                    </Badge>
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                      Everything You Need to Create Amazing Video Lectures
                    </h2>
                    <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                      LockIn combines powerful AI with an intuitive interface to help you create engaging educational content in
                      minutes.
                    </p>
                  </div>

                  <motion.div
                    variants={container}
                    initial="hidden"
                    animate={isFeaturesInView ? "show" : "hidden"}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
                  >
                    {features.map((feature, index) => (
                      <motion.div key={index} variants={item}>
                        <Card className="h-full border-2 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all hover:shadow-md">
                          <CardContent className="p-6">
                            <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-full ${feature.color}`}>
                              <feature.icon className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                            <p className="text-muted-foreground">{feature.description}</p>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              </section>

              {/* How It Works Section */}
              <section id="how-it-works" className="py-20 md:py-24 bg-slate-50 dark:bg-slate-900/50">
                <div className="container mx-auto px-4 md:px-6">
                  <div className="text-center mb-12 md:mb-16">
                    <Badge
                      className="mb-4 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                      variant="secondary"
                    >
                      How It Works
                    </Badge>
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                      Create Video Lectures in Three Simple Steps
                    </h2>
                    <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                      Our streamlined process makes it easy to transform your study materials into engaging video content.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                      viewport={{ once: true, margin: "-100px" }}
                      className="text-center"
                    >
                      <div className="mb-6 mx-auto w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-2xl font-bold text-purple-600 dark:text-purple-400">
                        1
                      </div>
                      <h3 className="text-xl font-semibold mb-3">Upload Your Materials</h3>
                      <p className="text-muted-foreground">
                        Upload your notes, documents, or study materials in various formats including PDF, Word, and PowerPoint.
                      </p>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      viewport={{ once: true, margin: "-100px" }}
                      className="text-center"
                    >
                      <div className="mb-6 mx-auto w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-2xl font-bold text-blue-600 dark:text-blue-400">
                        2
                      </div>
                      <h3 className="text-xl font-semibold mb-3">AI Generates Script</h3>
                      <p className="text-muted-foreground">
                        Our AI analyzes your content and creates a well-structured script optimized for video presentation.
                      </p>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.4 }}
                      viewport={{ once: true, margin: "-100px" }}
                      className="text-center"
                    >
                      <div className="mb-6 mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-2xl font-bold text-green-600 dark:text-green-400">
                        3
                      </div>
                      <h3 className="text-xl font-semibold mb-3">Get Your Video</h3>
                      <p className="text-muted-foreground">
                        The system automatically creates a professional video lecture with visuals, narration, and animations.
                      </p>
                    </motion.div>
                  </div>

                  <div className="mt-16 text-center">
                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                      asChild
                    >
                      <Link href="/auth/signup">
                        Try It Now <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </section>

              {/* Testimonials Section */}
              <section ref={testimonialsRef} className="py-20 md:py-24">
                <div className="container mx-auto px-4 md:px-6">
                  <div className="text-center mb-12 md:mb-16">
                    <Badge
                      className="mb-4 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                      variant="secondary"
                    >
                      Testimonials
                    </Badge>
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Loved by Students and Educators</h2>
                    <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                      See what our users are saying about how LockIn has transformed their learning and teaching experience.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                    {testimonials.map((testimonial, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={isTestimonialsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                      >
                        <Card className="h-full border-2 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all hover:shadow-md">
                          <CardContent className="p-6">
                            <div className="flex items-center gap-4 mb-4">
                              <Avatar>
                                <AvatarImage src={testimonial.avatar || "/placeholder.svg"} alt={testimonial.name} />
                                <AvatarFallback>{testimonial.name[0]}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{testimonial.name}</p>
                                <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                              </div>
                            </div>
                            <p className="italic text-muted-foreground">"{testimonial.content}"</p>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </section>

              {/* CTA Section */}
              <section className="py-20 md:py-24">
                <div className="container mx-auto px-4 md:px-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    viewport={{ once: true, margin: "-100px" }}
                    className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 p-8 md:p-12"
                  >
                    <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]" />
                    <div className="relative flex flex-col items-center text-center">
                      <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4">
                        Ready to Transform Your Study Materials?
                      </h2>
                      <p className="text-xl text-white/80 max-w-3xl mb-8">
                        Join thousands of students and educators who are already using LockIn to create engaging video lectures.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <Button size="lg" className="bg-white text-purple-600 hover:bg-white/90" asChild>
                          <Link href="/auth/signup">
                            Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                        <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10" asChild>
                          <Link href="/auth/login">Log In</Link>
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </section>

              <LandingFooter />
            </GridBackground>
          </main>
        </div>
      </Providers>
    </div>
  )
}
