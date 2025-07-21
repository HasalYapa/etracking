"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"


import { Button } from "@/components/ui/button"
import { Button as StatefulButton } from "@/components/ui/stateful-button"
import { ThemeToggle } from "@/components/theme-toggle"
import { cn } from "@/lib/utils"
import { 
  ResizableNavbar, 
  ResizableNavBody, 
  ResizableNavItems,
  ResizableMobileNav,
  ResizableMobileNavHeader,
  ResizableMobileNavToggle,
  ResizableMobileNavMenu
} from "@/components/ui/resizable-navbar"
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar"
import { Menu, X } from "lucide-react"

const navItems = [
  { name: "Home", link: "/" },
  { name: "About", link: "/about" },
  { name: "Projects", link: "/projects" },
  { name: "Blog", link: "/blog" },
  { name: "Contact", link: "/contact" },
]

export function Navbar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = React.useState(false)

  // Dispatch event when mobile navbar is toggled
  React.useEffect(() => {
    const event = new CustomEvent('mobileNavbarToggle', {
      detail: { isOpen }
    });
    window.dispatchEvent(event);
    
    // Prevent body scrolling when mobile navbar is open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleDownloadCV = async () => {
    // Simulate download process
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
      }, 2000)
    })
  }

  return (
    <ResizableNavbar>
      {/* Desktop Navigation */}
      <ResizableNavBody>
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="relative z-20"
          >
            <Image
              src="/logo.png"
              alt="Logo"
              width={60}
              height={60}
              className="object-contain"
            />
          </motion.div>
        </Link>

        {/* Desktop Navigation Items */}
        <ResizableNavItems items={navItems} />

        {/* Actions */}
        <div className="flex items-center space-x-4 relative z-20">
          <StatefulButton 
            onClick={handleDownloadCV}
            className="hidden sm:flex text-sm px-3 py-2 h-9"
          >
            Download CV
          </StatefulButton>
          <ThemeToggle />
        </div>
      </ResizableNavBody>

      {/* Mobile Navigation with Sidebar */}
      <div className="md:hidden bg-black">
        <div className="w-full bg-black" style={{ backgroundColor: '#000000' }}>
          <Sidebar open={isOpen} setOpen={setIsOpen}>
            <SidebarBody className="justify-between gap-10 !bg-black dark:!bg-black" style={{ backgroundColor: '#000000' }}>
            {/* Mobile Header */}
            <div className="h-16 px-4 py-4 flex flex-row md:hidden items-center justify-between bg-black border-b border-white w-full">
              <Link href="/" className="flex items-center space-x-2">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                  className="relative z-20"
                >
                  <Image
                    src="/logo.png"
                    alt="Logo"
                    width={48}
                    height={48}
                    className="object-contain"
                  />
                </motion.div>
              </Link>
              <div className="flex items-center space-x-4">
                <ThemeToggle />
                <Menu
                  className="text-white h-6 w-6 cursor-pointer"
                  onClick={() => setIsOpen(!isOpen)}
                />
              </div>
            </div>

            {/* Sidebar Overlay */}
            {isOpen && (
              <motion.div
                initial={{ x: "-100%", opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: "-100%", opacity: 0 }}
                transition={{
                  duration: 0.3,
                  ease: "easeInOut",
                }}
                className="fixed h-screen w-screen top-0 left-0 right-0 bottom-0 bg-black z-[9999] flex flex-col justify-between p-8"
                style={{ 
                  backgroundColor: '#000000',
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 9999,
                  width: '100vw',
                  height: '100vh'
                }}
              >
                {/* Close Button */}
                <div
                  className="absolute right-8 top-8 z-50 text-white"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-6 w-6 cursor-pointer" />
                </div>

                {/* Sidebar Content */}
                <div className="flex flex-1 flex-col mt-16">
                  {/* Logo in Sidebar */}
                  <Link href="/" className="flex items-center space-x-2 mb-8" onClick={() => setIsOpen(false)}>
                    <Image
                      src="/logo.png"
                      alt="Logo"
                      width={48}
                      height={48}
                      className="object-contain"
                    />
                    <span className="text-white text-xl font-semibold">Portfolio</span>
                  </Link>

                  {/* Navigation Items */}
                  <div className="flex flex-col gap-2">
                    {navItems.map((item) => (
                      <Link
                        key={item.link}
                        href={item.link}
                        className={cn(
                          "flex items-center text-white hover:text-gray-300 hover:bg-gray-800 rounded-md px-3 py-3 text-lg font-medium transition-colors",
                          pathname === item.link && "text-white bg-gray-700"
                        )}
                        onClick={() => setIsOpen(false)}
                      >
                        <span>{item.name}</span>
                      </Link>
                    ))}
                  </div>

                  {/* Download CV Button */}
                  <div className="mt-8">
                    <StatefulButton 
                      onClick={async () => {
                        await handleDownloadCV();
                        setIsOpen(false);
                      }}
                      className="w-full text-sm px-4 py-3 h-auto bg-white text-black hover:bg-gray-200"
                    >
                      Download CV
                    </StatefulButton>
                  </div>
                </div>
              </motion.div>
            )}
          </SidebarBody>
        </Sidebar>
        </div>
      </div>
    </ResizableNavbar>
  )
} 