import { Link, Navigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Database, Download, Settings, ArrowLeft, BarChart3 } from "lucide-react";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { DataProcessControl } from "@/components/admin/DataProcessControl";
import FileQueueManager from "@/components/FileQueueManager";
import { SystemHealth } from "@/components/admin/SystemHealth";
import { SyncProgress } from "@/components/admin/SyncProgress";
import RiksdagenDataFetchConfig from "@/components/admin/RiksdagenDataFetchConfig";
import { DatabaseStats } from "@/components/admin/DatabaseStats";
import { AdminSetup } from "@/components/admin/AdminSetup";
import StorageBrowser from "@/components/admin/StorageBrowser";
import ActivityStream from "@/components/admin/ActivityStream";
import AdminNotifications from "@/components/admin/AdminNotifications";
import StorageQuota from "@/components/admin/StorageQuota";
import DataFetchTimeline from "@/components/admin/DataFetchTimeline";
import FileIntegrityCheck from "@/components/admin/FileIntegrityCheck";
import BatchOperations from "@/components/admin/BatchOperations";
import RiksdagenApiInfo from "@/components/admin/RiksdagenApiInfo";
import { Skeleton } from "@/components/ui/skeleton";

const Admin = () => {
  const { isAdmin, isLoading } = useIsAdmin();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <Link to="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Tillbaka
            </Button>
          </Link>

          <div className="flex items-center gap-4 mb-4">
            <Shield className="h-10 w-10 text-primary" />
            <div>
              <h1 className="text-4xl font-bold">Admin Panel</h1>
              <p className="text-muted-foreground">
                Hantera datahämtning och systemprocesser
              </p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">
              <BarChart3 className="h-4 w-4 mr-2" />
              Översikt
            </TabsTrigger>
            <TabsTrigger value="riksdagen">
              <Database className="h-4 w-4 mr-2" />
              Riksdagen
            </TabsTrigger>
            <TabsTrigger value="regeringskansliet">
              <Database className="h-4 w-4 mr-2" />
              Regeringskansliet
            </TabsTrigger>
            <TabsTrigger value="files">
              <Download className="h-4 w-4 mr-2" />
              Filer & Storage
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-2" />
              Inställningar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SystemHealth />
              <StorageQuota />
            </div>
            <AdminNotifications />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ActivityStream />
              <div className="space-y-6">
                <FileIntegrityCheck />
                <BatchOperations />
              </div>
            </div>
            <DataFetchTimeline />
            <DatabaseStats />
          </TabsContent>

          <TabsContent value="riksdagen" className="space-y-4">
            <RiksdagenApiInfo />
            <RiksdagenDataFetchConfig />
            <SyncProgress source="riksdagen" />
            <Card>
              <CardHeader>
                <CardTitle>Riksdagens datakällor</CardTitle>
                <CardDescription>
                  Styr och övervaka datahämtning från Riksdagens API
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DataProcessControl source="riksdagen" />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="regeringskansliet" className="space-y-4">
            <SyncProgress source="regeringskansliet" />
            <Card>
              <CardHeader>
                <CardTitle>Regeringskansliets datakällor</CardTitle>
                <CardDescription>
                  Styr och övervaka datahämtning från g0v.se API
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DataProcessControl source="regeringskansliet" />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="files" className="space-y-6">
            <FileQueueManager />
            <StorageBrowser />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <AdminSetup />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;