"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"; // Adjust import to your ShadCN setup
import { Button } from "./ui/button";

// Example data structure for a budget record
interface BudgetRecord {
  id: number;
  projectName: string;
  client: string;
  status: "draft" | "submitted" | "approved" | "rejected";
}

interface BudgetTableProps {
  budgets: BudgetRecord[];
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

export default function BudgetTable({
  budgets,
  onEdit,
  onDelete,
}: BudgetTableProps) {
  return (
    <div className="w-full p-4">
      <h2 className="text-xl font-bold mb-4">Existing Budgets</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Project Name</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {budgets.map((budget) => (
            <TableRow key={budget.id}>
              <TableCell>{budget.projectName}</TableCell>
              <TableCell>{budget.client}</TableCell>
              <TableCell>{budget.status}</TableCell>
              <TableCell className="flex gap-2">
                <Button variant="outline" onClick={() => onEdit(budget.id)}>
                  Edit
                </Button>
                <Button variant="destructive" onClick={() => onDelete(budget.id)}>
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
