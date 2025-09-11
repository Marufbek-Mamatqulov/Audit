import React, { useState, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { uploadFile } from '../store/slices/fileSlice';
import { fetchDepartments } from '../store/slices/departmentSlice';
import { 
  DocumentArrowUpIcon, 
  XMarkIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface FileUploadProps {
  onUploadComplete?: () => void;
  onClose?: () => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onUploadComplete, onClose }) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(state => state.auth);
  const { departments } = useAppSelector((state: any) => state.department);
  const { loading } = useAppSelector((state: any) => state.file);

  const [dragOver, setDragOver] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    department: user?.department || '',
    status: 'draft' as 'draft' | 'review' | 'approved' | 'archived'
  });
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (departments.length === 0) {
      dispatch(fetchDepartments());
    }
  }, [dispatch, departments.length]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      handleFiles(selectedFiles);
    }
  };

  const handleFiles = (newFiles: File[]) => {
    // Filter out files that are too large or of wrong type
    const validFiles = newFiles.filter(file => {
      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        alert(`File ${file.name} is too large. Maximum size is 50MB.`);
        return false;
      }
      
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel', // .xls
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
        'application/msword', // .doc
        'application/pdf',
        'text/plain',
        'text/csv'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        alert(`File type ${file.type} is not supported for ${file.name}.`);
        return false;
      }
      
      return true;
    });

    setFiles(prev => [...prev, ...validFiles]);
    
    // Auto-fill name if only one file and no name set
    if (validFiles.length === 1 && !formData.name) {
      setFormData(prev => ({
        ...prev,
        name: validFiles[0].name.split('.').slice(0, -1).join('.')
      }));
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (files.length === 0) {
      alert('Please select at least one file to upload.');
      return;
    }

    if (!formData.name.trim()) {
      alert('Please enter a name for the file.');
      return;
    }

    // Upload files one by one
    for (const file of files) {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('name', formData.name || file.name.split('.').slice(0, -1).join('.'));
      uploadFormData.append('description', formData.description);
      uploadFormData.append('status', formData.status);
      if (formData.department) {
        uploadFormData.append('department', formData.department.toString());
      }

      try {
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
        
        // Simulate upload progress (in real implementation, you'd track actual progress)
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: Math.min(prev[file.name] + 10, 90)
          }));
        }, 100);

        await dispatch(uploadFile(uploadFormData)).unwrap();
        
        clearInterval(progressInterval);
        setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
        
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
        setUploadProgress(prev => ({ ...prev, [file.name]: -1 })); // -1 indicates error
      }
    }

    // Reset form after successful uploads
    setTimeout(() => {
      setFiles([]);
      setFormData({
        name: '',
        description: '',
        department: user?.department || '',
        status: 'draft'
      });
      setUploadProgress({});
      onUploadComplete?.();
    }, 2000);
  };

  const getFileIcon = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'xlsx':
      case 'xls':
        return '📊';
      case 'docx':
      case 'doc':
        return '📄';
      case 'pdf':
        return '📕';
      default:
        return '📎';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Upload Files</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* File Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragOver
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <DocumentArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <p className="text-lg text-gray-600">
                Drop files here or <span className="text-primary-600 cursor-pointer">browse</span>
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Supports: Excel (.xlsx, .xls), Word (.docx, .doc), PDF, Text files
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Maximum file size: 50MB
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".xlsx,.xls,.docx,.doc,.pdf,.txt,.csv"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Selected Files */}
          {files.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Selected Files</h3>
              <div className="space-y-2">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getFileIcon(file)}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{file.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {uploadProgress[file.name] !== undefined && (
                        <div className="flex items-center space-x-2">
                          {uploadProgress[file.name] === 100 ? (
                            <CheckCircleIcon className="h-5 w-5 text-green-500" />
                          ) : uploadProgress[file.name] === -1 ? (
                            <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                          ) : (
                            <div className="w-8 h-2 bg-gray-200 rounded-full">
                              <div
                                className="h-2 bg-primary-600 rounded-full transition-all"
                                style={{ width: `${uploadProgress[file.name]}%` }}
                              />
                            </div>
                          )}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* File Details Form */}
          <div className="mt-6 grid grid-cols-1 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                File Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Enter file name"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Enter file description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                  Department
                </label>
                <select
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="">Select Department</option>
                  {Array.isArray(departments) && departments.map((dept: any) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="draft">Draft</option>
                  <option value="review">Under Review</option>
                  <option value="approved">Approved</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || files.length === 0}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Uploading...' : `Upload ${files.length} File${files.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FileUpload;
