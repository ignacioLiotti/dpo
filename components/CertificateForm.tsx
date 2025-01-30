"use client";

import React, { useState } from "react";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

interface CategoryProgress {
  id: number;
  category: string;
  percentage: number; // 0-100
  amount: number; // Calculated based on percentage
}

interface CertificateFormData {
  progressItems: CategoryProgress[];
}

// Example props
interface CertificateFormProps {
  onSave: (data: CertificateFormData) => void; // Called to generate monthly certificate
  // If you need to know cost per category, you can supply that as props:
  baseAmounts?: { [category: string]: number };
}

export default function CertificateForm({
  onSave,
  baseAmounts = {
    Excavation: 10000,
    Foundation: 20000,
    Framing: 30000,
  },
}: CertificateFormProps) {
  // Convert baseAmounts object into an array for easier mapping
  const initialItems = Object.entries(baseAmounts).map(([cat, base]) => ({
    id: Date.now() + Math.random(), // unique ID
    category: cat,
    percentage: 0,
    amount: 0,
  }));

  const [progressItems, setProgressItems] = useState<CategoryProgress[]>(
    initialItems
  );

  // Update progress percentage and recalc amount
  const handleChangePercentage = (
    index: number,
    newValue: string
  ) => {
    let valueNum = parseFloat(newValue);
    if (isNaN(valueNum)) valueNum = 0;
    if (valueNum > 100) valueNum = 100;

    setProgressItems((prev) => {
      const updated = [...prev];
      updated[index].percentage = valueNum;
      const baseCost = baseAmounts[updated[index].category] ?? 0;
      updated[index].amount = (baseCost * valueNum) / 100;
      return updated;
    });
  };

  // Sum all amounts
  const totalAmount = progressItems.reduce((acc, item) => acc + item.amount, 0);

  const handleSave = () => {
    onSave({ progressItems });
  };

  return (
    <div className="max-w-xl mx-auto p-4 space-y-4">
      <h2 className="text-xl font-bold">Certificate Form</h2>

      {progressItems.map((item, index) => (
        <div key={item.id} className="flex items-center gap-4 mb-2">
          <Label className="w-1/4">{item.category}</Label>
          <Input
            type="number"
            className="w-1/4"
            min={0}
            max={100}
            value={item.percentage}
            onChange={(e) => handleChangePercentage(index, e.target.value)}
          />
          <div className="w-1/4">
            {item.amount.toFixed(2)}
          </div>
        </div>
      ))}

      <div className="flex justify-between font-semibold">
        <span>Total Amount:</span>
        <span>${totalAmount.toFixed(2)}</span>
      </div>

      <Button onClick={handleSave}>Generate Certificate</Button>
    </div>
  );
}
