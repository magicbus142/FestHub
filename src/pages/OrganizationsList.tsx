import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, LogIn, Calendar, Users, Image, DollarSign, User, LogOut, Loader2 } from 'lucide-react';
import { CreateOrganizationDialog } from '@/components/CreateOrganizationDialog';
import { OrganizationLoginDialog } from '@/components/OrganizationLoginDialog';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';

export default function OrganizationsList() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const { user, isLoading, signOut } = useSupabaseAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: 'Signed out',
      description: 'You have been signed out successfully.',
    });
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* User Auth Status Bar */}
      <div className="border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-end gap-3">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : user ? (
            <>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">{user.email}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-1" />
                Sign out
              </Button>
            </>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => navigate('/auth')}>
              <User className="h-4 w-4 mr-1" />
              Sign in
            </Button>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16 max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-4 bg-gradient-to-r from-primary via-festival-orange to-festival-gold bg-clip-text text-transparent">
              FestHub
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground">
              Your Complete Festival Management Platform
            </p>
          </div>

          <p className="text-lg text-foreground/80 mb-12 leading-relaxed">
            FestHub helps organizations manage their festivals, track donations, monitor expenses, 
            and share beautiful image galleries with their community. Create your organization or 
            access an existing one to get started.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button
              onClick={() => setIsLoginOpen(true)}
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg text-lg px-8 py-6"
            >
              <LogIn className="h-5 w-5 mr-2" />
              Enter Organization
            </Button>
            <Button
              onClick={() => setIsCreateOpen(true)}
              size="lg"
              variant="outline"
              className="border-2 border-primary text-primary hover:bg-primary/10 text-lg px-8 py-6"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Organization
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto mb-12">
          <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg">
            <CardContent className="pt-6 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">Festival Management</h3>
              <p className="text-sm text-muted-foreground">
                Create and manage multiple festivals with dates, descriptions, and custom backgrounds
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg">
            <CardContent className="pt-6 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <DollarSign className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">Donation Tracking</h3>
              <p className="text-sm text-muted-foreground">
                Track donations by category, donor, and festival with detailed analytics
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg">
            <CardContent className="pt-6 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">Expense Management</h3>
              <p className="text-sm text-muted-foreground">
                Monitor festival expenses and keep detailed records of all spending
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg">
            <CardContent className="pt-6 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Image className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">Image Galleries</h3>
              <p className="text-sm text-muted-foreground">
                Upload and share festival photos with beautiful image galleries
              </p>
            </CardContent>
          </Card>
        </div>

        {/* How It Works */}
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-foreground mb-8">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h3 className="font-semibold mb-2 text-foreground">Create or Enter</h3>
              <p className="text-sm text-muted-foreground">
                Create a new organization or enter an existing one with your passcode
              </p>
            </div>
            <div>
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h3 className="font-semibold mb-2 text-foreground">Add Festivals</h3>
              <p className="text-sm text-muted-foreground">
                Create festivals and start tracking donations, expenses, and images
              </p>
            </div>
            <div>
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h3 className="font-semibold mb-2 text-foreground">Share & Manage</h3>
              <p className="text-sm text-muted-foreground">
                Share your festival pages with your community and manage everything in one place
              </p>
            </div>
          </div>
        </div>

        <OrganizationLoginDialog 
          open={isLoginOpen} 
          onOpenChange={setIsLoginOpen}
        />
        <CreateOrganizationDialog 
          open={isCreateOpen} 
          onOpenChange={setIsCreateOpen}
        />
      </div>
    </div>
  );
}
