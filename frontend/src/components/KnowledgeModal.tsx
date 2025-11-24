import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { type Knowledge, type UpdateKnowledgeRequest, type KnowledgeStats } from '@/types/knowledge';
import { X, Edit, Trash2, Eye, FileText, Hash, Ruler } from 'lucide-react';

interface KnowledgeModalProps {
  knowledge: Knowledge | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, updateData: UpdateKnowledgeRequest) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function KnowledgeModal({ knowledge, isOpen, onClose, onUpdate, onDelete }: KnowledgeModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [formData, setFormData] = useState<UpdateKnowledgeRequest>({});
  const [metadataInput, setMetadataInput] = useState('');

  useEffect(() => {
    if (knowledge) {
      setFormData({
        title: knowledge.title,
        content: knowledge.content,
        source: knowledge.source || '',
        metadata: knowledge.metadata || {}
      });
      
      // Convert metadata object to string for editing
      const metadataStr = Object.entries(knowledge.metadata || {})
        .map(([key, value]) => `${key}:${value}`)
        .join(',');
      setMetadataInput(metadataStr);
    }
  }, [knowledge]);

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

  const handleSave = async () => {
    if (!knowledge?._id) return;

    setLoading(true);
    try {
      // Parse metadata
      const metadata: { [key: string]: string } = {};
      if (metadataInput.trim()) {
        const pairs = metadataInput.split(',');
        pairs.forEach(pair => {
          const [key, value] = pair.split(':').map(s => s.trim());
          if (key && value) {
            metadata[key] = value;
          }
        });
      }

      const updateData: UpdateKnowledgeRequest = {
        title: formData.title,
        content: formData.content,
        source: formData.source || undefined,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined
      };

      await onUpdate(knowledge._id, updateData);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating knowledge:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!knowledge?._id) return;
    
    setLoading(true);
    try {
      await onDelete(knowledge._id);
      setShowDeleteDialog(false);
      onClose();
    } catch (error) {
      console.error('Error deleting knowledge:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !knowledge) return null;

  const stats = calculateStats(knowledge.content);

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-background rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
            <h2 className="text-2xl font-semibold">Detail Pengetahuan</h2>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
                disabled={loading}
              >
                <Edit className="h-4 w-4 mr-2" />
                {isEditing ? 'Batal' : 'Edit'}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteClick}
                disabled={loading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Hapus
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
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
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-title">Judul</Label>
                      <Input
                        id="edit-title"
                        value={formData.title || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-source">Sumber</Label>
                      <Input
                        id="edit-source"
                        value={formData.source || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-content">Konten</Label>
                      <Textarea
                        id="edit-content"
                        value={formData.content || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                        rows={15}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-metadata">Metadata (format: key1:value1,key2:value2)</Label>
                      <Input
                        id="edit-metadata"
                        value={metadataInput}
                        onChange={(e) => setMetadataInput(e.target.value)}
                        placeholder="kategori:tutorial,tingkat:pemula"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={handleSave} disabled={loading}>
                        {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                      </Button>
                      <Button variant="outline" onClick={() => setIsEditing(false)}>
                        Batal
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>{knowledge.title}</CardTitle>
                        <CardDescription>
                          Sumber: {knowledge.source}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="max-h-[50vh] overflow-y-auto">
                        <div className="whitespace-pre-wrap text-sm">
                          {knowledge.content}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
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
                      {knowledge.content}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="metadata" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Informasi Pengetahuan</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">ID:</span>
                        <div className="text-muted-foreground font-mono text-xs break-all">
                          {knowledge._id || 'N/A'}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium">Sumber:</span>
                        <div className="text-muted-foreground">
                          {knowledge.source || 'Tidak ada sumber yang ditentukan'}
                        </div>
                      </div>
                    </div>
                    
                    {knowledge.metadata && Object.keys(knowledge.metadata).length > 0 && (
                      <div>
                        <span className="font-medium">Metadata Tambahan:</span>
                        <div className="mt-2 space-y-2">
                          {Object.entries(knowledge.metadata).map(([key, value]) => (
                            <div key={key} className="flex justify-between items-center py-2 border-b">
                              <span className="font-medium capitalize">{key}:</span>
                              <span className="text-muted-foreground">{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Pengetahuan</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus "{knowledge?.title}"? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={loading}>
              {loading ? 'Menghapus...' : 'Hapus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}