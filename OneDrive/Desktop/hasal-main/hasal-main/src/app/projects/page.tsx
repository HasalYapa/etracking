"use client"

import { motion } from "framer-motion"
import { Github, ExternalLink, Calendar, Tag } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

// Sample projects data
const projects = [
  {
    id: "1",
    title: "Smart Home Energy Management",
    description: "Full-stack Smart Home Energy Management solution with Next.js, Superbase",
    longDescription: "A comprehensive smart home energy management platform built with modern web technologies. Features include user authentication, device monitoring, energy consumption tracking, automated scheduling, real-time analytics, and smart optimization algorithms. The platform is fully responsive and optimized for performance.",
    technologies: ["Next.js", "TypeScript", "Superbase", "Tailwind CSS", "Prisma"],
    githubUrl: "https://github.com/HasalYapa/smart-home-energy-system",
    liveUrl: "https://www.smartenergy.website/",
    imageUrl: "/project1.png",
    category: "web",
    status: "completed",
    featured: true,
    startDate: "2024-01-15",
    endDate: "2024-03-20",
  },
  {
    id: "2",
    title: "Financial Management",
    description: "Track expenses, set budgets, and achieve your savings goals with our easy-to-use platform",
    longDescription: "A comprehensive financial management platform that helps users take control of their finances. Features include expense tracking, budget planning, savings goal management, financial analytics, transaction categorization, and personalized insights. Built with modern web technologies for optimal performance and user experience.",
    technologies: ["React", "Node.js", "Next.js"],
    githubUrl: "https://github.com/HasalYapa/money-saving",
    liveUrl: "https://www.moneywise.digital/",
    imageUrl: "/project2.png",
    category: "web",
    status: "completed",
    featured: true,
    startDate: "2023-09-10",
    endDate: "2023-12-15",
  },
  {
    id: "3",
    title: "AI Chat Assistant",
    description: "Intelligent chat assistant powered by OpenAI API with context memory",
    longDescription: "An advanced AI chat assistant that maintains conversation context and provides intelligent responses. Features include conversation history, context-aware responses, multiple AI model support, and custom personality settings. Built with Next.js and integrated with OpenAI's GPT models.",
    technologies: ["Next.js", "OpenAI API", "Pinecone", "Tailwind CSS", "Vercel AI SDK"],
    githubUrl: "https://github.com/yourusername/ai-chat",
    liveUrl: "https://your-ai-chat.vercel.app",
    imageUrl: "/project.png",
    category: "ai",
    status: "completed",
    featured: true,
    startDate: "2024-02-01",
    endDate: "2024-04-10",
  },
  {
    id: "4",
    title: "Weather Dashboard",
    description: "Beautiful weather dashboard with location-based forecasts",
    longDescription: "A stunning weather dashboard that provides detailed weather information and forecasts. Features location-based weather data, interactive maps, weather alerts, and beautiful data visualizations. Built with React and integrated with multiple weather APIs.",
    technologies: ["React", "Chart.js", "OpenWeatherMap API", "Styled Components"],
    githubUrl: "https://github.com/yourusername/weather-dashboard",
    liveUrl: "https://your-weather.vercel.app",
    imageUrl: "/project.png",
    category: "web",
    status: "completed",
    featured: false,
    startDate: "2023-07-01",
    endDate: "2023-08-15",
  },
  {
    id: "5",
    title: "Portfolio Website",
    description: "Personal portfolio website built with Next.js and Tailwind CSS",
    longDescription: "A modern, responsive portfolio website showcasing my work and skills. Features include dark mode support, smooth animations, blog integration with Notion, contact form with email notifications, and optimized performance. Built with Next.js 15 and Tailwind CSS.",
    technologies: ["Next.js", "Tailwind CSS", "Framer Motion", "Notion API", "Supabase"],
    githubUrl: "https://github.com/yourusername/portfolio",
    liveUrl: "https://yourportfolio.vercel.app",
    imageUrl: "/project.png",
    category: "web",
    status: "completed",
    featured: false,
    startDate: "2024-05-01",
    endDate: "2024-06-15",
  },
  {
    id: "6",
    title: "Mobile Expense Tracker",
    description: "React Native app for tracking personal expenses",
    longDescription: "A comprehensive expense tracking mobile application built with React Native. Features include expense categorization, budget setting, visual reports, receipt scanning, and data synchronization across devices. Available for both iOS and Android platforms.",
    technologies: ["React Native", "Expo", "AsyncStorage", "Victory Charts"],
    githubUrl: "https://github.com/yourusername/expense-tracker",
    liveUrl: "https://play.google.com/store/apps/details?id=com.yourapp",
    imageUrl: "/project.png",
    category: "mobile",
    status: "in-progress",
    featured: false,
    startDate: "2024-04-01",
  },
]

const categories = [
  { id: "all", label: "All Projects" },
  { id: "web", label: "Web Development" },
  { id: "mobile", label: "Mobile Apps" },
  { id: "ai", label: "AI/ML" },
  { id: "desktop", label: "Desktop" },
  { id: "other", label: "Other" },
]

export default function ProjectsPage() {
  return (
    <div className="min-h-screen py-20 bg-black">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl sm:text-5xl font-bold text-primary mb-4">
            My Projects
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Here's a collection of projects I've worked on, showcasing my skills in 
            web development, mobile apps, and AI/ML solutions.
          </p>
        </motion.div>

        {/* Filter Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-4 mb-12"
        >
          {categories.map((category) => (
            <Button
              key={category.id}
              variant="outline"
              className="rounded-full"
            >
              {category.label}
            </Button>
          ))}
        </motion.div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
            >
              <Card className="group hover:shadow-lg transition-all duration-300 h-full">
                <div className="aspect-video bg-muted rounded-t-lg overflow-hidden relative">
                  <img
                    src={project.imageUrl}
                    alt={project.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-4 right-4 flex gap-2">
                    {project.featured && (
                      <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-700">
                        Featured
                      </Badge>
                    )}
                    <Badge variant="outline" className="bg-background/80 backdrop-blur-sm">
                      {project.status === "completed" ? "Completed" : "In Progress"}
                    </Badge>
                  </div>
                </div>
                
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">{project.title}</CardTitle>
                    <Badge variant="outline">{project.category}</Badge>
                  </div>
                  <CardDescription>{project.description}</CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {project.technologies.slice(0, 3).map((tech) => (
                      <span
                        key={tech}
                        className="px-2 py-1 bg-primary/10 text-primary rounded-md text-sm"
                      >
                        {tech}
                      </span>
                    ))}
                    {project.technologies.length > 3 && (
                      <span className="px-2 py-1 bg-muted text-muted-foreground rounded-md text-sm">
                        +{project.technologies.length - 3} more
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {new Date(project.startDate).toLocaleDateString("en-US", {
                        month: "short",
                        year: "numeric",
                      })}
                      {project.endDate && (
                        <>
                          {" - "}
                          {new Date(project.endDate).toLocaleDateString("en-US", {
                            month: "short",
                            year: "numeric",
                          })}
                        </>
                      )}
                    </span>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button asChild variant="outline" size="sm" className="flex-1">
                      <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                        <Github className="mr-2 h-4 w-4" />
                        Code
                      </a>
                    </Button>
                    <Button asChild size="sm" className="flex-1">
                      <a href={project.liveUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Live
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-center mt-16"
        >
          <p className="text-muted-foreground mb-4">
            Want to see more of my work or discuss a project?
          </p>
          <Button asChild>
            <a href="/contact">Get In Touch</a>
          </Button>
        </motion.div>
      </div>
    </div>
  )
} 