import { Button } from "@/components/ui/button";
import { CogIcon, Plus, Shapes, Zap } from "lucide-react";
import React from "react";

export default function Playground() {
  return (
    <div>

      <div style={{ padding: "1rem" }} className="flex gap-2">
        <Button variant="facha" className="w-8"><Plus /></Button>
        <Button variant="default">Default</Button>
        <Button variant="destructive">destructive</Button>
        <Button variant="success">success</Button>
        <Button variant="alert">alert</Button>
        <Button variant="link">link</Button>
        <Button variant="outline">outline</Button>
        <Button variant="ghost">ghost</Button>
        {/* Add more button variations as needed */}
      </div>
      <div style={{ padding: "1rem" }} className="flex gap-2">
        <Button variant="secondary">Secondary</Button>
        <Button variant="tertiary">tertiary</Button>
        <Button variant="destructiveSecondary">destructiveSecondary</Button>
        <Button variant="successSecondary">successSecondary</Button>
        <Button variant="alertSecondary">alertSecondary</Button>

      </div>
      <div style={{ padding: "1rem" }} className="flex gap-2 mt-10">
        <Button variant="secondary">custom</Button>
        <Button variant="tertiary"><Zap /> Zap</Button>
        <Button variant="secondary"><CogIcon /></Button>
        <Button variant="secondary">Log In</Button>
        <Button variant="default">
          <Shapes />
          Buy Icons
        </Button>
        {/* Add more button variations as needed */}
      </div>
    </div>
  );
}
