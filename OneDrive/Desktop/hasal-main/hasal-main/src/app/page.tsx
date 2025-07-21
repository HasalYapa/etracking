"use client"

import React from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import Link from "next/link"
import { ArrowRight, Github, ExternalLink } from "lucide-react"
import Spline from '@splinetool/react-spline'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CardBody, CardContainer, CardItem } from "@/components/ui/3d-card"

// Sample featured projects data
const featuredProjects = [
  {
    id: "1",
    title: "Smart Home Energy Management",
    description: "Full-stack Smart Home Energy Management solution with Next.js, Superbase",
    technologies: ["Next.js", "TypeScript", "Superbase"],
    githubUrl: "https://github.com/HasalYapa/smart-home-energy-system",
    liveUrl: "https://www.smartenergy.website/",
    imageUrl: "/project1.png",
  },
  {
    id: "2",
    title: "Mobile Expense Tracker",
    description: "Track your expenses on the go with this intuitive mobile-first expense tracking application",
    technologies: ["React Native", "TypeScript", "Firebase", "Redux"],
    githubUrl: "https://github.com/HasalYapa/mobile-expense-tracker",
    liveUrl: "https://expense-tracker-mobile.vercel.app",
    imageUrl: "/project2.png",
  },
  {
    id: "3",
    title: "Financial Management",
    description: "Track expenses, set budgets, and achieve your savings goals with our easy-to-use platform",
    technologies: ["React", "Node.js", "Next.js"],
    githubUrl: "https://github.com/HasalYapa/money-saving",
    liveUrl: "https://www.moneywise.digital/",
    imageUrl: "/project2.png",
  },
  {
    id: "4",
    title: "AI Chat Assistant",
    description: "Intelligent chat assistant powered by OpenAI API with context memory",
    technologies: ["Next.js", "OpenAI API", "Pinecone", "Tailwind"],
    githubUrl: "https://github.com/yourusername/ai-chat",
    liveUrl: "https://your-ai-chat.vercel.app",
    imageUrl: "/project.png",
  },
]

