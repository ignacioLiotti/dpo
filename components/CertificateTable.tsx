"use client";

import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"; // Adjust import to your ShadCN setup
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

// Example type for certificate
interface CertificateRecord {
  id: number;
  project: string;
  period: string; // e.g. "Jan 2024"
  status: "pending" | "generated" | "approved";
  totalAmount: number;
}

interface CertificateTableProps {
  certificates: CertificateRecord[];
  onView: (id: number) => void;
  onGenerate: (id: number) => void;
}

export default function CertificateTable({
  certificates,
  onView,
  onGenerate,
}: CertificateTableProps) {
  const [projectFilter, setProjectFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Filter logic
  const filteredCertificates = certificates.filter((cert) => {
    const matchesProject =
      !projectFilter || cert.project.toLowerCase().includes(projectFilter.toLowerCase());
    const matchesStatus = !statusFilter || cert.status === statusFilter;
    return matchesProject && matchesStatus;
  });

  return (
    <div className="w-full p-4">
      <h2 className="text-xl font-bold mb-4">Certificates</h2>

      {/* Filtering */}
      <div className="flex gap-4 mb-4">
        <div className="flex flex-col">
          <Label htmlFor="projectFilter">Filter by Project</Label>
          <Input
            id="projectFilter"
            placeholder="Project name..."
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
          />
        </div>
        <div className="flex flex-col">
          <Label htmlFor="statusFilter">Filter by Status</Label>
          <select
            id="statusFilter"
            className="border border-gray-300 rounded px-2 py-1"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="generated">Generated</option>
            <option value="approved">Approved</option>
          </select>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Project</TableHead>
            <TableHead>Period</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Total Amount</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredCertificates.map((cert) => (
            <TableRow key={cert.id}>
              <TableCell>{cert.project}</TableCell>
              <TableCell>{cert.period}</TableCell>
              <TableCell>{cert.status}</TableCell>
              <TableCell>${cert.totalAmount.toFixed(2)}</TableCell>
              <TableCell className="flex gap-2">
                <Button variant="outline" onClick={() => onView(cert.id)}>
                  View
                </Button>
                <Button onClick={() => onGenerate(cert.id)}>Generate</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
