import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { KnowledgeList } from '@/components/KnowledgeList';
import { AddKnowledge } from '@/components/AddKnowledge';
import Chat from './Chat';
import FileUpload from './FileUpload';
import { useAuth } from '../contexts/AuthContext';
import { LogOut } from 'lucide-react';

function Dashboard() {
  const [refreshKey, setRefreshKey] = useState(0);
  const { user, logout } = useAuth();

  const handleKnowledgeAdded = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground mb-2">
              Knowledge Management System
            </h1>
            <p className="text-lg text-muted-foreground">
              Manage and organize your team's knowledge base
            </p>
            {user && (
              <p className="text-sm text-muted-foreground mt-1">
                Selamat datang, <span className="font-medium">{user.username}</span>
              </p>
            )}
          </div>
          <Button
            variant="outline"
            onClick={logout}
            className="flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Keluar
          </Button>
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

export default Dashboard;
