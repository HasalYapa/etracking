export interface Project {
  id: string
  title: string
  description: string
  longDescription?: string
  technologies: string[]
  githubUrl?: string
  liveUrl?: string
  imageUrl?: string
  featured: boolean
  category: 'web' | 'mobile' | 'desktop' | 'ai' | 'other'
  status: 'completed' | 'in-progress' | 'planned'
  startDate: string
  endDate?: string
}

export interface Experience {
  id: string
  company: string
  position: string
  startDate: string
  endDate?: string
  description: string
  technologies: string[]
  location: string
  type: 'full-time' | 'part-time' | 'contract' | 'internship'
}

export interface Education {
  id: string
  institution: string
  degree: string
  field: string
  startDate: string
  endDate?: string
  gpa?: string
  description?: string
  achievements?: string[]
}

export interface Skill {
  id: string
  name: string
  category: 'frontend' | 'backend' | 'mobile' | 'database' | 'devops' | 'design' | 'other'
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  years: number
}

export interface ContactFormData {
  name: string
  email: string
  message: string
}

export interface SocialLink {
  id: string
  platform: string
  url: string
  username: string
  icon: string
}

export interface TestimonialData {
  id: string
  name: string
  position: string
  company: string
  content: string
  avatarUrl?: string
  rating: number
} 