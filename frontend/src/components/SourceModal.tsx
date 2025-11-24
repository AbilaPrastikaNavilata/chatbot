import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { type ChatSource, type KnowledgeStats } from '@/types/knowledge';
import { X, Eye, FileText, Hash, Ruler } from 'lucide-react';

interface SourceModalProps {
  source: ChatSource | null;
  isOpen: boolean;
  onClose: () => void;
}

export function SourceModal({ source, isOpen, onClose }: SourceModalProps) {
  const calculateStats = (content: string): KnowledgeStats => {
    const wordCount = content.trim().split(/\s+/).filter(word => word.length > 0).length;
    const charCount = content.length;
    const sizeInBytes = new Blob([content]).size;
    
    let size: string;
    if (sizeInBytes < 1024) {
      size = `${sizeInBytes} B`;
    } else if (sizeInBytes < 1024 * 1024) {
      size = `${(sizeInBytes / 1024).toFixed(1)} KB`;
    } else {
      size = `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    return { wordCount, charCount, size };
  };

  if (!isOpen || !source) return null;

  const stats = calculateStats(source.content);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
          <h2 className="text-2xl font-semibold">Detail Sumber</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <Tabs defaultValue="view" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="view">
                <Eye className="h-4 w-4 mr-2" />
                Lihat
              </TabsTrigger>
              <TabsTrigger value="stats">
                <FileText className="h-4 w-4 mr-2" />
                Statistik
              </TabsTrigger>
              <TabsTrigger value="metadata">
                <Hash className="h-4 w-4 mr-2" />
                Metadata
              </TabsTrigger>
            </TabsList>

            <TabsContent value="view" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{source.title}</CardTitle>
                  <CardDescription>
                    Sumber: {source.source}
                    {source.similarity_score && (
                      <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {(source.similarity_score * 100).toFixed(1)}% cocok
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="max-h-[50vh] overflow-y-auto">
                  <div className="whitespace-pre-wrap text-sm">
                    {source.content}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="stats" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Jumlah Kata</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.wordCount}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Jumlah Karakter</CardTitle>
                    <Hash className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.charCount}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ukuran</CardTitle>
                    <Ruler className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.size}</div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Pratinjau Konten</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground line-clamp-6">
                    {source.content}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="metadata" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informasi Sumber</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">ID:</span>
                      <div className="text-muted-foreground font-mono text-xs break-all">
                        {source._id || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium">Sumber:</span>
                      <div className="text-muted-foreground">
                        {source.source || 'Tidak ada sumber yang ditentukan'}
                      </div>
                    </div>
                    {source.similarity_score && (
                      <div>
                        <span className="font-medium">Skor Kemiripan:</span>
                        <div className="text-muted-foreground">
                          {(source.similarity_score * 100).toFixed(2)}%
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}