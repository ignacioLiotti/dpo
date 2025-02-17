'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { cn } from '@/lib/utils';
import { ClipboardPenLineIcon, FileBadgeIcon, FileChartPieIcon } from 'lucide-react';

interface CreateFABProps {
  height?: number;
  width?: number;
  children: React.ReactNode;
}

export default function CreateFAB({ height, width, children }: CreateFABProps) {
  const [open, setOpen] = useState(false);
  const [formState, setFormState] = useState("idle");
  const [feedback, setFeedback] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const usingHeight = height ? Math.trunc(height) : 48;
  const usingWidth = open ? Math.trunc(width ?? 0) : 0;

  console.log('usingWidth', usingWidth)

  // Handle click outside to close the menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
        setFormState("idle");
        setFeedback("");
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="flex justify-end items-center p-4 bg-background/95 shadow-sm">
      <div className={cn("flex gap-2 absolute top-[80vh] left-[40vw] translate-x-[-50%]",
        open ? `bottom-64 translate-y-[-70px]` : "")}
        style={{
          // @ts-ignore
          "--tw-translate-x": `-${usingWidth / 3}px`,
        }}
      >
        <motion.button
          layoutId="wrapper"
          onClick={() => {
            setOpen(true);
            setFormState("idle");
            setFeedback("");
          }}
          className="relative flex h-9 items-center rounded-lg border border-neutral-200 bg-white px-3 font-medium outline-none"
        >
          <motion.span layoutId="title">Crear</motion.span>
        </motion.button>

        <AnimatePresence>
          {open && (
            <motion.div
              ref={ref}
              layoutId="wrapper"
              transition={{ type: "spring", bounce: 0, stiffness: 1000, damping: 100 }}
              className={cn("absolute h-48 w-[364px] top-0 overflow-hidden rounded-xl bg-neutral-50 p-1 shadow-lg outline-none ring-1 ring-black/5 flex flex-col",
                height ? `h-[${height}px]` : "",
                width ? `w-[${usingWidth}px]` : "")}
            >
              <motion.span
                aria-hidden
                className="absolute left-4 top-2 text-sm text-neutral-500"
                layoutId="title"
                data-success={formState === "success"}
                data-feedback={feedback ? "true" : "false"}
              >
                Crear
              </motion.span>

              <div className="flex flex-col gap-2 w-full h-9" />

              <div className="rounded-lg border border-neutral-200 bg-white h-full">
                <div className="flex h-full items-center justify-center gap-2">

                  {children}

                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
