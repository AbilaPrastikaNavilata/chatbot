import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, Table, CheckCircle, AlertCircle, X } from 'lucide-react';
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
  
  // Universal Upload States
  const universalFileRef = useRef<HTMLInputElement>(null);
  
  // Custom Mapping States
  const csvFileRef = useRef<HTMLInputElement>(null);
  const excelFileRef = useRef<HTMLInputElement>(null);
  const [csvTitleColumn, setCsvTitleColumn] = useState('');
  const [csvContentColumn, setCsvContentColumn] = useState('');
  const [excelTitleColumn, setExcelTitleColumn] = useState('');
  const [excelContentColumn, setExcelContentColumn] = useState('');

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

  const uploadFile = async (file: File, endpoint: string, additionalData?: FormData): Promise<void> => {
    const fileId = addUploadedFile(file);
    
    try {
      const formData = additionalData || new FormData();
      if (!additionalData) {
        formData.append('file', file);
      }

      // Simulate progress
      const progressInterval = setInterval(() => {
        updateFileProgress(fileId, Math.min(90, Math.random() * 80 + 10));
      }, 200);

      const response = await fetch(`${import.meta.env.VITE_BACKEND_BASE_URL}${endpoint}`, {
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

  const handleUniversalUpload = async () => {
    const files = universalFileRef.current?.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    
    try {
      for (const file of Array.from(files)) {
        await uploadFile(file, '/upload-file');
      }
    } finally {
      setIsUploading(false);
      if (universalFileRef.current) {
        universalFileRef.current.value = '';
      }
    }
  };

  const handleCustomCsvUpload = async () => {
    const files = csvFileRef.current?.files;
    if (!files || files.length === 0 || !csvTitleColumn || !csvContentColumn) return;

    setIsUploading(true);
    
    try {
      const file = files[0];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title_column', csvTitleColumn);
      formData.append('content_column', csvContentColumn);
      
      await uploadFile(file, '/upload-csv-custom', formData);
    } finally {
      setIsUploading(false);
      if (csvFileRef.current) {
        csvFileRef.current.value = '';
      }
      setCsvTitleColumn('');
      setCsvContentColumn('');
    }
  };

  const handleCustomExcelUpload = async () => {
    const files = excelFileRef.current?.files;
    if (!files || files.length === 0 || !excelTitleColumn || !excelContentColumn) return;

    setIsUploading(true);
    
    try {
      const file = files[0];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title_column', excelTitleColumn);
      formData.append('content_column', excelContentColumn);
      
      await uploadFile(file, '/upload-excel-custom', formData);
    } finally {
      setIsUploading(false);
      if (excelFileRef.current) {
        excelFileRef.current.value = '';
      }
      setExcelTitleColumn('');
      setExcelContentColumn('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Upload File</h2>
          <p className="text-gray-600">Upload berbagai jenis file ke knowledge base</p>
        </div>
      </div>

      <Tabs defaultValue="universal" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="universal">Upload Universal</TabsTrigger>
          <TabsTrigger value="csv">CSV Custom</TabsTrigger>
          <TabsTrigger value="excel">Excel Custom</TabsTrigger>
        </TabsList>

        {/* Universal Upload */}
        <TabsContent value="universal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload Universal
              </CardTitle>
              <CardDescription>
                Upload PDF, TXT, CSV, atau Excel dengan parsing otomatis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="universal-file">Pilih File</Label>
                <Input
                  id="universal-file"
                  type="file"
                  ref={universalFileRef}
                  accept=".pdf,.txt,.csv,.xlsx,.xls"
                  multiple
                  disabled={isUploading}
                />
                <p className="text-sm text-gray-500">
                  Mendukung: PDF, TXT, CSV, XLSX, XLS
                </p>
              </div>
              
              <Button 
                onClick={handleUniversalUpload}
                disabled={isUploading}
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                {isUploading ? 'Uploading...' : 'Upload File'}
              </Button>

              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  <strong>Mode Otomatis:</strong><br />
                  • PDF/TXT: 1 file = 1 knowledge item<br />
                  • CSV/Excel: 1 file = multiple items (setiap baris jadi 1 item)
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CSV Custom Upload */}
        <TabsContent value="csv" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Table className="w-5 h-5" />
                CSV dengan Custom Mapping
              </CardTitle>
              <CardDescription>
                Upload CSV dengan pilihan kolom untuk title dan content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="csv-file">Pilih File CSV</Label>
                <Input
                  id="csv-file"
                  type="file"
                  ref={csvFileRef}
                  accept=".csv"
                  disabled={isUploading}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="csv-title">Kolom Title</Label>
                  <Input
                    id="csv-title"
                    value={csvTitleColumn}
                    onChange={(e) => setCsvTitleColumn(e.target.value)}
                    placeholder="nama_produk"
                    disabled={isUploading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="csv-content">Kolom Content</Label>
                  <Input
                    id="csv-content"
                    value={csvContentColumn}
                    onChange={(e) => setCsvContentColumn(e.target.value)}
                    placeholder="deskripsi"
                    disabled={isUploading}
                  />
                </div>
              </div>
              
              <Button 
                onClick={handleCustomCsvUpload}
                disabled={isUploading || !csvTitleColumn || !csvContentColumn}
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                {isUploading ? 'Uploading...' : 'Upload CSV'}
              </Button>

              <Alert>
                <Table className="h-4 w-4" />
                <AlertDescription>
                  Kolom lain akan otomatis masuk ke metadata. Pastikan nama kolom sesuai dengan header CSV Anda.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Excel Custom Upload */}
        <TabsContent value="excel" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Table className="w-5 h-5" />
                Excel dengan Custom Mapping
              </CardTitle>
              <CardDescription>
                Upload Excel dengan pilihan kolom untuk title dan content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="excel-file">Pilih File Excel</Label>
                <Input
                  id="excel-file"
                  type="file"
                  ref={excelFileRef}
                  accept=".xlsx,.xls"
                  disabled={isUploading}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="excel-title">Kolom Title</Label>
                  <Input
                    id="excel-title"
                    value={excelTitleColumn}
                    onChange={(e) => setExcelTitleColumn(e.target.value)}
                    placeholder="Title"
                    disabled={isUploading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="excel-content">Kolom Content</Label>
                  <Input
                    id="excel-content"
                    value={excelContentColumn}
                    onChange={(e) => setExcelContentColumn(e.target.value)}
                    placeholder="Description"
                    disabled={isUploading}
                  />
                </div>
              </div>
              
              <Button 
                onClick={handleCustomExcelUpload}
                disabled={isUploading || !excelTitleColumn || !excelContentColumn}
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                {isUploading ? 'Uploading...' : 'Upload Excel'}
              </Button>

              <Alert>
                <Table className="h-4 w-4" />
                <AlertDescription>
                  Kolom lain akan otomatis masuk ke metadata. Pastikan nama kolom sesuai dengan header Excel Anda.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
                    <div className={`p-2 rounded-full ${
                      file.status === 'success' ? 'bg-green-100 text-green-600' :
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
                        <p className={`text-xs ${
                          file.status === 'error' ? 'text-red-600' : 'text-green-600'
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