'use client'
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { InvoiceForm } from "./invoice-form"

export default function Header() {
  return (
    <div className="flex flex-col gap-16 items-center justify-center h-full bg-white/50 w-full ">
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
            <Button variant="outline">Open Invoice Form</Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[800px] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Invoice Form</SheetTitle>
            </SheetHeader>
            <div className="py-4">
              <InvoiceForm />
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
