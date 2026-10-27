import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  FileCheck,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  FileSpreadsheet,
  Layers,
  Database,
  RefreshCw,
} from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';

export default function ScheduleUpload() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { selectedProject } = useProject();
  const activeProjectId = projectId || selectedProject?.id || 'proj-001';

  const [step, setStep] = useState(1); // 1: Upload, 2: Column Mapping, 3: Validation & Preview, 4: Complete
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [fileError, setFileError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Column mappings
  const [columnMapping, setColumnMapping] = useState({
    activityId: 'Activity_ID',
    activityName: 'Activity_Name',
    wbsCode: 'WBS_Code',
    level: 'WBS_Level',
    discipline: 'Discipline_Code',
    plannedStart: 'Target_Start_Date',
    plannedFinish: 'Target_Finish_Date',
    quantity: 'Scope_Qty',
    unit: 'UOM',
  });

  const availableSourceColumns = [
    'Activity_ID',
    'Activity_Name',
    'WBS_Code',
    'WBS_Level',
    'Discipline_Code',
    'Target_Start_Date',
    'Target_Finish_Date',
    'Scope_Qty',
    'UOM',
    'Subcontractor',
    'Resource_Code',
    'Duration_Days',
  ];

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file) => {
    setFileError('');
    const validExtensions = ['.xer', '.xml', '.xlsx', '.xls', '.csv'];
    const fileName = file.name.toLowerCase();
    const isValidExt = validExtensions.some((ext) => fileName.endsWith(ext));

    if (!isValidExt) {
      setFileError('Invalid file format. Please upload a Primavera P6 (.xer), MS Project (.xml), Excel (.xlsx), or CSV file.');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setFileError('File size exceeds maximum 25 MB limit.');
      return;
    }

    setSelectedFile(file);
  };

  const handleStartImport = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setStep(4);
    }, 1500);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Import / Synchronize Baseline Schedule</h1>
          <p className="text-xs text-slate-500 mt-1">
            Import schedule activities, WBS levels, and planned quantities from Primavera P6, MS Project, or Excel
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate(`/projects/${activeProjectId}/schedule`)}
        >
          Cancel
        </Button>
      </div>

      {/* Stepper */}
      <div className="grid grid-cols-4 gap-2 text-xs">
        {[
          { num: 1, label: '1. Select File' },
          { num: 2, label: '2. Column Mapping' },
          { num: 3, label: '3. Validation & Preview' },
          { num: 4, label: '4. Complete' },
        ].map((s) => (
          <div
            key={s.num}
            className={`p-3 rounded-lg border text-center font-medium transition-colors ${
              step === s.num
                ? 'bg-primary-50 border-primary-300 text-primary-700 font-bold'
                : step > s.num
                ? 'bg-slate-50 border-slate-200 text-success-700'
                : 'bg-white border-slate-200 text-slate-400'
            }`}
          >
            {s.label}
          </div>
        ))}
      </div>

      {/* Step 1: File Selection */}
      {step === 1 && (
        <Card className="p-8">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer ${
              dragActive
                ? 'border-primary-500 bg-primary-50/50'
                : selectedFile
                ? 'border-success-400 bg-success-50/20'
                : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
            }`}
            onClick={() => document.getElementById('schedule-file-input')?.click()}
          >
            <input
              id="schedule-file-input"
              type="file"
              accept=".xer,.xml,.xlsx,.xls,.csv"
              onChange={handleFileInput}
              className="hidden"
            />

            <div className="w-14 h-14 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center mx-auto mb-4">
              <UploadCloud size={28} />
            </div>

            {selectedFile ? (
              <div>
                <p className="text-base font-bold text-slate-800 flex items-center justify-center gap-2">
                  <CheckCircle2 size={18} className="text-success-600" />
                  {selectedFile.name}
                </p>
                <p className="text-xs text-slate-500 mt-1 font-mono">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB · Ready for mapping
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                  }}
                  className="mt-3 text-xs text-danger-600 hover:underline"
                >
                  Choose a different file
                </button>
              </div>
            ) : (
              <div>
                <p className="text-base font-semibold text-slate-800 mb-1">
                  Drag and drop your schedule file here, or click to browse
                </p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Supports Primavera P6 (.xer), MS Project (.xml), Excel (.xlsx / .xls), and delimited CSV
                </p>
                <span className="inline-block mt-4 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-xs">
                  Browse Files on Computer
                </span>
              </div>
            )}
          </div>

          {fileError && (
            <div className="mt-4 p-3 bg-danger-50 border border-danger-200 rounded-lg text-xs text-danger-700 flex items-center gap-2">
              <AlertCircle size={15} />
              <span>{fileError}</span>
            </div>
          )}

          {/* Preset sample button */}
          {!selectedFile && (
            <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">Need a demonstration file?</span>
              <Button
                variant="secondary"
                size="xs"
                onClick={() => {
                  setSelectedFile({
                    name: 'ABC_Refinery_Expansion_Rev03_Baseline.xer',
                    size: 8.4 * 1024 * 1024,
                  });
                }}
              >
                Use Sample Baseline Schedule (.xer)
              </Button>
            </div>
          )}

          <div className="mt-8 flex justify-end">
            <Button
              disabled={!selectedFile}
              onClick={() => setStep(2)}
              icon={ArrowRight}
              iconPosition="right"
            >
              Proceed to Column Mapping
            </Button>
          </div>
        </Card>
      )}

      {/* Step 2: Column Mapping */}
      {step === 2 && (
        <Card className="p-6 space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">Map Columns to ProjectPulse Schema</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Verify detected column mappings from <span className="font-semibold text-slate-700">{selectedFile?.name}</span>
            </p>
          </div>

          <div className="space-y-3">
            {[
              { key: 'activityId', label: 'Activity ID / Task Code *', desc: 'Unique identifier for task (e.g. L6-101)' },
              { key: 'activityName', label: 'Activity Name / Description *', desc: 'Full task description' },
              { key: 'level', label: 'WBS Level / Hierarchy Code', desc: 'Hierarchy tier indicator (L1 through L6)' },
              { key: 'discipline', label: 'Discipline', desc: 'Engineering discipline (Piping, Civil, etc.)' },
              { key: 'plannedStart', label: 'Planned Start Date *', desc: 'Baseline target start date' },
              { key: 'plannedFinish', label: 'Planned Finish Date *', desc: 'Baseline target finish date' },
              { key: 'quantity', label: 'Planned Scope / Quantity', desc: 'Physical quantity metric (e.g. 450)' },
              { key: 'unit', label: 'Unit of Measure (UOM)', desc: 'Metric unit (meters, tons, m3, each)' },
            ].map((f) => (
              <div
                key={f.key}
                className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-slate-50 rounded-lg border border-slate-200 items-center text-xs"
              >
                <div>
                  <span className="font-semibold text-slate-800">{f.label}</span>
                  <p className="text-slate-400 text-[11px] mt-0.5">{f.desc}</p>
                </div>
                <div>
                  <select
                    value={columnMapping[f.key] || ''}
                    onChange={(e) => setColumnMapping({ ...columnMapping, [f.key]: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">— Select Source Column —</option>
                    {availableSourceColumns.map((col) => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setStep(1)} icon={ArrowLeft}>
              Back
            </Button>
            <Button onClick={() => setStep(3)} icon={ArrowRight} iconPosition="right">
              Proceed to Validation & Preview
            </Button>
          </div>
        </Card>
      )}

      {/* Step 3: Validation & Preview */}
      {step === 3 && (
        <Card className="p-6 space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">Pre-Import Validation & Sample Preview</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated checks executed across 2,430 candidate rows
            </p>
          </div>

          {/* Validation alerts */}
          <div className="space-y-2">
            <div className="p-3 bg-success-50 border border-success-200 rounded-lg text-xs text-success-800 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-success-600 flex-shrink-0" />
              <span><strong>2,430 Activities Parsed:</strong> All rows have valid Activity IDs and positive duration dates.</span>
            </div>
            <div className="p-3 bg-warning-50 border border-warning-200 rounded-lg text-xs text-warning-800 flex items-center gap-2">
              <AlertCircle size={16} className="text-warning-600 flex-shrink-0" />
              <span><strong>Notice:</strong> 14 activities have missing parent IDs (automatically mapped to Level 2 Process Plant root).</span>
            </div>
          </div>

          {/* Sample preview table */}
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
              Preview (First 3 Rows)
            </span>
            <div className="border border-slate-200 rounded-lg overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Activity ID</th>
                    <th className="p-2.5">Name</th>
                    <th className="p-2.5">Level</th>
                    <th className="p-2.5">Discipline</th>
                    <th className="p-2.5">Planned Start</th>
                    <th className="p-2.5">Planned Finish</th>
                    <th className="p-2.5">Quantity / Unit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  <tr>
                    <td className="p-2.5 font-bold text-slate-800">L6-101</td>
                    <td className="p-2.5 font-sans font-medium text-slate-800">Install 10-inch CS Pipeline — Unit A</td>
                    <td className="p-2.5">L6</td>
                    <td className="p-2.5 font-sans">Piping</td>
                    <td className="p-2.5">2026-04-01</td>
                    <td className="p-2.5">2026-12-15</td>
                    <td className="p-2.5">450 meters</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-slate-800">L6-102</td>
                    <td className="p-2.5 font-sans font-medium text-slate-800">Install 12-inch CS Pipeline — Unit B</td>
                    <td className="p-2.5">L6</td>
                    <td className="p-2.5 font-sans">Piping</td>
                    <td className="p-2.5">2026-05-01</td>
                    <td className="p-2.5">2027-01-31</td>
                    <td className="p-2.5">620 meters</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-slate-800">L6-103</td>
                    <td className="p-2.5 font-sans font-medium text-slate-800">Install 8-inch CS Pipeline — Unit C</td>
                    <td className="p-2.5">L6</td>
                    <td className="p-2.5 font-sans">Piping</td>
                    <td className="p-2.5">2026-08-01</td>
                    <td className="p-2.5">2027-03-31</td>
                    <td className="p-2.5">380 meters</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setStep(2)} icon={ArrowLeft}>
              Back
            </Button>
            <Button
              onClick={handleStartImport}
              loading={isProcessing}
              icon={Database}
            >
              Synchronize & Apply Baseline Schedule
            </Button>
          </div>
        </Card>
      )}

      {/* Step 4: Complete */}
      {step === 4 && (
        <Card className="p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-success-50 text-success-600 flex items-center justify-center mx-auto">
            <CheckCircle2 size={36} />
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900">Schedule Synchronized Successfully!</h2>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              2,430 activities have been imported and indexed across WBS tiers L1 through L6. The schedule linking engine is ready for daily report matching.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 max-w-sm mx-auto text-xs space-y-2 text-left">
            <div className="flex justify-between">
              <span className="text-slate-500">File Name:</span>
              <span className="font-semibold text-slate-800">{selectedFile?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total Activities:</span>
              <span className="font-semibold text-slate-800">2,430</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Hierarchy Levels:</span>
              <span className="font-semibold text-slate-800">L1 to L6</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Audit Record:</span>
              <span className="font-mono text-primary-600 font-medium">Logged in Audit Trail</span>
            </div>
          </div>

          <div className="pt-4 flex justify-center gap-3">
            <Button
              variant="secondary"
              onClick={() => navigate(`/projects/${activeProjectId}/dashboard`)}
            >
              Go to Dashboard
            </Button>
            <Button
              onClick={() => navigate(`/projects/${activeProjectId}/schedule`)}
              icon={ArrowRight}
              iconPosition="right"
            >
              Explore Schedule Hierarchy
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
