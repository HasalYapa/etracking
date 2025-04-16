"use client";
import React from "react";
import { FloatingNav } from "@/components/ui/floating-navbar";
import { IconHome, IconMessage, IconUser, IconSearch, IconCoin } from "@tabler/icons-react";
import Link from "next/link";

export default function EtrackingNavbar() {
  const navItems = [
    {
      name: "Home",
      link: "/",
      icon: <IconHome className="h-5 w-5 text-blue-600" />,
    },
    {
      name: "Pricing",
      link: "/pricing",
      icon: <IconCoin className="h-5 w-5 text-blue-600" />,
    },
    {
      name: "About Us",
      link: "/about",
      icon: <IconUser className="h-5 w-5 text-blue-600" />,
    },
    {
      name: "Contact Us",
      link: "/contact",
      icon: <IconMessage className="h-5 w-5 text-blue-600" />,
    },
    {
      name: "Tracking",
      link: "/tracking",
      icon: <IconSearch className="h-5 w-5 text-blue-600" />,
    },
  ];

  return (
    <div className="relative w-full">
      <FloatingNav
        navItems={navItems}
        className="bg-white/90 backdrop-blur-sm border-blue-100"
      />
    </div>
  );
}
