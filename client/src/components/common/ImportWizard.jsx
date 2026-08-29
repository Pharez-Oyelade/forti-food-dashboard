import React, { useState } from "react";
import { UploadCloud, CheckCircle, AlertTriangle, X, ArrowRight, ArrowLeft } from "lucide-react";
import { toast } from "react-toastify";
import { Button, LoadingSpinner } from "./index";

export default function ImportWizard({ isOpen, onClose, importType, title, onImportSuccess }) {
  const [step, setStep] = useState(1);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);

  // Analysis state
  const [sheetNames, setSheetNames] = useState([]);
  const [sheetsData, setSheetsData] = useState({});
  const [expectedFields, setExpectedFields] = useState([]);
  
  // Selection state
  const [selectedSheet, setSelectedSheet] = useState("");
  const [headerRowIndex, setHeaderRowIndex] = useState(null);
  
  // Mapping state: { "SpreadsheetHeader": "db_field_key" }
  const [mappings, setMappings] = useState({});
  
  // Preview & Validation state
  const [previewRows, setPreviewRows] = useState([]);
  const [commitResult, setCommitResult] = useState(null);

  if (!isOpen) return null;

  const reset = () => {
    setStep(1);
    setSelectedFile(null);
    setSheetNames([]);
    setSheetsData({});
    setExpectedFields([]);
    setSelectedSheet("");
    setHeaderRowIndex(null);
    setMappings({});
    setPreviewRows([]);
    setCommitResult(null);
    setLoading(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const getToken = () => document.cookie.split("; ").find((row) => row.startsWith("token="))?.split("=")[1];

  const detectBestHeaderRow = (rows, fields) => {
    let bestIndex = 0;
    let maxMatches = 0;
    rows.forEach((row, idx) => {
      let matches = 0;
      row.forEach(cell => {
        if (!cell) return;
        const cleanCell = cell.toString().toLowerCase().replace(/[^a-z0-9]/g, '');
        const isMatch = fields.some(f => {
          const cleanLabel = f.label.toLowerCase().replace(/[^a-z0-9]/g, '');
          const cleanKey = f.key.toLowerCase().replace(/[^a-z0-9]/g, '');
          return cleanCell === cleanLabel || cleanCell === cleanKey || 
                 (cleanCell.length > 2 && (cleanCell.includes(cleanLabel) || cleanLabel.includes(cleanCell) || cleanCell.includes(cleanKey)));
        });
        if (isMatch) matches++;
      });
      if (matches > maxMatches) {
        maxMatches = matches;
        bestIndex = idx;
      }
    });
    return { bestIndex: maxMatches > 0 ? bestIndex : null, maxMatches };
  };

  // 1. Analyze File
  const handleAnalyze = async (file) => {
    if (!file) return;
    setSelectedFile(file);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", importType);

      const res = await fetch(`/api/v1/import/analyze`, {
        method: "POST",
        headers: { ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}) },
        body: formData,
      });

      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.message || "Failed to analyze file");

      setSheetNames(result.data.sheetNames);
      setSheetsData(result.data.sheetsData);
      setExpectedFields(result.data.expectedFields);
      
      // Auto-detect the best sheet by scoring all sheets against expected fields
      let bestSheet = result.data.sheetNames[0] || "";
      let bestOverallHeaderRow = null;
      let highestOverallMatches = -1;

      for (const sheetName of result.data.sheetNames) {
        const { bestIndex, maxMatches } = detectBestHeaderRow(result.data.sheetsData[sheetName] || [], result.data.expectedFields);
        if (maxMatches > highestOverallMatches) {
          highestOverallMatches = maxMatches;
          bestSheet = sheetName;
          bestOverallHeaderRow = bestIndex;
        }
      }
      
      setSelectedSheet(bestSheet);
      setHeaderRowIndex(bestOverallHeaderRow);
      
      setStep(2);
    } catch (err) {
      toast.error(err.message);
      setSelectedFile(null);
    } finally {
      setLoading(false);
    }
  };

  // 2. Select Sheet & Header Row
  const handleSheetSelection = () => {
    // Auto-map based on string similarity when moving to Step 3
    const newMappings = {};
    const headers = sheetsData[selectedSheet]?.[headerRowIndex] || [];
    
    headers.forEach(header => {
      if (!header) return;
      const cleanHeader = header.toString().toLowerCase().replace(/[^a-z0-9]/g, '');
      const match = expectedFields.find(f => {
        const cleanLabel = f.label.toLowerCase().replace(/[^a-z0-9]/g, '');
        const cleanKey = f.key.toLowerCase().replace(/[^a-z0-9]/g, '');
        return cleanHeader.includes(cleanLabel) || cleanLabel.includes(cleanHeader) || cleanHeader.includes(cleanKey);
      });
      if (match) newMappings[header] = match.key;
    });
    
    setMappings(newMappings);
    setStep(3);
  };

  // 3. Validate & Preview
  const handleValidate = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("type", importType);
      formData.append("sheetName", selectedSheet);
      formData.append("headerRowIndex", headerRowIndex);
      formData.append("mappings", JSON.stringify(mappings));

      const res = await fetch(`/api/v1/import/validate`, {
        method: "POST",
        headers: { ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}) },
        body: formData,
      });

      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.message || "Validation failed");

      setPreviewRows(result.data.rows);
      setStep(4);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 4. Commit
  const handleCommit = async () => {
    setLoading(true);
    try {
      const validRows = previewRows.filter(r => r.isValid);
      const res = await fetch(`/api/v1/import/commit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {})
        },
        body: JSON.stringify({ type: importType, rows: validRows }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.message || "Import failed");

      setCommitResult(result.data);
      if (result.data.successCount > 0) toast.success(`Imported ${result.data.successCount} records!`);
      if (result.data.errorCount > 0) toast.error(`${result.data.errorCount} records failed.`);
      
      setStep(5);
      if (onImportSuccess) onImportSuccess();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Renders
  const renderStep1 = () => (
    <div className="text-center p-8 border-2 border-dashed border-slate-700 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 transition-colors">
      <UploadCloud className="w-16 h-16 text-brand-lime mx-auto mb-4 opacity-80" />
      <h3 className="text-lg font-medium text-slate-200 mb-2">Upload Spreadsheet</h3>
      <p className="text-sm text-slate-400 mb-6">Support for .xlsx, .xls, and .csv files.</p>
      <input
        type="file"
        id="wizard-file-upload"
        className="hidden"
        accept=".xlsx,.xls,.csv"
        onChange={(e) => handleAnalyze(e.target.files[0])}
      />
      <Button variant="primary" onClick={() => document.getElementById("wizard-file-upload").click()} disabled={loading}>
        {loading ? "Analyzing..." : "Select File"}
      </Button>
    </div>
  );

  const renderStep2 = () => {
    const rawRows = sheetsData[selectedSheet] || [];
    return (
      <div className="space-y-6">
        <div>
          <label className="block text-sm text-slate-400 mb-2">Select Sheet</label>
          <select 
            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200"
            value={selectedSheet}
            onChange={(e) => { 
              const newSheet = e.target.value;
              setSelectedSheet(newSheet); 
              const { bestIndex } = detectBestHeaderRow(sheetsData[newSheet] || [], expectedFields);
              setHeaderRowIndex(bestIndex); 
            }}
          >
            {sheetNames.map(name => <option key={name} value={name}>{name}</option>)}
          </select>
        </div>
        
        <div>
          <p className="text-sm text-slate-300 mb-2">Select the row that contains the column headers:</p>
          <div className="border border-slate-700 rounded-lg overflow-x-auto bg-slate-800/50 max-h-[300px]">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <tbody>
                {rawRows.map((row, idx) => (
                  <tr 
                    key={idx} 
                    onClick={() => setHeaderRowIndex(idx)}
                    className={`cursor-pointer transition-colors border-b border-slate-700/50 last:border-0 ${headerRowIndex === idx ? 'bg-brand-lime/20 border-brand-lime' : 'hover:bg-slate-700'}`}
                  >
                    <td className="p-2 border-r border-slate-700 w-12 text-center font-mono text-xs text-slate-500">
                      {idx + 1}
                    </td>
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className={`p-2 ${headerRowIndex === idx ? 'font-bold text-brand-lime' : 'text-slate-300'}`}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-between pt-4 border-t border-slate-700">
          <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
          <Button variant="primary" icon={ArrowRight} onClick={handleSheetSelection} disabled={headerRowIndex === null}>Continue to Mapping</Button>
        </div>
      </div>
    );
  };

  const renderStep3 = () => {
    const headers = sheetsData[selectedSheet]?.[headerRowIndex] || [];
    
    return (
      <div className="space-y-6">
        <p className="text-sm text-slate-300">Map your spreadsheet columns to the required database fields.</p>
        
        <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
          <div className="grid grid-cols-2 p-3 bg-slate-900 border-b border-slate-700 font-medium text-sm text-slate-400">
            <div>Spreadsheet Header</div>
            <div>Database Field</div>
          </div>
          <div className="max-h-[400px] overflow-y-auto p-2 space-y-2">
            {headers.map((header, idx) => {
              if (!header) return null;
              return (
                <div key={idx} className="grid grid-cols-2 gap-4 items-center p-2 rounded hover:bg-slate-700/30">
                  <div className="text-sm text-slate-200 truncate pr-4" title={header}>{header}</div>
                  <select
                    className="w-full bg-slate-900 border border-slate-600 rounded p-1.5 text-sm text-slate-200"
                    value={mappings[header] || ""}
                    onChange={(e) => setMappings({ ...mappings, [header]: e.target.value })}
                  >
                    <option value="">-- Ignore Column --</option>
                    {expectedFields.map(f => (
                      <option key={f.key} value={f.key}>{f.label} {f.required ? '*' : ''}</option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-between pt-4 border-t border-slate-700">
          <Button variant="ghost" onClick={() => setStep(2)}>Back</Button>
          <Button variant="primary" icon={ArrowRight} onClick={handleValidate} disabled={loading}>
            {loading ? "Validating..." : "Preview Data"}
          </Button>
        </div>
      </div>
    );
  };

  const renderStep4 = () => {
    const validCount = previewRows.filter(r => r.isValid).length;
    const errorCount = previewRows.length - validCount;

    return (
      <div className="space-y-6">
        <div className="flex gap-4">
          <div className="flex-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-emerald-400">{validCount}</div>
            <div className="text-sm text-emerald-500/70">Ready to Import</div>
          </div>
          <div className={`flex-1 border rounded-lg p-4 text-center ${errorCount > 0 ? 'bg-red-500/10 border-red-500/20' : 'bg-slate-800 border-slate-700'}`}>
            <div className={`text-2xl font-bold ${errorCount > 0 ? 'text-red-400' : 'text-slate-500'}`}>{errorCount}</div>
            <div className={`text-sm ${errorCount > 0 ? 'text-red-500/70' : 'text-slate-500'}`}>Rows with Errors</div>
          </div>
        </div>

        <div className="border border-slate-700 rounded-lg overflow-x-auto max-h-[300px]">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-800 sticky top-0">
              <tr>
                <th className="p-3 text-slate-400 font-medium border-b border-slate-700">Row</th>
                <th className="p-3 text-slate-400 font-medium border-b border-slate-700">Status</th>
                {expectedFields.map(f => (
                  <th key={f.key} className="p-3 text-slate-400 font-medium border-b border-slate-700">{f.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewRows.map((row, i) => (
                <tr key={i} className={`border-b border-slate-800 last:border-0 ${!row.isValid ? 'bg-red-500/5' : ''}`}>
                  <td className="p-3 text-slate-500 font-mono text-xs">{row._originalIndex}</td>
                  <td className="p-3">
                    {row.isValid ? (
                      <CheckCircle size={16} className="text-emerald-500" />
                    ) : (
                      <div className="group relative flex items-center">
                        <AlertTriangle size={16} className="text-red-500 cursor-help" />
                        <div className="hidden group-hover:block absolute left-6 z-10 bg-slate-900 border border-slate-700 text-xs p-2 rounded shadow-xl min-w-[200px] whitespace-normal">
                          <ul className="list-disc pl-4 text-red-400">
                            {row.errors.map((e, j) => <li key={j}>{e}</li>)}
                          </ul>
                        </div>
                      </div>
                    )}
                  </td>
                  {expectedFields.map(f => (
                    <td key={f.key} className="p-3 text-slate-300 truncate max-w-[200px]" title={row.data[f.key]}>
                      {row.data[f.key] !== undefined && row.data[f.key] !== null ? String(row.data[f.key]) : <span className="text-slate-600">-</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between pt-4 border-t border-slate-700">
          <Button variant="ghost" onClick={() => setStep(3)}>Back</Button>
          <Button variant="primary" onClick={handleCommit} disabled={validCount === 0 || loading}>
            {loading ? "Importing..." : `Import ${validCount} Rows`}
          </Button>
        </div>
      </div>
    );
  };

  const renderStep5 = () => (
    <div className="text-center p-8 space-y-6">
      <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
        <CheckCircle className="w-8 h-8 text-emerald-500" />
      </div>
      <div>
        <h3 className="text-xl font-bold text-slate-100">Import Complete</h3>
        <p className="text-slate-400 mt-2">
          Successfully imported <span className="text-emerald-400 font-bold">{commitResult?.successCount || 0}</span> records.
        </p>
        {commitResult?.errorCount > 0 && (
          <p className="text-red-400 text-sm mt-2">{commitResult.errorCount} records failed.</p>
        )}
      </div>
      <Button variant="primary" onClick={handleClose}>Done</Button>
    </div>
  );

  const steps = ["Upload", "Select Sheet", "Map Columns", "Preview", "Complete"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-4xl shadow-2xl relative flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-slate-800">
          <h2 className="text-xl font-semibold text-slate-100">{title || "Import Wizard"}</h2>
          <button onClick={handleClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Wizard Progress Bar */}
        <div className="flex items-center justify-between px-8 py-4 bg-slate-800/50 border-b border-slate-700/50 overflow-x-auto">
          {steps.map((s, idx) => {
            const current = idx + 1;
            const isActive = step === current;
            const isPast = step > current;
            return (
              <div key={current} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium border-2 transition-colors ${
                  isActive ? 'bg-brand-lime text-brand-dark border-brand-lime' : 
                  isPast ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/50' : 
                  'bg-slate-800 text-slate-500 border-slate-700'
                }`}>
                  {isPast ? <CheckCircle size={14} /> : current}
                </div>
                <span className={`ml-2 text-sm font-medium hidden sm:block ${isActive ? 'text-brand-lime' : isPast ? 'text-emerald-500' : 'text-slate-500'}`}>
                  {s}
                </span>
                {current < steps.length && (
                  <div className={`w-8 sm:w-12 h-px mx-2 sm:mx-4 ${isPast ? 'bg-emerald-500/50' : 'bg-slate-700'}`} />
                )}
              </div>
            );
          })}
        </div>

        <div className="p-6 overflow-y-auto">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
          {step === 5 && renderStep5()}
        </div>
      </div>
    </div>
  );
}
