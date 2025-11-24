import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { type CreateKnowledgeRequest, type AddKnowledgeResponse } from '@/types/knowledge';

interface AddKnowledgeProps {
  onKnowledgeAdded?: () => void;
}

export function AddKnowledge({ onKnowledgeAdded }: AddKnowledgeProps) {
  const [formData, setFormData] = useState<CreateKnowledgeRequest>({
    title: '',
    content: '',
    source: '',
    metadata: {}
  });
  const [metadataInput, setMetadataInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      setMessage({ type: 'error', text: 'Title and content are required' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // Parse metadata dari input string (format: key1:value1,key2:value2)
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

      const payload: CreateKnowledgeRequest = {
        title: formData.title,
        content: formData.content,
        source: formData.source?.trim() || undefined,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined
      };

      const response = await fetch(`${import.meta.env.VITE_BACKEND_BASE_URL}/add-knowledge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: AddKnowledgeResponse = await response.json();

      if (result.id && result.message) {
        setMessage({ type: 'success', text: result.message });
        setFormData({ title: '', content: '', source: '', metadata: {} });
        setMetadataInput('');
        onKnowledgeAdded?.();
      } else {
        setMessage({ type: 'error', text: 'Failed to add knowledge' });
      }
    } catch (err) {
      setMessage({ 
        type: 'error', 
        text: err instanceof Error ? err.message : 'Failed to add knowledge' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateKnowledgeRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Add New Knowledge</CardTitle>
          <CardDescription>
            Create a new knowledge entry to share information with your team.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                type="text"
                placeholder="Enter knowledge title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="source">Source</Label>
              <Input
                id="source"
                type="text"
                placeholder="e.g., React Documentation, MDN Web Docs"
                value={formData.source}
                onChange={(e) => handleInputChange('source', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content *</Label>
              <Textarea
                id="content"
                placeholder="Enter the knowledge content..."
                value={formData.content}
                onChange={(e) => handleInputChange('content', e.target.value)}
                rows={8}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="metadata">Metadata</Label>
              <Input
                id="metadata"
                type="text"
                placeholder="Enter metadata as key:value pairs (e.g., category:tutorial,difficulty:beginner)"
                value={metadataInput}
                onChange={(e) => setMetadataInput(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Format: key1:value1,key2:value2
              </p>
            </div>

            {message && (
              <div className={`p-3 rounded-md text-sm ${
                message.type === 'success' 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {message.text}
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Adding Knowledge...' : 'Add Knowledge'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}