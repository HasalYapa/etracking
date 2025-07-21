"use client"

import { motion } from "framer-motion"
import { Download, Code, Palette, Database, Cloud, Smartphone, Brain } from "lucide-react"

import { Button as StatefulButton } from "@/components/ui/stateful-button"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const skills = [
  {
    category: "Frontend",
    icon: Code,
    items: ["React", "Next.js", "TypeScript", "Vue.js", "Angular", "Svelte"],
  },
  {
    category: "Backend",
    icon: Database,
    items: ["Node.js", "Python", "Django", "FastAPI", "PostgreSQL", "MongoDB"],
  },
  {
    category: "Mobile",
    icon: Smartphone,
    items: ["React Native", "Flutter", "Expo", "iOS", "Android"],
  },
  {
    category: "DevOps",
    icon: Cloud,
    items: ["AWS", "Docker", "Kubernetes", "CI/CD", "Terraform", "Vercel"],
  },
  {
    category: "Design",
    icon: Palette,
    items: ["Figma", "Adobe XD", "Photoshop", "Illustrator", "UI/UX"],
  },
  {
    category: "AI/ML",
    icon: Brain,
    items: ["TensorFlow", "PyTorch", "OpenAI API", "Hugging Face", "Langchain"],
  },
]

const education = [
  {
    title: "Bachelor of Information Technology (BIT)",
    institution: "University of Moratuwa",
    period: "2022 - Present",
    description: "Pursuing a comprehensive degree in Information Technology with focus on software development, database systems, and modern programming methodologies. Developing strong foundation in computer science principles and practical application development.",
    technologies: ["Java", "Python", "Database Systems", "Software Engineering", "Web Development"],
  },
  {
    title: "Civil Engineering Student",
    institution: "Institute of Engineering Technology (IET)",
    period: "2021 - Present",
    description: "Studying Civil Engineering at IET Katunayake, gaining knowledge in structural design, construction management, and engineering principles. This dual education approach provides unique problem-solving perspectives.",
    technologies: ["AutoCAD", "Project Management", "Structural Design", "Construction Planning"],
  },
  {
    title: "Online Certifications & Courses",
    institution: "Udemy, Coursera & Other Platforms",
    period: "2021 - Present",
    description: "Continuously learning through online platforms to stay updated with latest technologies. Completed various courses in web development, modern frameworks, and best practices in software development.",
    technologies: ["Next.js", "React", "Node.js", "TypeScript", "Full-Stack Development"],
  },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen py-12 sm:py-16 md:py-20 bg-black">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-8 sm:mb-12 md:mb-16"
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary mb-3 sm:mb-4 px-4">
            About Me
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
          I’m passionate about learning full-stack web development, especially with Next.js. I love building modern, user-friendly web applications and continuously improving my skills.
          </p>
        </motion.div>

        {/* Bio Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-8 sm:mb-12 md:mb-16"
        >
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl">My Story</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <p className="text-sm sm:text-base text-muted-foreground">
                Hello! I'm Hasal Yapa, an undergraduate student pursuing a Bachelor of Information Technology (BIT) 
                at the University of Moratuwa, Sri Lanka. Alongside my IT studies, I'm also studying Civil Engineering 
                at the Institute of Engineering Technology (IET) in Katunayake. I have a deep interest in learning 
                and working with the latest technologies, especially in the field of full-stack web development using 
                frameworks like Next.js.
              </p>
              <p className="text-sm sm:text-base text-muted-foreground">
                Although I don't have professional work experience yet, I am highly motivated and eager to gain 
                practical industry exposure through internships and collaborative projects. I am dedicated to 
                improving my technical and problem-solving skills while contributing to innovative solutions that 
                make a real impact.
              </p>
              <p className="text-sm sm:text-base text-muted-foreground">
                I'm always open to new learning opportunities and connections that help me grow as a future 
                software engineer and developer.
              </p>
              <div className="pt-3 sm:pt-4">
                <StatefulButton
                  onClick={() => {
                    return new Promise((resolve) => {
                      setTimeout(() => {
                        // Trigger the actual download
                        const link = document.createElement('a')
                        link.href = '/cv/resume.pdf'
                        link.download = 'resume.pdf'
                        document.body.appendChild(link)
                        link.click()
                        document.body.removeChild(link)
                        resolve(true)
                      }, 1000)
                    })
                  }}
                >
                  Download My CV
                </StatefulButton>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Skills Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mb-8 sm:mb-12 md:mb-16"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-primary mb-6 sm:mb-8 text-center px-4">
            Technical Skills
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {skills.map((skill, index) => (
              <motion.div
                key={skill.category}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 * index }}
              >
                <Card className="h-full bg-primary/5 border-primary/20">
                  <CardHeader className="pb-3 sm:pb-6">
                    <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                      <skill.icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      {skill.category}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap gap-1 sm:gap-2">
                      {skill.items.map((item) => (
                        <Badge key={item} variant="secondary" className="text-xs sm:text-sm">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Education Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mb-8 sm:mb-12 md:mb-16"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-primary mb-6 sm:mb-8 text-center px-4">
            Education & Certifications
          </h2>
          <div className="space-y-4 sm:space-y-6">
            {education.map((edu, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.1 * index }}
              >
                <Card className="bg-primary/5 border-primary/20">
                  <CardHeader className="pb-3 sm:pb-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-lg sm:text-xl">{edu.title}</CardTitle>
                        <CardDescription className="text-base sm:text-lg font-medium text-primary">
                          {edu.institution}
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="self-start sm:self-center text-xs sm:text-sm">
                        {edu.period}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4 pt-0">
                    <p className="text-sm sm:text-base text-muted-foreground">{edu.description}</p>
                    <div className="flex flex-wrap gap-1 sm:gap-2">
                      {edu.technologies.map((tech) => (
                        <Badge key={tech} variant="secondary" className="text-xs sm:text-sm">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="text-center"
        >
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-4 sm:pt-6">
              <h3 className="text-xl sm:text-2xl font-bold text-primary mb-3 sm:mb-4 px-4">
                Let's Work Together
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 px-4">
                I'm always interested in hearing about new opportunities and exciting projects. 
                Feel free to reach out if you'd like to collaborate!
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
                <Button asChild className="w-full sm:w-auto">
                  <a href="/contact">Get In Touch</a>
                </Button>
                <Button asChild variant="outline" className="w-full sm:w-auto">
                  <a href="/projects">View My Work</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
} 