export default function HomePage() {
  // Check if mobile navbar is open
  const [isMobileNavOpen, setIsMobileNavOpen] = React.useState(false);
  
  // Scroll detection for button visibility
  const [isHeroVisible, setIsHeroVisible] = React.useState(true);
  const { scrollY } = useScroll();

  React.useEffect(() => {
    // Listen for mobile navbar state changes
    const handleNavbarToggle = (event: CustomEvent) => {
      setIsMobileNavOpen(event.detail.isOpen);
    };
    
    window.addEventListener('mobileNavbarToggle', handleNavbarToggle as EventListener);
    
    return () => {
      window.removeEventListener('mobileNavbarToggle', handleNavbarToggle as EventListener);
    };
  }, []);

  React.useEffect(() => {
    // Hide buttons when scrolling past hero section (viewport height)
    const unsubscribe = scrollY.on("change", (latest) => {
      const heroHeight = window.innerHeight * 0.8; // 80% of viewport height
      setIsHeroVisible(latest < heroHeight);
    });

    return () => unsubscribe();
  }, [scrollY]);

  return (
    <div className="min-h-screen">
      {/* Hero Section with Spline 3D Scene */}
      <section className="relative h-screen bg-black w-full dark:border dark:border-white/[0.1] overflow-hidden">
        {/* Spline 3D Background */}
        <div className="absolute inset-0 spline-container">
          <Spline className="absolute inset-0 transform scale-125 md:scale-150 xl:scale-175"
            scene="https://prod.spline.design/5Vp04oZEY9rFbzZH/scene.splinecode"
          />
          {/* Overlay to hide background text */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-transparent pointer-events-none"></div>
        </div>
        
        {/* Hero Content */}
        {!isMobileNavOpen && isHeroVisible && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full">
            <div className="text-center max-w-6xl mx-auto px-4 sm:px-6">
              
              {/* Hero Title */}
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-4 sm:mb-6 leading-tight"
              >
                Full-Stack Developer
              </motion.h1>

              {/* Hero Description */}
              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-xs xs:text-sm sm:text-base md:text-lg text-gray-300 mb-6 sm:mb-8 max-w-4xl mx-auto leading-relaxed px-2"
              >
                I create amazing digital experiences with modern technologies. 
                Passionate about clean code, user experience, and solving complex problems.
              </motion.p>
              
              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: isHeroVisible ? 1 : 0, y: 0 }}
                transition={{ duration: 0.3, delay: 0.4 }}
                className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-2 sm:px-4 max-w-md sm:max-w-none mx-auto"
              >
                <Button asChild size="default" className="bg-white text-black hover:bg-gray-200 shadow-lg w-full sm:w-auto text-sm sm:text-base py-2 sm:py-3 px-6 sm:px-8">
                  <Link href="/projects">
                    View My Work
                  </Link>
                </Button>
                <Button asChild variant="outline" size="default" className="border-white text-white hover:bg-white hover:text-black shadow-lg w-full sm:w-auto text-sm sm:text-base py-2 sm:py-3 px-6 sm:px-8">
                  <Link href="/contact">
                    Get In Touch
                  </Link>
                </Button>
              </motion.div>
            </div>
          </div>
        )}
      </section>

      {/* Featured Projects */}
      <section className="py-12 sm:py-16 md:py-20 bg-black">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-8 sm:mb-12 md:mb-16"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary mb-3 sm:mb-4">
              Featured Projects
            </h2>
            <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto px-4">
              Here are some of my recent projects that showcase my skills and creativity
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-6 lg:gap-4">
            {featuredProjects.slice(0, 3).map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
              >
                <CardContainer className="inter-var py-0">
                  <CardBody className="bg-gray-50 relative group/card dark:hover:shadow-2xl dark:hover:shadow-emerald-500/[0.1] dark:bg-black dark:border-white/[0.2] border-black/[0.1] w-full sm:w-[90%] md:w-[28rem] lg:w-[26rem] xl:w-[30rem] h-auto rounded-xl p-4 sm:p-6 border mx-auto">
                    <CardItem
                      translateZ="50"
                      className="text-lg sm:text-xl font-bold text-neutral-600 dark:text-white"
                    >
                      {project.title}
                    </CardItem>
                    <CardItem
                      as="p"
                      translateZ="60"
                      className="text-neutral-500 text-sm sm:text-base max-w-sm mt-2 dark:text-neutral-300"
                    >
                      {project.description}
                    </CardItem>
                    <CardItem translateZ="100" className="w-full mt-3 sm:mt-4">
                      <img
                        src={project.imageUrl}
                        alt={project.title}
                        className="h-48 sm:h-60 w-full object-cover rounded-xl group-hover/card:shadow-xl"
                      />
                    </CardItem>
                    <CardItem translateZ="80" className="w-full mt-3 sm:mt-4">
                      <div className="flex flex-wrap gap-1 sm:gap-2 mb-3 sm:mb-4">
                        {project.technologies.map((tech) => (
                          <span
                            key={tech}
                            className="px-2 py-1 bg-primary/10 text-primary rounded-md text-xs sm:text-sm"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </CardItem>
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0 mt-6 sm:mt-8">
                      <CardItem
                        translateZ={20}
                        as="a"
                        href={project.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 sm:px-4 py-2 rounded-xl bg-black dark:bg-white dark:text-black text-white text-xs sm:text-sm font-bold hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors w-full sm:w-auto text-center"
                      >
                        <Github className="mr-2 h-4 w-4 inline" />
                        Code
                      </CardItem>
                      <CardItem
                        translateZ={20}
                        as="a"
                        href={project.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 sm:px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs sm:text-sm font-bold hover:bg-primary/90 transition-colors w-full sm:w-auto text-center"
                      >
                        <ExternalLink className="mr-2 h-4 w-4 inline" />
                        Live Demo
                      </CardItem>
                    </div>
                  </CardBody>
                </CardContainer>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-center mt-8 sm:mt-12 px-4"
          >
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
              <Link href="/projects">
                View All Projects
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-12 sm:py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-4 px-4">
              Ready to Work Together?
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-6 sm:mb-8 px-4">
              I'm always interested in hearing about new projects and opportunities. 
              Let's discuss how we can bring your ideas to life.
            </p>
            <div className="px-4">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href="/contact">
                  Start a Project
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
} 