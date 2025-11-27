import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { CreateOrganizationDialog } from '@/components/CreateOrganizationDialog';

export default function AdminHome() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div className="container max-w-4xl mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Organization Management</h1>
          <p className="text-muted-foreground">
            Create and manage organizations for your clients
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create New Organization</CardTitle>
            <CardDescription>
              Set up a new organization with its own unique link and passcode
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setIsCreateOpen(true)} size="lg" className="w-full">
              <Plus className="mr-2 h-5 w-5" />
              Create Organization
            </Button>
          </CardContent>
        </Card>

        <CreateOrganizationDialog
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
        />
      </div>
    </div>
  );
}
