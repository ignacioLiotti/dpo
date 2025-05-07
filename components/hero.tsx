'use client'
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AnimatePresence, motion } from "framer-motion"
export default function Header() {
  return (
    <div className="flex flex-col gap-16 items-center justify-center h-full">
      <h1 className="sr-only">Supabase and Next.js Starter Template</h1>
      <p className="text-3xl lg:text-4xl !leading-tight mx-auto max-w-xl text-center">
        The fastest way to build apps with{" "}
        <a
          href="https://supabase.com/?utm_source=create-next-app&utm_medium=template&utm_term=nextjs"
          target="_blank"
          className="font-bold hover:underline"
          rel="noreferrer"
        >
          Supabase
        </a>{" "}
        and{" "}
        <a
          href="https://nextjs.org/"
          target="_blank"
          className="font-bold hover:underline"
          rel="noreferrer"
        >
          Next.js
        </a>
      </p>

      <div className="flex flex-wrap gap-4 justify-center">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline">Open Right Sheet</Button>
          </SheetTrigger>
          <SheetContent side="right" level={1}>
            <SheetHeader>
              <SheetTitle>First Right Sheet</SheetTitle>
            </SheetHeader>
            <div className="py-4">
              <p className="mb-4">This is the first right-sided sheet content</p>

              <AnimatePresence>
                <motion.div
                  key={'secondSheetId'}
                  initial={false}
                  animate={{}}
                  exit={{ x: "100%", opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline">Open Another Right Sheet</Button>
                    </SheetTrigger>



                    <SheetContent side="right" className=" overflow-y-auto" level={2}>
                      <SheetHeader>
                        <SheetTitle>Second Right Sheet</SheetTitle>
                      </SheetHeader>
                      <div className="py-4">
                        This is the nested right sheet content
                        <Sheet>
                          <SheetTrigger asChild>
                            <Button variant="outline">Open Another Right Sheet</Button>
                          </SheetTrigger>
                          <SheetContent side="right" className=" overflow-y-auto" level={2}>
                            <SheetHeader>
                              <SheetTitle>Third Right Sheet</SheetTitle>
                            </SheetHeader>
                            <div className="py-4">
                              This is the nested right sheet content
                            </div>
                          </SheetContent>
                        </Sheet>
                      </div>
                    </SheetContent>
                  </Sheet>
                </motion.div>
              </AnimatePresence>
            </div>
          </SheetContent>
        </Sheet>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline">Open Bottom Sheet</Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[40vh]">
            <SheetHeader>
              <SheetTitle>Bottom Sheet</SheetTitle>
            </SheetHeader>
            <div className="py-4">
              This is a bottom sheet content
            </div>
          </SheetContent>
        </Sheet>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Open Dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Dialog Title</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              This is the dialog content in the middle of the screen
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="w-full p-[1px] bg-gradient-to-r from-transparent via-foreground/10 to-transparent my-8" />
    </div>
  )
}
