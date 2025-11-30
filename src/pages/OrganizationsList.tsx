import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Building2 } from 'lucide-react';
import { CreateOrganizationDialog } from '@/components/CreateOrganizationDialog';
import type { Organization } from '@/contexts/OrganizationContext';

export default function OrganizationsList() {
  const navigate = useNavigate();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: organizations = [], isLoading } = useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Organization[];
    }
  });

  const handleOrganizationClick = (org: Organization) => {
    navigate(`/org/${org.slug}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Organizations
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Select an organization to manage festivals and donations
          </p>
          
          <Button
            onClick={() => setIsCreateOpen(true)}
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create Organization
          </Button>
        </div>

        {/* Organizations Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading organizations...</p>
          </div>
        ) : organizations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {organizations.map((org) => (
              <Card
                key={org.id}
                className="cursor-pointer hover:shadow-xl transition-all duration-200 hover:scale-105 border-2 hover:border-primary/50"
                onClick={() => handleOrganizationClick(org)}
              >
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    {org.logo_url ? (
                      <img src={org.logo_url} alt={org.name} className="w-12 h-12 rounded-lg object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-primary" />
                      </div>
                    )}
                    <CardTitle className="text-xl">{org.name}</CardTitle>
                  </div>
                  {org.description && (
                    <CardDescription className="line-clamp-2">
                      {org.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    <span className="font-mono bg-muted px-2 py-1 rounded">
                      /{org.slug}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">
              No organizations yet. Create your first one!
            </p>
          </div>
        )}

        <CreateOrganizationDialog 
          open={isCreateOpen} 
          onOpenChange={setIsCreateOpen}
        />
      </div>
    </div>
  );
}
