"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, AlertTriangle, CheckCircle2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { csvImportRowSchema } from "@smoke-shop/validators";
import type { z } from "zod";

type CsvRow = z.infer<typeof csvImportRowSchema>;

interface ParsedRow {
  data: Record<string, string>;
  parsed: CsvRow | null;
  error: string | null;
  rowNum: number;
}

function parseCsv(text: string): ParsedRow[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = lines[0]!.split(",").map((h) => h.trim().toLowerCase());
  const rows: ParsedRow[] = [];

  for (let i = 1; i < lines.length && i <= 501; i++) {
    const values = lines[i]!.split(",").map((v) => v.trim());
    const data: Record<string, string> = {};
    headers.forEach((h, j) => {
      data[h] = values[j] ?? "";
    });

    const result = csvImportRowSchema.safeParse(data);
    rows.push({
      data,
      parsed: result.success ? result.data : null,
      error: result.success ? null : result.error.issues.map((e) => e.message).join("; "),
      rowNum: i + 1,
    });
  }

  return rows;
}

export default function CsvImportPage() {
  const router = useRouter();
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState("");

  const importMutation = trpc.storeProduct.importCsv.useMutation({
    onSuccess: () => {
      // Redirect after short delay to show results
    },
  });

  function handleFile(file: File) {
    if (!file.name.endsWith(".csv")) {
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setParsedRows(parseCsv(text));
    };
    reader.readAsText(file);
  }

  const validRows = parsedRows.filter((r) => r.parsed);
  const invalidRows = parsedRows.filter((r) => !r.parsed);
  const hasErrors = invalidRows.length > 0;

  function handleImport() {
    if (hasErrors) return; // All-or-nothing
    const rows = validRows.map((r) => r.parsed!);
    importMutation.mutate({ rows });
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-bold">Import Products from CSV</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Upload a CSV file with columns: name, category_slug, price, quantity, brand, sku, description, age_restricted, minimum_age
      </p>

      {/* Download template */}
      <button
        onClick={() => {
          const template = "name,category_slug,price,quantity,brand,sku,description,age_restricted,minimum_age\n";
          const blob = new Blob([template], { type: "text/csv" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "product-import-template.csv";
          a.click();
          URL.revokeObjectURL(url);
        }}
        className="mt-3 text-sm text-primary hover:underline"
      >
        Download CSV template
      </button>

      {/* Upload area */}
      {parsedRows.length === 0 && (
        <div
          className="mt-6 cursor-pointer rounded-lg border-2 border-dashed p-12 text-center transition-colors hover:border-primary"
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            if (file) handleFile(file);
          }}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = ".csv";
            input.onchange = (e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (file) handleFile(file);
            };
            input.click();
          }}
        >
          <Upload className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            Drag & drop a CSV file or click to browse
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Max 500 rows</p>
        </div>
      )}

      {/* Preview */}
      {parsedRows.length > 0 && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{fileName}</p>
              <p className="text-xs text-muted-foreground">
                {parsedRows.length} rows: {validRows.length} valid, {invalidRows.length} with errors
              </p>
            </div>
            <button
              onClick={() => {
                setParsedRows([]);
                setFileName("");
              }}
              className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
            >
              Clear
            </button>
          </div>

          {parsedRows.length > 500 && (
            <div className="flex items-center gap-2 rounded-md border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-700 dark:border-yellow-700 dark:bg-yellow-950 dark:text-yellow-300">
              <AlertTriangle className="h-4 w-4" /> Max 500 rows per import. Only the first 500 rows will be processed.
            </div>
          )}

          {hasErrors && (
            <div className="flex items-center gap-2 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300">
              <AlertTriangle className="h-4 w-4" /> Fix all errors before importing. Invalid rows are highlighted below.
            </div>
          )}

          <div className="max-h-96 overflow-auto rounded-lg border">
            <table className="w-full text-xs">
              <thead className="sticky top-0 border-b bg-muted/80">
                <tr>
                  <th className="p-2 text-left">Row</th>
                  <th className="p-2 text-left">Name</th>
                  <th className="p-2 text-left">Category</th>
                  <th className="p-2 text-right">Price</th>
                  <th className="p-2 text-right">Qty</th>
                  <th className="p-2 text-left">Brand</th>
                  <th className="p-2 text-left">SKU</th>
                  <th className="p-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {parsedRows.slice(0, 500).map((row) => (
                  <tr
                    key={row.rowNum}
                    className={row.error ? "bg-red-50 dark:bg-red-950/30" : ""}
                  >
                    <td className="p-2">{row.rowNum}</td>
                    <td className="p-2">{row.data.name}</td>
                    <td className="p-2">{row.data.category_slug}</td>
                    <td className="p-2 text-right">{row.data.price}</td>
                    <td className="p-2 text-right">{row.data.quantity}</td>
                    <td className="p-2">{row.data.brand}</td>
                    <td className="p-2">{row.data.sku}</td>
                    <td className="p-2">
                      {row.error ? (
                        <span className="text-destructive">{row.error}</span>
                      ) : (
                        <span className="text-green-600">OK</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {importMutation.isSuccess && (
            <div className="flex items-center gap-2 rounded-md bg-green-50 p-3 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
              <CheckCircle2 className="h-4 w-4" />
              Imported {importMutation.data.imported} products.
              {importMutation.data.skipped.length > 0 && (
                <span> Skipped {importMutation.data.skipped.length} (duplicate SKU).</span>
              )}
              <button onClick={() => router.push("/store/products")} className="ml-auto underline">
                View Products
              </button>
            </div>
          )}

          {!importMutation.isSuccess && (
            <div className="flex justify-end gap-3">
              <button
                onClick={() => router.back()}
                className="rounded-md border px-4 py-2 text-sm hover:bg-accent"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={hasErrors || importMutation.isPending}
                className="rounded-md bg-primary px-6 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {importMutation.isPending
                  ? "Importing..."
                  : `Import ${validRows.length} Products`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
