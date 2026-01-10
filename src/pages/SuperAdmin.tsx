import { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, 
  PartyPopper, 
  Image as ImageIcon, 
  IndianRupee, 
  TrendingUp, 
  Search, 
  ChevronRight, 
  Calendar,
  CreditCard,
  LayoutDashboard,
  ArrowLeft,
  Activity,
  History,
  Lock,
  Unlock,
  LogOut,
  ShieldCheck,
  MoreVertical,
  Check,
  XCircle,
  Download,
  FileSpreadsheet,
  Settings2,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';

interface OrganizationStats {
  id: string;
  name: string;
  email: string | null;
  slug: string;
  plan: string;
  created_at: string;
  updated_at: string;
  festivals_count: number;
  images_count: number;
  donations_count: number;
  donations_total: number;
  expenses_total: number;
  storage_usage: number;
  is_suspended: boolean;
  subscription_status: string;
}

const DEFAULT_PASSCODE = 'admin999';

export default function SuperAdmin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [passcode, setPasscode] = useState('');
  const [masterPasscode, setMasterPasscode] = useState(() => {
    return localStorage.getItem('super_admin_passcode') || DEFAULT_PASSCODE;
  });
  const [isAuthorized, setIsAuthorized] = useState(() => {
    return localStorage.getItem('super_admin_authorized') === 'true';
  });
  const [loginError, setLoginError] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState(0);
  const [securityLogs, setSecurityLogs] = useState<{event: string, time: string, status: 'success' | 'error' | 'info'}[]>(() => {
    return JSON.parse(localStorage.getItem('super_admin_logs') || '[]');
  });

  const logSecurityEvent = (event: string, status: 'success' | 'error' | 'info') => {
    const newLog = { event, status, time: new Date().toISOString() };
    const updatedLogs = [newLog, ...securityLogs].slice(0, 10);
    setSecurityLogs(updatedLogs);
    localStorage.setItem('super_admin_logs', JSON.stringify(updatedLogs));
  };

  // Auto-lock on inactivity
  useEffect(() => {
    if (!isAuthorized) return;

    let timer: any;
    const resetTimer = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        handleLogout();
        alert('Session expired due to inactivity.');
      }, 10 * 60 * 1000); // 10 minutes
    };

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    resetTimer();

    return () => {
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      if (timer) clearTimeout(timer);
    };
  }, [isAuthorized]);

  // Lockout countdown
  useEffect(() => {
    if (lockoutTime <= 0) return;
    const timer = setInterval(() => {
      setLockoutTime(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutTime]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutTime > 0) return;

    if (passcode === masterPasscode) {
      setIsAuthorized(true);
      localStorage.setItem('super_admin_authorized', 'true');
      setLoginError(false);
      setFailedAttempts(0);
      logSecurityEvent('Successful platform unlock', 'success');
    } else {
      setLoginError(true);
      logSecurityEvent(`Failed unlock attempt (${failedAttempts + 1}/5)`, 'error');
      setFailedAttempts(prev => {
        const next = prev + 1;
        if (next >= 5) {
          setLockoutTime(30); // 30 seconds lockout
          return 0;
        }
        return next;
      });
      setPasscode('');
    }
  };

  const handleLogout = () => {
    setIsAuthorized(false);
    localStorage.removeItem('super_admin_authorized');
  };

  const [newPasscode, setNewPasscode] = useState('');
  const [showChangePasscode, setShowChangePasscode] = useState(false);

  const handleChangePasscode = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPasscode.length < 4) {
      alert('Passcode must be at least 4 characters');
      return;
    }
    setMasterPasscode(newPasscode);
    localStorage.setItem('super_admin_passcode', newPasscode);
    setShowChangePasscode(false);
    setNewPasscode('');
    logSecurityEvent('Master passcode updated', 'info');
    alert('Master passcode updated successfully!');
  };

  const handleToggleSuspension = async (orgId: string, isCurrentlySuspended: boolean) => {
    const { error } = await supabase
      .from('organizations')
      .update({ subscription_status: isCurrentlySuspended ? 'active' : 'suspended' })
      .eq('id', orgId);

    if (error) {
      alert('Error updating status: ' + error.message);
      return;
    }

    logSecurityEvent(`Organization ${orgId} ${!currentStatus ? 'suspended' : 'activated'}`, 'info');
    await queryClient.invalidateQueries({ queryKey: ['super-admin-stats'] });
  };

  const handleChangePlan = async (orgId: string, newPlan: string) => {
    const { error } = await supabase
      .from('organizations')
      .update({ plan: newPlan })
      .eq('id', orgId);

    if (error) {
      alert('Error updating plan: ' + error.message);
      return;
    }

    logSecurityEvent(`Organization ${orgId} plan changed to ${newPlan}`, 'info');
    await queryClient.invalidateQueries({ queryKey: ['super-admin-stats'] });
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Signup Date', 'Plan', 'Festivals', 'Donations', 'Images', 'Storage (Bytes)', 'Status'];
    const rows = filteredStats.map(org => [
      org.name,
      org.email || 'N/A',
      format(new Date(org.created_at), 'yyyy-MM-dd'),
      org.plan,
      org.festivals_count,
      org.donations_total,
      org.images_count,
      org.storage_usage,
      org.is_suspended ? 'Suspended' : 'Active'
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `platform_stats_${format(new Date(), 'yyyyMMdd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    logSecurityEvent('Platform stats exported to CSV', 'info');
  };

  const { data: stats = [], isLoading } = useQuery({
    queryKey: ['super-admin-stats'],
    queryFn: async () => {
      // 1. Fetch all organizations
      const { data: orgs, error: orgsError } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });

      if (orgsError) throw orgsError;

      // 2. Fetch all images with their paths and org IDs
      const { data: allImages, error: imagesError } = await supabase
        .from('images')
        .select('organization_id, image_path');
      
      if (imagesError) throw imagesError;

      // 3. Fetch all file metadata from storage
      // Note: We're fetching from 'public' folder inside 'user-images' bucket
      const { data: files, error: storageError } = await supabase.storage
        .from('user-images')
        .list('public', { limit: 1000 });

      if (storageError) throw storageError;

      // 4. Create a map of file path to size
      const sizeMap = new Map<string, number>();
      (files || []).forEach(file => {
        // Files returned by list() don't have 'public/' prefix in name if we listed 'public'
        sizeMap.set(`public/${file.name}`, file.metadata?.size || 0);
      });

      // 5. Fetch counts and totals in parallel for each organization
      const statsList = await Promise.all((orgs || []).map(async (org) => {
        const [
          { count: festivalsCount },
          { data: donationsData },
          { data: expensesData }
        ] = await Promise.all([
          supabase.from('festivals').select('*', { count: 'exact', head: true }).eq('organization_id', org.id),
          supabase.from('donations').select('amount').eq('organization_id', org.id),
          supabase.from('expenses').select('amount').eq('organization_id', org.id)
        ]);

        const orgImages = (allImages || []).filter(img => img.organization_id === org.id);
        const imagesCount = orgImages.length;
        const storageUsage = orgImages.reduce((sum, img) => sum + (sizeMap.get(img.image_path) || 0), 0);

        const donationsTotal = (donationsData || []).reduce((sum, d) => sum + (d.amount || 0), 0);
        const expensesTotal = (expensesData || []).reduce((sum, e) => sum + (e.amount || 0), 0);

        return {
          ...org,
          festivals_count: festivalsCount || 0,
          images_count: imagesCount,
          storage_usage: storageUsage, // New field
          donations_count: (donationsData || []).length,
          donations_total: donationsTotal,
          expenses_total: expensesTotal,
          is_suspended: org.is_suspended || false,
          subscription_status: org.subscription_status || 'active'
        } as OrganizationStats & { storage_usage: number };
      }));

      return statsList;
    }
  });

  const filteredStats = useMemo(() => {
    return stats.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (s.email?.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [stats, searchTerm]);

  const platformOverview = useMemo(() => {
    if (!stats.length) return null;
    return {
      totalOrgs: stats.length,
      totalFestivals: stats.reduce((sum, s) => sum + s.festivals_count, 0),
      totalDonations: stats.reduce((sum, s) => sum + s.donations_total, 0),
      totalImages: stats.reduce((sum, s) => sum + s.images_count, 0),
      totalStorage: stats.reduce((sum, s) => sum + s.storage_usage, 0),
    };
  }, [stats]);

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFCF5] dark:bg-[#0A0A0A] p-4">
        <Card className="w-full max-w-md border-none shadow-2xl shadow-primary/10 rounded-[2.5rem] overflow-hidden bg-white/80 backdrop-blur-xl dark:bg-black/60">
          <CardHeader className="pt-12 pb-8 text-center space-y-4">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2 animate-bounce-slow">
              <Lock className="h-10 w-10 text-primary" />
            </div>
            <div>
              <CardTitle className="text-3xl font-black tracking-tight text-foreground">Master Access</CardTitle>
              <CardDescription className="text-muted-foreground font-medium pt-2">
                Restricted area. Please enter the master passcode to access platform analytics.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="px-8 pb-12">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <div className="relative group">
                  <Input
                    type="password"
                    placeholder="Enter Master Passcode"
                    value={passcode}
                    onChange={(e) => {
                      setPasscode(e.target.value);
                      setLoginError(false);
                    }}
                    className={cn(
                      "h-14 px-6 rounded-2xl text-center text-xl font-bold tracking-[0.5em] transition-all border-2 border-primary/10 focus:border-primary focus:ring-4 focus:ring-primary/10",
                      loginError && "border-destructive focus:border-destructive focus:ring-destructive/10 animate-shake"
                    )}
                    autoFocus
                  />
                  {loginError && !lockoutTime && (
                    <p className="text-center text-sm font-bold text-destructive mt-2 flex items-center justify-center gap-1">
                      <ShieldCheck className="h-4 w-4" /> Invalid Master Passcode ({5 - failedAttempts} attempts left)
                    </p>
                  )}
                  {lockoutTime > 0 && (
                    <p className="text-center text-sm font-bold text-destructive mt-2 flex items-center justify-center gap-1">
                      <Lock className="h-4 w-4" /> Too many attempts. Try again in {lockoutTime}s
                    </p>
                  )}
                </div>
              </div>
              <Button 
                type="submit" 
                size="lg"
                disabled={lockoutTime > 0}
                className="w-full h-14 rounded-2xl font-black text-lg bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:grayscale"
              >
                {lockoutTime > 0 ? 'Dashboard Locked' : 'Unlock Dashboard'}
                <Unlock className="ml-2 h-5 w-5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate('/')}
                className="w-full h-12 rounded-xl text-muted-foreground font-bold"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Activity className="h-10 w-10 animate-pulse text-primary mx-auto" />
          <p className="text-muted-foreground font-medium">Loading platform analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCF5] dark:bg-[#0A0A0A]">
      {/* Header */}
      <div className="border-b bg-white/50 backdrop-blur-md sticky top-0 z-10 dark:bg-black/50">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate('/')}
                className="rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                <LayoutDashboard className="h-6 w-6 text-primary" />
                Super Admin
              </h1>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Platform Overview & Analytics</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={exportToCSV}
              className="rounded-full border-primary/20 hover:bg-primary/5 text-primary font-bold decoration-none"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <ThemeSwitcher />
            <Dialog open={showChangePasscode} onOpenChange={setShowChangePasscode}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-full border-primary/20 hover:bg-primary/5 text-primary font-bold"
                >
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Security
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-[2.5rem] border-none shadow-2xl sm:max-w-[425px]">
                <DialogHeader className="pt-6">
                  <DialogTitle className="text-2xl font-black">Change Master Passcode</DialogTitle>
                  <DialogDescription className="font-medium pt-2">
                    Update the security key used to access the platform overview.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleChangePasscode} className="space-y-6 pt-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-muted-foreground ml-1">New Passcode</p>
                      <Input
                        type="password"
                        placeholder="Enter new master key"
                        value={newPasscode}
                        onChange={(e) => setNewPasscode(e.target.value)}
                        className="h-14 px-6 rounded-2xl font-bold tracking-widest border-2 border-primary/10 focus:border-primary focus:ring-4 focus:ring-primary/10"
                      />
                    </div>
                  </div>
                  <DialogFooter className="pb-6 pt-2">
                    <Button 
                      type="submit" 
                      className="w-full h-14 rounded-2xl font-black text-lg shadow-lg shadow-primary/20"
                    >
                      Update Security Key
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout}
              className="rounded-full border-primary/20 hover:bg-primary/5 text-primary font-bold"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Total Organizations" 
            value={platformOverview?.totalOrgs || 0} 
            icon={<Users className="h-5 w-5" />}
            description="Registered communities"
            trend="+12% from last month"
            color="blue"
          />
          <StatCard 
            title="Active Festivals" 
            value={platformOverview?.totalFestivals || 0} 
            icon={<PartyPopper className="h-5 w-5" />}
            description="Festivals hosted"
            trend="+5 new this week"
            color="orange"
          />
          <StatCard 
            title="Total Storage" 
            value={formatBytes(platformOverview?.totalStorage || 0)} 
            icon={<Activity className="h-5 w-5" />}
            description="Total data consumed"
            trend="+1.2MB today"
            color="purple"
          />
          <StatCard 
            title="Platform Circulation" 
            value={`₹${(platformOverview?.totalDonations || 0).toLocaleString()}`} 
            icon={<IndianRupee className="h-5 w-5" />}
            description="Total donations tracked"
            trend="+₹45k this month"
            color="green"
          />
        </div>

        {/* Organizations Table */}
        <Card className="border-none shadow-xl shadow-primary/5 rounded-[2rem] overflow-hidden bg-white/80 backdrop-blur-sm dark:bg-black/40">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent pb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl font-bold">Organization Directory</CardTitle>
                <CardDescription>Monitor detailed stats and activity for every organization</CardDescription>
              </div>
              <div className="relative max-w-xs w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search organizations..." 
                  className="pl-10 h-11 rounded-full bg-background/50 border-primary/10 focus:ring-primary/20"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[280px]">Organization</TableHead>
                    <TableHead>Signup Date</TableHead>
                    <TableHead>Latest Activity</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Festivals</TableHead>
                    <TableHead className="text-right">Donations</TableHead>
                    <TableHead className="text-right">Usage (Img/Exp)</TableHead>
                    <TableHead className="text-right">Storage</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStats.map((org) => (
                    <TableRow key={org.id} className="group hover:bg-primary/[0.02] transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg transition-all",
                            org.subscription_status === 'suspended' ? "bg-muted text-muted-foreground grayscale" : "bg-primary/10 text-primary"
                          )}>
                            {org.name.charAt(0)}
                          </div>
                          <div>
                            <div className={cn(
                              "font-bold transition-colors",
                              org.subscription_status === 'suspended' ? "text-muted-foreground line-through" : "text-foreground group-hover:text-primary"
                            )}>{org.name}</div>
                            <div className="text-xs text-muted-foreground font-medium">{org.email || 'No email provided'}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          {format(new Date(org.created_at), 'MMM dd, yyyy')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-foreground font-medium">
                          <History className="h-3.5 w-3.5 text-primary" />
                          {format(new Date(org.updated_at), 'MMM dd, HH:mm')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn(
                          "rounded-full px-3 py-1 font-bold text-[10px] uppercase tracking-tighter",
                          org.plan.startsWith('pro') ? "bg-orange-500/10 text-orange-600 border-orange-200" : "bg-muted text-muted-foreground border-border"
                        )}>
                          {org.plan.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn(
                          "rounded-full px-3 py-1 font-bold text-[10px] uppercase tracking-tighter",
                          org.subscription_status === 'suspended' ? "bg-destructive/10 text-destructive border-destructive/20" : "bg-emerald-500/10 text-emerald-600 border-emerald-200"
                        )}>
                          {org.subscription_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold text-foreground">
                        {org.festivals_count}
                      </TableCell>
                      <TableCell className="text-right">
                        <div>
                          <div className="font-bold text-foreground">₹{(org.donations_total || 0).toLocaleString()}</div>
                          <div className="text-[10px] text-muted-foreground font-medium uppercase">{org.donations_count} entries</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2 text-xs font-semibold text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <ImageIcon className="h-3 w-3" /> {org.images_count}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-border" />
                          <span className="flex items-center gap-1">
                            <IndianRupee className="h-3 w-3" /> {(org.expenses_total / 1000).toFixed(1)}k
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-bold text-foreground">
                          {formatBytes(org.storage_usage)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 rounded-xl border-none shadow-2xl">
                            <DropdownMenuLabel>Manage Organization</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleToggleSuspension(org.id, org.subscription_status === 'suspended')}
                              className={cn(
                                "font-bold",
                                org.subscription_status === 'suspended' ? "text-emerald-600" : "text-destructive"
                              )}
                            >
                              {org.subscription_status === 'suspended' ? (
                                <><Check className="mr-2 h-4 w-4" /> Activate Access</>
                              ) : (
                                <><XCircle className="mr-2 h-4 w-4" /> Suspend Access</>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel className="text-[10px] uppercase font-bold text-muted-foreground">Switch Plan</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleChangePlan(org.id, 'free')} disabled={org.plan === 'free'}>
                              Free Plan
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleChangePlan(org.id, 'pro_monthly')} disabled={org.plan === 'pro_monthly'}>
                              Pro Monthly
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleChangePlan(org.id, 'pro_annual')} disabled={org.plan === 'pro_annual'}>
                              Pro Annual
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {filteredStats.length === 0 && (
              <div className="py-20 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Search className="h-8 w-8 text-muted-foreground/30" />
                </div>
                <h3 className="text-lg font-bold">No organizations found</h3>
                <p className="text-muted-foreground">Try adjusting your search terms</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security Logs Section */}
        <Card className="border-none shadow-xl shadow-primary/5 rounded-[2rem] overflow-hidden bg-white/80 backdrop-blur-sm dark:bg-black/40">
          <CardHeader className="border-b border-primary/5 bg-primary/[0.01]">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-lg font-bold">Security Activity Log</CardTitle>
                <CardDescription>Recent access attempts and security configuration changes</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-primary/5">
              {securityLogs.length > 0 ? (
                securityLogs.map((log, i) => (
                  <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-primary/[0.01] transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        log.status === 'success' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : 
                        log.status === 'error' ? "bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.5)]" : "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                      )} />
                      <span className="font-bold text-foreground/80">{log.event}</span>
                    </div>
                    <span className="text-xs font-medium text-muted-foreground bg-muted/50 px-3 py-1 rounded-full border border-border/50">
                      {format(new Date(log.time), 'MMM dd, HH:mm:ss')}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-muted-foreground font-medium">
                  No recent security activity logged
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, description, trend, color }: { title: string, value: string | number, icon: React.ReactNode, description: string, trend: string, color: 'blue' | 'orange' | 'purple' | 'green' }) {
  const colorMap = {
    blue: 'from-blue-500/10 text-blue-600',
    orange: 'from-orange-500/10 text-orange-600',
    purple: 'from-purple-500/10 text-purple-600',
    green: 'from-emerald-500/10 text-emerald-600',
  };

  return (
    <Card className="border-none shadow-lg shadow-primary/5 rounded-[2rem] overflow-hidden bg-white/80 backdrop-blur-sm dark:bg-black/40">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className={cn("p-2 rounded-xl bg-gradient-to-br", colorMap[color])}>
            {icon}
          </div>
          <Badge variant="outline" className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 border-0">
            {trend}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-black tracking-tight">{value}</div>
        <p className="text-sm font-bold text-foreground/80 mt-1">{title}</p>
        <p className="text-[10px] text-muted-foreground font-medium mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}
