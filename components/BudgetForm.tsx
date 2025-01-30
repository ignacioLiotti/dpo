"use client";

import React, { useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Label } from "./ui/label";

// Example type of what's being captured. Adjust as needed.
interface BudgetFormData {
  projectName: string;
  client: string;
  // Example data structures for associated items.
  // Each item can represent material, construction item, or specialized labor.
  associatedItems: Array<{
    id: number;
    description: string;
    quantity: number;
    cost: number;
  }>;
}

// Props for BudgetForm
interface BudgetFormProps {
  onSave: (data: BudgetFormData) => void; // Called when "Save" is clicked
}

export default function BudgetForm({ onSave }: BudgetFormProps) {
  const [projectName, setProjectName] = useState("");
  const [client, setClient] = useState("");
  const [associatedItems, setAssociatedItems] = useState<
    BudgetFormData["associatedItems"]
  >([
    {
      id: Date.now(),
      description: "",
      quantity: 0,
      cost: 0,
    },
  ]);

  // Handle addition of a new optional row
  const handleAddItem = () => {
    setAssociatedItems((prev) => [
      ...prev,
      {
        id: Date.now(),
        description: "",
        quantity: 0,
        cost: 0,
      },
    ]);
  };

  // Update an associated item by index
  const handleUpdateItem = (
    index: number,
    field: "description" | "quantity" | "cost",
    value: string | number
  ) => {
    const updatedItems = [...associatedItems];
    // Ensure numeric fields are converted
    (updatedItems[index][field] as string | number) =
      field === "quantity" || field === "cost" ? Number(value) : value;
    setAssociatedItems(updatedItems);
  };

  // Validate and submit form
  const handleSave = () => {
    if (!projectName.trim() || !client.trim()) {
      // Basic required field check
      alert("Please fill in the required fields.");
      return;
    }

    const data: BudgetFormData = {
      projectName,
      client,
      associatedItems,
    };
    onSave(data);
  };

  return (
    <div className="max-w-xl mx-auto p-4 space-y-4">
      <h2 className="text-xl font-bold">Budget Form</h2>

      {/* Project Name */}
      <div className="space-y-2">
        <Label htmlFor="projectName">Project Name*</Label>
        <Input
          id="projectName"
          placeholder="Enter project name"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
        />
      </div>

      {/* Client */}
      <div className="space-y-2">
        <Label htmlFor="client">Client*</Label>
        <Input
          id="client"
          placeholder="Enter client name"
          value={client}
          onChange={(e) => setClient(e.target.value)}
        />
      </div>

      {/* Associated Items */}
      <div className="space-y-2">
        <Label>Associated Items (materials, labor, etc.)</Label>
        {associatedItems.map((item, index) => (
          <div
            key={item.id}
            className="grid grid-cols-4 gap-2 items-center mb-2"
          >
            <Input
              placeholder="Description"
              value={item.description}
              onChange={(e) =>
                handleUpdateItem(index, "description", e.target.value)
              }
            />
            <Input
              placeholder="Quantity"
              type="number"
              value={item.quantity}
              onChange={(e) =>
                handleUpdateItem(index, "quantity", e.target.value)
              }
            />
            <Input
              placeholder="Cost"
              type="number"
              value={item.cost}
              onChange={(e) => handleUpdateItem(index, "cost", e.target.value)}
            />
          </div>
        ))}

        <Button variant="secondary" onClick={handleAddItem}>
          Add Another Row
        </Button>
      </div>

      {/* Save Button */}
      <div>
        <Button onClick={handleSave}>Save</Button>
      </div>
    </div>
  );
}
