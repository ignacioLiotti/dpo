"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { CalendarIcon, Upload, FileSpreadsheet } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import Papa from "papaparse";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";

interface ParsedItem {
  nombre: string;
  unidad: string;
  precio: number;
  categoria: string;
  codigo?: string;
}

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [date, setDate] = useState<Date>(new Date());
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFile(event.target.files[0]);
      setParsedData([]); // Reset parsed data when new file is selected
    }
  };

  const decodeWindows1252 = (arrayBuffer: ArrayBuffer) => {
    const decoder = new TextDecoder('windows-1252');
    return decoder.decode(arrayBuffer);
  };

  const handleParse = () => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      if (!e.target?.result) return;

      // Convert ArrayBuffer to text using Windows-1252 encoding
      const text = decodeWindows1252(e.target.result as ArrayBuffer);

      Papa.parse(text, {
        delimiter: ";",
        complete: (result: any) => {
          console.log('Raw parsed data:', result.data); // Debug log
          const data = result.data
            .filter((row: any[]) => row.length >= 4) // Ensure row has all required fields
            .map((row: any) => {
              const item = {
                nombre: row[1]?.trim() || '', // INSUMOS PARA LA CONSTRUCCION
                unidad: row[2]?.trim() || '', // UN
                precio: parseFloat((row[3]?.toString() || "0").replace(",", ".")) || 0, // PRECIO
                categoria: row[4]?.trim() || '', // Categoria
              };
              console.log('Processed row:', item); // Debug log
              return item;
            })
            .filter((item: any) => item.nombre && item.unidad && !isNaN(item.precio)); // Filter out invalid entries

          setParsedData(data);
          toast({
            title: "CSV Parsed Successfully",
            description: `Found ${data.length} valid entries`,
          });
        },
        error: (error: any) => {
          console.error('Error parsing CSV:', error);
          toast({
            variant: "destructive",
            title: "Error parsing CSV",
            description: error.message,
          });
        },
        skipEmptyLines: true,
      });
    };

    reader.readAsArrayBuffer(file); // Read as ArrayBuffer instead of text
  };

  const handleUpload = async () => {
    if (parsedData.length === 0) return;

    try {
      setIsLoading(true);
      const response = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: parsedData,
          priceDate: date.toISOString()
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: `Successfully uploaded ${data.count} items to the database!`,
        });
        // Reset the form
        setFile(null);
        setParsedData([]);
      } else {
        throw new Error(data.error || "Failed to upload data");
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to upload data",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Upload Materials and Prices</h1>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[180px]">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(date, "MMMM yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(newDate: Date | undefined) => newDate && setDate(newDate)}
                initialFocus
                disabled={(date) => {
                  // Only allow selecting the first day of each month
                  return date.getDate() !== 1;
                }}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="flex-1"
              />
            </div>
            <Button
              onClick={handleParse}
              disabled={!file || isLoading}
              variant="secondary"
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Parse CSV
            </Button>
          </div>

          {parsedData.length > 0 && (
            <div className="mt-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Price date: {format(date, "MMMM yyyy")}
                </div>
                <div className="text-sm text-muted-foreground">
                  {parsedData.length} items found
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Unidad</TableHead>
                      <TableHead className="text-right">Precio</TableHead>
                      <TableHead>Categoría</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.nombre}</TableCell>
                        <TableCell>{item.unidad}</TableCell>
                        <TableCell className="text-right">${item.precio.toFixed(2)}</TableCell>
                        <TableCell>{item.categoria}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-4 flex justify-end">
                <Button
                  onClick={handleUpload}
                  disabled={isLoading}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {isLoading ? "Uploading..." : "Upload to Database"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
