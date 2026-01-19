import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, CheckCircle, AlertCircle, X } from 'lucide-react';
import { type FileUploadResponse, type FileUploadError } from '@/types/knowledge';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'success' | 'error';
  message?: string;
  items_created?: number;
  progress: number;
}

interface FileUploadProps {
  onUploadSuccess?: () => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onUploadSuccess }) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // File Upload Ref
  const fileRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const addUploadedFile = (file: File): string => {
    const fileId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const uploadedFile: UploadedFile = {
      id: fileId,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'uploading',
      progress: 0
    };

    setUploadedFiles(prev => [...prev, uploadedFile]);
    return fileId;
  };

  const updateFileStatus = (fileId: string, status: 'success' | 'error', message?: string, items_created?: number) => {
    setUploadedFiles(prev => prev.map(file =>
      file.id === fileId
        ? { ...file, status, message, items_created, progress: 100 }
        : file
    ));

    // Call onUploadSuccess when file is successfully uploaded
    if (status === 'success' && onUploadSuccess) {
      onUploadSuccess();
    }
  };

  const updateFileProgress = (fileId: string, progress: number) => {
    setUploadedFiles(prev => prev.map(file =>
      file.id === fileId
        ? { ...file, progress }
        : file
    ));
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const uploadFile = async (file: File): Promise<void> => {
    const fileId = addUploadedFile(file);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Simulate progress
      const progressInterval = setInterval(() => {
        updateFileProgress(fileId, Math.min(90, Math.random() * 80 + 10));
      }, 200);

      const response = await fetch(`${import.meta.env.VITE_BACKEND_BASE_URL}/upload-file`, {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      if (response.ok) {
        const result: FileUploadResponse = await response.json();
        updateFileStatus(fileId, 'success', result.message, result.items_created);
      } else {
        const error: FileUploadError = await response.json();
        updateFileStatus(fileId, 'error', error.detail);
      }
    } catch (error) {
      updateFileStatus(fileId, 'error', 'Network error occurred');
      console.error('Upload error:', error);
    }
  };

  const handleUpload = async () => {
    const files = fileRef.current?.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    try {
      for (const file of Array.from(files)) {
        await uploadFile(file);
      }
    } finally {
      setIsUploading(false);
      if (fileRef.current) {
        fileRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Upload File</h2>
          <p className="text-gray-600">Upload file PDF atau TXT ke knowledge base</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload File
          </CardTitle>
          <CardDescription>
            Upload file PDF atau TXT untuk ditambahkan ke knowledge base
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file-upload">Pilih File</Label>
            <Input
              id="file-upload"
              type="file"
              ref={fileRef}
              accept=".pdf,.txt"
              multiple
              disabled={isUploading}
            />
            <p className="text-sm text-gray-500">
              Mendukung: PDF, TXT
            </p>
          </div>

          <Button
            onClick={handleUpload}
            disabled={isUploading}
            className="w-full"
          >
            <Upload className="w-4 h-4 mr-2" />
            {isUploading ? 'Uploading...' : 'Upload File'}
          </Button>

          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              <strong>Info:</strong> Setiap file PDF/TXT akan menjadi 1 knowledge item
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Upload History */}
      {uploadedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Riwayat Upload</CardTitle>
            <CardDescription>
              Status upload file yang telah diproses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {uploadedFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className={`p-2 rounded-full ${file.status === 'success' ? 'bg-green-100 text-green-600' :
                        file.status === 'error' ? 'bg-red-100 text-red-600' :
                          'bg-blue-100 text-blue-600'
                      }`}>
                      {file.status === 'success' ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : file.status === 'error' ? (
                        <AlertCircle className="w-4 h-4" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)}
                        {file.items_created && ` • ${file.items_created} items dibuat`}
                      </p>
                      {file.message && (
                        <p className={`text-xs ${file.status === 'error' ? 'text-red-600' : 'text-green-600'
                          }`}>
                          {file.message}
                        </p>
                      )}
                      {file.status === 'uploading' && (
                        <Progress value={file.progress} className="mt-1 h-1" />
                      )}
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(file.id)}
                    className="ml-2"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FileUpload;