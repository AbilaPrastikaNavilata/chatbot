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
        <div className="mb-6 md:mb-8 flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-1 md:mb-2">
              Knowledge Management System
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground">
              Manage and organize your team's knowledge base
            </p>
            {user && (
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Selamat datang, <span className="font-medium">{user.username}</span>
              </p>
            )}
          </div>
          <Button
            variant="outline"
            onClick={logout}
            className="flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            <LogOut className="w-4 h-4" />
            Keluar
          </Button>
        </div>

        <Tabs defaultValue="view" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-6 md:mb-8 h-auto gap-1">
            <TabsTrigger value="view" className="text-xs sm:text-sm font-medium py-2">
              View
            </TabsTrigger>
            <TabsTrigger value="chat" className="text-xs sm:text-sm font-medium py-2">
              Chat
            </TabsTrigger>
            <TabsTrigger value="upload" className="text-xs sm:text-sm font-medium py-2">
              Upload
            </TabsTrigger>
            <TabsTrigger value="add" className="text-xs sm:text-sm font-medium py-2">
              Add
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
