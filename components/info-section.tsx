"use client"

import type React from "react"

import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { ArrowRight } from "lucide-react"
import { motion } from "framer-motion"

interface InfoSectionProps {
  icon: LucideIcon
  title: string
  viewAllLink?: string
  viewAllText?: string
  children: React.ReactNode
  className?: string
}

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

export default function InfoSection({
  icon: Icon,
  title,
  viewAllLink,
  viewAllText = "すべて表示",
  children,
  className,
}: InfoSectionProps) {
  return (
    <motion.section
      className={className}
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center">
          <Icon className="h-6 w-6 sm:h-7 sm:w-7 text-purple-600 mr-2 sm:mr-3" />
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800">{title}</h2>
        </div>
        {viewAllLink && (
          <Link
            href={viewAllLink}
            className="text-sm sm:text-base text-purple-600 hover:text-purple-700 font-medium flex items-center group transition-colors"
          >
            {viewAllText}
            <ArrowRight className="h-4 w-4 ml-1 transform transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        )}
      </div>
      {children}
    </motion.section>
  )
}
