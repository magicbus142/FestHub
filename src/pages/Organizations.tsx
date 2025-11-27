import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Plus, ChevronRight, Loader2, UserPlus } from 'lucide-react';
import { CreateOrganizationDialog } from '@/components/CreateOrganizationDialog';
import { InviteMemberDialog } from '@/components/InviteMemberDialog';

export default function Organizations() {
  const { currentOrganization, userOrganizations, setCurrentOrganization, loading, refetchOrganizations } = useOrganization();
  const { user } = useSupabaseAuth();
  const navigate = useNavigate();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const handleSelectOrganization = (org: any) => {
    setCurrentOrganization(org.organization);
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div className="container max-w-4xl mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Your Organizations</h1>
          <p className="text-muted-foreground">
            Select an organization to continue, or create a new one.
          </p>
        </div>

        {userOrganizations.length > 0 ? (
          <div className="grid gap-4 mb-6">
            {userOrganizations.map((userRole) => (
              <Card
                key={userRole.organization.id}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => handleSelectOrganization(userRole)}
              >
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      {userRole.organization.logo_url ? (
                        <img
                          src={userRole.organization.logo_url}
                          alt={userRole.organization.name}
                          className="w-10 h-10 rounded-md object-cover"
                        />
                      ) : (
                        <Building2 className="w-6 h-6 text-primary" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-xl">
                        {userRole.organization.name}
                      </CardTitle>
                      <CardDescription className="capitalize">
                        {userRole.role}
                      </CardDescription>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </CardHeader>
                {userRole.organization.description && (
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground">
                      {userRole.organization.description}
                    </p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>No organizations yet</CardTitle>
              <CardDescription>
                Create your first organization to get started
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        <div className="flex gap-3">
          {currentOrganization && (
            <Button
              onClick={() => setIsInviteOpen(true)}
              variant="outline"
              className="flex-1"
              size="lg"
            >
              <UserPlus className="mr-2 h-5 w-5" />
              Invite Member
            </Button>
          )}
          <Button
            onClick={() => setIsCreateOpen(true)}
            className={currentOrganization ? "flex-1" : "w-full"}
            size="lg"
          >
            <Plus className="mr-2 h-5 w-5" />
            Create New Organization
          </Button>
        </div>

        <CreateOrganizationDialog
          open={isCreateOpen}
          onOpenChange={(open) => {
            setIsCreateOpen(open);
            if (!open) refetchOrganizations();
          }}
        />
        
        <InviteMemberDialog
          isOpen={isInviteOpen}
          onClose={() => setIsInviteOpen(false)}
        />
      </div>
    </div>
  );
}
