'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { FAQ } from '@/constants/app'

export function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <div className="mt-12 grid items-start gap-4 sm:grid-cols-2">
      {FAQ.map((item, i) => {
        const isOpen = open === i
        return (
          <div key={item.q} className="panel overflow-hidden">
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-3 p-6 text-left transition-colors hover:bg-white/3"
            >
              <h3 className="font-display text-lg">{item.q}</h3>
              <ChevronDown
                aria-hidden="true"
                className={`h-4 w-4 shrink-0 text-gold transition-transform duration-300 ${
                  isOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
            <AnimatePresence initial={false}>
              {isOpen ? (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                >
                  <p className="px-6 pb-6 text-sm leading-relaxed text-muted">{item.a}</p>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
