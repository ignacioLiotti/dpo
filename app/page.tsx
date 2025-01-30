"use client";
import BudgetForm from "@/components/BudgetForm";
import BudgetTable from "@/components/BudgetTable";
import CertificateForm from "@/components/CertificateForm";
import CertificateTable from "@/components/CertificateTable";
import React, { useState } from "react";

export default function Home() {
  const [budgets, setBudgets] = useState([
    {
      id: 1,
      projectName: "Project A",
      client: "Client X",
      status: "draft" as const,
    },
  ]);

  const [certificates, setCertificates] = useState([
    {
      id: 101,
      project: "Project A",
      period: "Dec 2024",
      status: "pending" as const,
      totalAmount: 5000,
    },
  ]);

  const handleSaveBudget = (data: any) => {
    console.log("Budget Data:", data);
    // Append to budgets list or update as needed
  };

  const handleSaveCertificate = (data: any) => {
    console.log("Certificate Data:", data);
    // Append to certificates list or update as needed
  };

  const handleEditBudget = (id: number) => {
    console.log("Edit budget with ID:", id);
  };

  const handleDeleteBudget = (id: number) => {
    console.log("Delete budget with ID:", id);
  };

  const handleViewCertificate = (id: number) => {
    console.log("View certificate with ID:", id);
  };

  const handleGenerateCertificate = (id: number) => {
    console.log("Generate certificate with ID:", id);
  };

  return (
    <main className="p-8">
      <BudgetForm onSave={handleSaveBudget} />
      <hr className="my-8" />
      <BudgetTable
        budgets={budgets}
        onEdit={handleEditBudget}
        onDelete={handleDeleteBudget}
      />
      <hr className="my-8" />
      <CertificateForm onSave={handleSaveCertificate} />
      <hr className="my-8" />
      <CertificateTable
        certificates={certificates}
        onView={handleViewCertificate}
        onGenerate={handleGenerateCertificate}
      />
    </main>
  );
}
