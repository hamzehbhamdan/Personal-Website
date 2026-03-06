"use client"

import { motion } from "framer-motion"

interface AnimatedSectionProps {
    children: React.ReactNode
    className?: string
    delay?: number
    /** Direction the section slides in from */
    direction?: "up" | "left" | "right"
}

export function AnimatedSection({
    children,
    className,
    delay = 0,
    direction = "up",
}: AnimatedSectionProps) {
    const variants = {
        up:    { hidden: { opacity: 0, y: 40 },  visible: { opacity: 1, y: 0 } },
        left:  { hidden: { opacity: 0, x: -40 }, visible: { opacity: 1, x: 0 } },
        right: { hidden: { opacity: 0, x: 40 },  visible: { opacity: 1, x: 0 } },
    }

    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: "easeOut", delay }}
            variants={variants[direction]}
            className={className}
        >
            {children}
        </motion.div>
    )
}
