/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { type Knowledge, type UpdateKnowledgeRequest, type PaginatedKnowledgeResponse } from '@/types/knowledge';
import { KnowledgeModal } from '@/components/KnowledgeModal';
import { 
  Eye, 
  Trash2, 
  FileText, 
  Hash, 
  ArrowUpDown, 
  Trash, 
  CheckSquare, 
  Square, 
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface KnowledgeListProps {
  onRefresh?: () => void;
}

type SortOrder = 'newest' | 'oldest';

interface DeleteDialogState {
  isOpen: boolean;
  type: 'single' | 'bulk' | 'all';
  item?: Knowledge;
  selectedIds?: string[];
}

export function KnowledgeList({ onRefresh }: KnowledgeListProps) {
  const [knowledge, setKnowledge] = useState<Knowledge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedKnowledge, setSelectedKnowledge] = useState<Knowledge | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>({
    isOpen: false,
    type: 'single'
  });
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const itemsPerPage = 15;

  useEffect(() => {
    fetchKnowledge();
  }, [currentPage, sortOrder]);

  const fetchKnowledge = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        sort_order: sortOrder
      });
      
      const response = await fetch(`${import.meta.env.VITE_BACKEND_BASE_URL}/knowledge?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: PaginatedKnowledgeResponse = await response.json();
      
      setKnowledge(data.items || []);
      setTotalPages(data.total_pages);
      setTotalItems(data.total);
      setHasNext(data.has_next);
      setHasPrev(data.has_prev);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch knowledge');
      setKnowledge([]);
      console.error('Fetch knowledge error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSortChange = (newSortOrder: SortOrder) => {
    setSortOrder(newSortOrder);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      setSelectedIds(new Set());
    }
  };

  const handleView = (item: Knowledge) => {
    if (isSelectionMode) return;
    setSelectedKnowledge(item);
    setIsModalOpen(true);
  };

  const handleUpdate = async (id: string, updateData: UpdateKnowledgeRequest) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_BASE_URL}/knowledge/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await fetchKnowledge();
      
      if (selectedKnowledge && selectedKnowledge._id === id) {
        const updatedItem = knowledge.find(item => item._id === id);
        if (updatedItem) {
          setSelectedKnowledge({ ...updatedItem, ...updateData });
        }
      }

      onRefresh?.();
    } catch (err) {
      console.error('Error updating knowledge:', err);
      throw err;
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_BASE_URL}/knowledge/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await fetchKnowledge();
      onRefresh?.();
    } catch (err) {
      console.error('Error deleting knowledge:', err);
      throw err;
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    try {
      await Promise.all(ids.map(id => handleDelete(id)));
      setSelectedIds(new Set());
      setIsSelectionMode(false);
    } catch (err) {
      console.error('Error bulk deleting knowledge:', err);
      throw err;
    }
  };

  const handleDeleteAll = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_BASE_URL}/knowledge`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Refresh the knowledge list after deletion
      await fetchKnowledge();
      onRefresh?.();
      
      // Reset selection states
      setSelectedIds(new Set());
      setIsSelectionMode(false);
    } catch (err) {
      console.error('Error deleting all knowledge:', err);
      throw err;
    }
  };

  const openDeleteDialog = (type: DeleteDialogState['type'], item?: Knowledge, selectedIds?: string[]) => {
    setDeleteDialog({
      isOpen: true,
      type,
      item,
      selectedIds
    });
  };

  const closeDeleteDialog = () => {
    setDeleteDialog({
      isOpen: false,
      type: 'single'
    });
  };

  const confirmDelete = async () => {
    try {
      switch (deleteDialog.type) {
        case 'single':
          if (deleteDialog.item) {
            await handleDelete(deleteDialog.item._id);
          }
          break;
        case 'bulk':
          if (deleteDialog.selectedIds) {
            await handleBulkDelete(deleteDialog.selectedIds);
          }
          break;
        case 'all':
          await handleDeleteAll();
          break;
      }
      closeDeleteDialog();
    } catch (err) {
      console.error('Error confirming delete:', err);
    }
  };

  const handleQuickDelete = (item: Knowledge, e: React.MouseEvent) => {
    e.stopPropagation();
    openDeleteDialog('single', item);
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const getWordCount = (content: string): number => {
    return content.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const getContentSize = (content: string): string => {
    const sizeInBytes = new Blob([content]).size;
    if (sizeInBytes < 1024) {
      return `${sizeInBytes} B`;
    } else if (sizeInBytes < 1024 * 1024) {
      return `${(sizeInBytes / 1024).toFixed(1)} KB`;
    } else {
      return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
    }
  };

  const getDeleteDialogContent = () => {
    switch (deleteDialog.type) {
      case 'single':
        return {
          title: 'Hapus Knowledge',
          description: `Apakah Anda yakin ingin menghapus "${deleteDialog.item?.title}"? Tindakan ini tidak dapat dibatalkan.`
        };
      case 'bulk':
        return {
          title: 'Hapus Knowledge Terpilih',
          description: `Apakah Anda yakin ingin menghapus ${deleteDialog.selectedIds?.length} knowledge yang dipilih? Tindakan ini tidak dapat dibatalkan.`
        };
      case 'all':
        return {
          title: 'Hapus Semua Knowledge',
          description: `Apakah Anda yakin ingin menghapus SEMUA knowledge (${totalItems} item)? Tindakan ini tidak dapat dibatalkan dan akan menghapus seluruh data knowledge.`
        };
      default:
        return { title: '', description: '' };
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <div className="flex space-x-2">
          <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
        <div className="text-muted-foreground animate-pulse">Loading knowledge...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-destructive">Error: {error}</div>
      </div>
    );
  }

  if (knowledge.length === 0 && !loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">No knowledge found. Add some knowledge to get started!</div>
      </div>
    );
  }

  const dialogContent = getDeleteDialogContent();

  return (
    <>
      <div className="space-y-4">
        {/* Header dengan kontrol */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">Knowledge Base</h2>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              {totalItems} item{totalItems !== 1 ? 's' : ''}
              {isSelectionMode && selectedIds.size > 0 && (
                <span className="ml-2 text-primary">
                  ({selectedIds.size} dipilih)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4" />
              <Select value={sortOrder} onValueChange={handleSortChange}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Terbaru</SelectItem>
                  <SelectItem value="oldest">Terlama</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="text-sm text-gray-500">
              Menampilkan {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalItems)} dari {totalItems} item
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isSelectionMode ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSelectionMode(true)}
                  className="flex items-center gap-2"
                >
                  <CheckSquare className="w-4 h-4" />
                  Pilih Multiple
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => openDeleteDialog('all')}
                  className="flex items-center gap-2"
                >
                  <Trash className="w-4 h-4" />
                  Hapus Semua
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const allIds = new Set(knowledge.map(item => item._id));
                    setSelectedIds(selectedIds.size === knowledge.length ? new Set() : allIds);
                  }}
                  className="flex items-center gap-2"
                >
                  {selectedIds.size === knowledge.length ? (
                    <Square className="w-4 h-4" />
                  ) : (
                    <CheckSquare className="w-4 h-4" />
                  )}
                  {selectedIds.size === knowledge.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
                </Button>
                
                {selectedIds.size > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => openDeleteDialog('bulk', undefined, Array.from(selectedIds))}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Hapus Terpilih ({selectedIds.size})
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsSelectionMode(false);
                    setSelectedIds(new Set());
                  }}
                >
                  Batal
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Knowledge Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {knowledge.map((item) => (
            <Card 
              key={item._id} 
              className={`cursor-pointer hover:shadow-md transition-shadow group ${
                selectedIds.has(item._id) ? 'ring-2 ring-blue-500 bg-blue-50' : ''
              }`}
              onClick={() => handleView(item)}
            >
              <CardHeader>
                <CardTitle className="text-lg flex items-start justify-between">
                  <div className="flex items-start gap-2 flex-1">
                    {/* Checkbox untuk selection mode */}
                    {isSelectionMode && (
                      <Checkbox
                        checked={selectedIds.has(item._id)}
                        onCheckedChange={() => toggleSelection(item._id)}
                        className="mt-1"
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                    <span className="line-clamp-2 flex-1">{item.title}</span>
                  </div>
                  
                  {/* Action buttons (hanya muncul saat tidak dalam selection mode) */}
                  {!isSelectionMode && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleView(item);
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleQuickDelete(item, e)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </CardTitle>
                {item.source && (
                  <CardDescription className="text-xs uppercase tracking-wide font-medium">
                    Source: {item.source}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                  {item.content}
                </p>
                
                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                  <div className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {getWordCount(item.content)} words
                  </div>
                  <div className="flex items-center gap-1">
                    <Hash className="h-3 w-3" />
                    {getContentSize(item.content)}
                  </div>
                </div>
                
                {item.metadata && Object.keys(item.metadata).length > 0 && (
                  <div className="space-y-2 mb-3">
                    <div className="text-xs font-medium text-muted-foreground">Metadata:</div>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(item.metadata).slice(0, 3).map(([key, value], index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-secondary text-secondary-foreground"
                        >
                          {key}: {String(value)}
                        </span>
                      ))}
                      {Object.keys(item.metadata).length > 3 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-muted text-muted-foreground">
                          +{Object.keys(item.metadata).length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="text-xs text-muted-foreground">
                  ID: {item._id}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-500">
              Halaman {currentPage} dari {totalPages}
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={!hasPrev}
                className="flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Sebelumnya
              </Button>
              
              {/* Page numbers */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                      className="w-8 h-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!hasNext}
                className="flex items-center gap-1"
              >
                Selanjutnya
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Knowledge Modal */}
      <KnowledgeModal
        knowledge={selectedKnowledge}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedKnowledge(null);
        }}
        onUpdate={handleUpdate}
        onDelete={async (id) => {
          await handleDelete(id);
          setIsModalOpen(false);
          setSelectedKnowledge(null);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.isOpen} onOpenChange={closeDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogContent.title}</DialogTitle>
            <DialogDescription>
              {dialogContent.description}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={closeDeleteDialog}>
              Batal
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

 