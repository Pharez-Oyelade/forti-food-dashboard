import React, { useState } from "react";
import { UploadCloud, CheckCircle, AlertTriangle, X } from "lucide-react";
import { toast } from "react-toastify";
import { Button, LoadingSpinner } from "./index";

export default function ImportModal({ isOpen, onClose, importType, title, onImportSuccess }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [commitResult, setCommitResult] = useState(null);

  if (!isOpen) return null;

  const reset = () => {
    setSelectedFile(null);
    setPreviewData(null);
    setCommitResult(null);
    setLoading(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setPreviewData(null);
      setCommitResult(null);
    }
  };

  const handlePreview = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setCommitResult(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("type", importType);

      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1];

      const res = await fetch(`/api/v1/import/preview`, {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: formData,
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || "Failed to preview");
      }
      
      setPreviewData(result.data);
      toast.success(`Parsed ${result.data.rows.length} rows from ${result.data.sheetTargeted}`);
    } catch (err) {
      toast.error(err.message || "Error parsing file");
    } finally {
      setLoading(false);
    }
  };

  const handleCommit = async () => {
    if (!previewData || !previewData.rows) return;
    setLoading(true);
    try {
      const validRows = previewData.rows.filter(r => r.isValid);
      if (validRows.length === 0) {
        toast.error("No valid rows to import.");
        setLoading(false);
        return;
      }

      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1];

      const res = await fetch(`/api/v1/import/commit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          type: importType,
          rows: validRows
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || "Failed to commit import");
      }

      setCommitResult(result.data);
      toast.success(result.message);
      
      if (onImportSuccess) {
        onImportSuccess(); // refresh parent data
      }
    } catch (err) {
      toast.error(err.message || "Failed to commit import");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-[fadeIn_0.2s_ease-out]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-slate-700">
          <h2 className="text-xl font-bold text-slate-100">{title || `Import Data (${importType})`}</h2>
          <button onClick={handleClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Step 1: Upload */}
          {!previewData && !commitResult && (
            <div className="flex flex-col gap-6">
              <div className="border-2 border-dashed border-slate-700 bg-slate-800/50 rounded-xl p-10 text-center relative hover:border-brand-lime hover:bg-slate-800 transition-colors">
                <input
                  type="file"
                  accept=".xlsx"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <UploadCloud className="mx-auto h-12 w-12 text-slate-400 mb-3" />
                <p className="text-slate-200 font-medium">
                  {selectedFile ? selectedFile.name : "Click or drag .xlsx file here"}
                </p>
                <p className="text-slate-500 text-sm mt-1">
                  Upload the entire workbook. We will automatically extract the correct sheet.
                </p>
              </div>
              
              <div className="flex justify-end">
                <Button variant="primary" onClick={handlePreview} disabled={!selectedFile || loading}>
                  {loading ? <LoadingSpinner size="sm" /> : "Preview Data"}
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Preview */}
          {previewData && !commitResult && (
            <div className="flex flex-col gap-4">
              <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 flex justify-between items-center">
                <div>
                  <h3 className="text-slate-200 font-semibold">Targeted Sheet: <span className="text-brand-lime">{previewData.sheetTargeted}</span></h3>
                  <p className="text-sm text-slate-400">
                    {previewData.rows.length} rows parsed. {previewData.rows.filter(r => r.isValid).length} valid.
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button variant="ghost" onClick={reset}>Back</Button>
                  <Button variant="primary" onClick={handleCommit} disabled={loading}>
                    {loading ? <LoadingSpinner size="sm" /> : "Commit Valid Rows"}
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto max-h-[500px] border border-slate-700 rounded-lg">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-900 sticky top-0 z-10 shadow-md border-b border-slate-700">
                    <tr>
                      <th className="p-3 text-slate-400">Status</th>
                      <th className="p-3 text-slate-400">Row</th>
                      {Object.values(previewData.mappedHeaders).map((mappedCol, idx) => (
                        <th key={idx} className="p-3 text-brand-lime">{mappedCol}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {previewData.rows.map((row, i) => (
                      <tr key={i} className={`hover:bg-slate-800/50 ${!row.isValid ? "bg-red-900/10" : ""}`}>
                        <td className="p-3">
                          {row.isValid ? (
                            <span className="flex items-center text-green-400 gap-1"><CheckCircle size={14}/> Valid</span>
                          ) : (
                            <span className="flex items-center text-red-400 gap-1" title={row.errors.join(', ')}>
                              <AlertTriangle size={14}/> Error
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-slate-400">{row._originalIndex}</td>
                        {Object.values(previewData.mappedHeaders).map((mappedCol, idx) => (
                          <td key={idx} className="p-3 text-slate-200">
                            {row.data[mappedCol] || "-"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Step 3: Success */}
          {commitResult && (
            <div className="text-center py-10">
              <CheckCircle className="text-brand-lime mx-auto mb-4" size={64} />
              <h2 className="text-2xl font-bold text-slate-100 mb-2">Import Complete</h2>
              <p className="text-slate-300">
                Successfully updated {commitResult.successCount} records.
                {commitResult.errorCount > 0 && ` (${commitResult.errorCount} failed)`}
              </p>
              <Button variant="primary" className="mt-6" onClick={handleClose}>
                Done
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
