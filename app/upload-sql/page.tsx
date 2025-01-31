"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

interface SQLResult {
  statement: string;
  success: boolean;
  error?: string;
}

interface FileUploadResult {
  fileName: string;
  results: SQLResult[];
}

export default function UploadSQLPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<FileUploadResult[]>([]);
  const { toast } = useToast();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    const sqlFiles = files.filter(file => file.name.toLowerCase().endsWith('.sql'));
    if (sqlFiles.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Por favor, sube solo archivos .sql",
      });
      return;
    }

    await uploadFiles(sqlFiles);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const sqlFiles = files.filter(file => file.name.toLowerCase().endsWith('.sql'));
    if (sqlFiles.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Por favor, sube solo archivos .sql",
      });
      return;
    }

    await uploadFiles(sqlFiles);
  };

  const uploadFiles = async (files: File[]) => {
    // Validate file size
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    const invalidFiles = files.filter(file => file.size > MAX_FILE_SIZE);

    if (invalidFiles.length > 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Los siguientes archivos son demasiado grandes (máx. 10MB): ${invalidFiles.map(f => f.name).join(', ')}`,
      });
      return;
    }

    // Add files to uploading state
    setUploadingFiles(prev => new Set([...prev, ...files.map(f => f.name)]));

    try {
      await Promise.all(files.map(async (file) => {
        try {
          const formData = new FormData();
          formData.append("file", file);

          const response = await fetch("/api/upload-sql", {
            method: "POST",
            body: formData,
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || "Error al procesar el archivo");
          }

          setResults(prev => [...prev, {
            fileName: file.name,
            results: data.results,
          }]);

          toast({
            title: "Éxito",
            description: `Archivo ${file.name} procesado correctamente`,
          });
        } catch (error) {
          toast({
            variant: "destructive",
            title: `Error en ${file.name}`,
            description: (error as Error).message,
          });
        } finally {
          setUploadingFiles(prev => {
            const next = new Set(prev);
            next.delete(file.name);
            return next;
          });
        }
      }));
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al procesar los archivos",
      });
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Subir Archivos SQL</h1>

      <div
        className={`border-2 border-dashed rounded-lg p-10 text-center mb-6 ${isDragging ? "border-primary bg-primary/10" : "border-gray-300"
          }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="mb-4">
          <p className="text-lg mb-2">
            Arrastra y suelta archivos SQL aquí o
          </p>
          <Button
            variant="outline"
            disabled={uploadingFiles.size > 0}
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            Selecciona archivos
          </Button>
          <input
            id="file-upload"
            type="file"
            className="hidden"
            accept=".sql"
            multiple
            onChange={handleFileSelect}
            disabled={uploadingFiles.size > 0}
          />
        </div>
      </div>

      {uploadingFiles.size > 0 && (
        <div className="flex flex-col items-center justify-center gap-2 my-4">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <p>Procesando {uploadingFiles.size} archivo(s)...</p>
          </div>
          <div className="text-sm text-muted-foreground">
            {Array.from(uploadingFiles).join(', ')}
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">Resultados</h2>
          {results.map((result, index) => (
            <Card key={index} className="p-4">
              <h3 className="font-medium mb-2">{result.fileName}</h3>
              <div className="space-y-2">
                {result.results.map((r: any, i: number) => (
                  <div
                    key={i}
                    className={`p-2 rounded ${r.success ? "bg-green-50" : "bg-red-50"
                      }`}
                  >
                    <p className="font-mono text-sm break-all">
                      {r.statement}
                    </p>
                    {!r.success && (
                      <p className="text-red-600 text-sm mt-1">
                        Error: {r.error}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 