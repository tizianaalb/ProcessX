import React, { useState } from 'react';
import { X, Upload, FileText, Loader, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../lib/api';
import { Button } from './ui/button';

interface BPMNImportProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const BPMNImport: React.FC<BPMNImportProps> = ({ isOpen, onClose, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    processId: string;
    processName: string;
    stepsCount: number;
    connectionsCount: number;
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];

      // Validate file type
      if (!selectedFile.name.endsWith('.bpmn') && !selectedFile.name.endsWith('.xml')) {
        setError('Please select a valid BPMN file (.bpmn or .xml)');
        return;
      }

      setFile(selectedFile);
      setError(null);
      setSuccess(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError('Please select a file to import');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const result = await api.importBPMN(file);

      if (result.success && result.process) {
        setSuccess({
          processId: result.process.id,
          processName: result.process.name,
          stepsCount: result.process.stepsCount || 0,
          connectionsCount: result.process.connectionsCount || 0,
        });

        // Call onSuccess after a short delay to allow user to see the success message
        setTimeout(() => {
          onSuccess();
          handleClose();
        }, 2000);
      } else {
        setError(result.message || 'Failed to import BPMN file');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import BPMN file');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setError(null);
    setSuccess(null);
    setUploading(false);
    onClose();
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];

      if (!droppedFile.name.endsWith('.bpmn') && !droppedFile.name.endsWith('.xml')) {
        setError('Please select a valid BPMN file (.bpmn or .xml)');
        return;
      }

      setFile(droppedFile);
      setError(null);
      setSuccess(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full m-4">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-blue-600 p-6 flex items-center justify-between border-b border-indigo-700 rounded-t-xl">
          <div className="flex items-center gap-3">
            <Upload className="w-6 h-6 text-indigo-100" />
            <h2 className="text-2xl font-bold text-white">Import BPMN Process</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-indigo-100 hover:text-white transition-colors"
            disabled={uploading}
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {/* Description */}
          <p className="text-gray-700 mb-6">
            Upload a BPMN 2.0 XML file to import it as a new process in ProcessX.
            The BPMN file will be converted to a ProcessX process with all tasks and connections.
          </p>

          {/* File Upload Area */}
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              file
                ? 'border-green-400 bg-green-50'
                : 'border-gray-300 bg-gray-50 hover:border-indigo-400 hover:bg-indigo-50'
            }`}
          >
            <input
              type="file"
              id="bpmn-file-input"
              accept=".bpmn,.xml,application/xml,text/xml"
              onChange={handleFileChange}
              className="hidden"
              disabled={uploading}
            />

            {!file ? (
              <>
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-700 font-medium mb-2">
                  Drag and drop your BPMN file here
                </p>
                <p className="text-sm text-gray-600 mb-4">or</p>
                <label htmlFor="bpmn-file-input">
                  <span className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md cursor-pointer bg-white hover:bg-gray-50 text-sm font-medium transition-colors">
                    <FileText size={16} />
                    Choose File
                  </span>
                </label>
                <p className="text-xs text-gray-500 mt-4">
                  Supported formats: .bpmn, .xml (BPMN 2.0)
                </p>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <p className="text-gray-900 font-medium mb-2">{file.name}</p>
                <p className="text-sm text-gray-600 mb-4">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
                <label htmlFor="bpmn-file-input">
                  <span className={`inline-flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'}`}>
                    Choose Different File
                  </span>
                </label>
              </>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3 mb-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-900">
                    Process imported successfully!
                  </p>
                  <p className="text-sm text-green-700 mt-1">
                    <strong>{success.processName}</strong>
                  </p>
                </div>
              </div>
              <div className="ml-8 grid grid-cols-2 gap-4 text-sm text-green-800">
                <div>
                  <span className="font-medium">Steps:</span> {success.stepsCount}
                </div>
                <div>
                  <span className="font-medium">Connections:</span> {success.connectionsCount}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 flex justify-end gap-3">
            <Button
              onClick={handleClose}
              variant="outline"
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={!file || uploading || !!success}
              className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white"
            >
              {uploading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Import BPMN
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BPMNImport;
