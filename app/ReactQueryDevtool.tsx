'use client'

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { DatabaseIcon } from "lucide-react"
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools"
import React from "react"

export default function ReactQueryDevtool() {
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      const panel = document.createElement('div');
      panel.setAttribute('data-testid', 'panel-root');
      document.body.appendChild(panel);
    } else {
      const devtools = document.querySelector('[data-testid="panel-root"]');
      if (devtools) {
        devtools.remove();
      }
    }
  }, [isOpen]);

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        className="fixed bottom-4 right-4 z-50"
        onClick={() => setIsOpen(!isOpen)}
      >
        <DatabaseIcon className="h-4 w-4" />
      </Button>
      {isOpen && (
        <Card className="fixed bottom-16 right-4 w-[80vw] h-[40vh] z-50 overflow-hidden">
          <ReactQueryDevtoolsPanel />
        </Card>
      )}
    </div>
  )
}