import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { KnowledgeList } from '@/components/KnowledgeList';
import { AddKnowledge } from '@/components/AddKnowledge';
import Chat from './components/Chat';
import FileUpload from './components/FileUpload';
import './App.css';

function App() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleKnowledgeAdded = () => {
    // Trigger refresh of knowledge list by changing key
    setRefreshKey(prev => prev + 1);
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-foreground mb-2">
            Knowledge Management System
          </h1>
          <p className="text-lg text-muted-foreground">
            Manage and organize your team's knowledge base
          </p>
        </div>

        <Tabs defaultValue="view" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="view" className="text-sm font-medium">
              View Knowledge
            </TabsTrigger>
            <TabsTrigger value="chat" className="text-sm font-medium">
              Chat
            </TabsTrigger>
            <TabsTrigger value="upload" className="text-sm font-medium">
              Upload File
            </TabsTrigger>
            <TabsTrigger value="add" className="text-sm font-medium">
              Add Knowledge
            </TabsTrigger>
          </TabsList>

          <TabsContent value="view" className="space-y-4">
            <KnowledgeList key={refreshKey} onRefresh={handleRefresh} />
          </TabsContent>

          <TabsContent value="add" className="space-y-4">
            <AddKnowledge onKnowledgeAdded={handleKnowledgeAdded} />
          </TabsContent>

          <TabsContent value="chat" className="space-y-4">
            <Chat />
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            <FileUpload onUploadSuccess={handleKnowledgeAdded} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
