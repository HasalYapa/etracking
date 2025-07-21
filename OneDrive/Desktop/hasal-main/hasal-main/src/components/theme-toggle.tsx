"use client"

import * as React from "react"
import { Moon } from "lucide-react"

import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative cursor-default"
      disabled
    >
      <Moon className="h-[1.2rem] w-[1.2rem] transition-all" />
      <span className="sr-only">Dark mode active</span>
    </Button>
  )
} 