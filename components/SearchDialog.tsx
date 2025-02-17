import { Dialog, DialogContent } from "@/components/ui/dialog"

interface SearchDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onElementSelect: (element: any) => void
  sections: string[]
  elements: any[]
}

export function SearchDialog({
  isOpen,
  onOpenChange,
  onElementSelect,
  sections,
  elements
}: SearchDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        {/* Add search dialog content */}
      </DialogContent>
    </Dialog>
  )
} 