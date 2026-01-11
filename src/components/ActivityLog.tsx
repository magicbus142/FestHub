import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History } from 'lucide-react';

interface AuditLog {
  id: string;
  table_name: string;
  action: string;
  created_at: string;
  old_data: any;
  new_data: any;
  changed_by: string; // User ID
  user_email?: string; // We'll try to fetch this
}

export function ActivityLog({ organizationId }: { organizationId: string }) {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit-logs', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as AuditLog[];
    }
  });

  return (
    <Card>
       <CardHeader>
          <CardTitle className="flex items-center gap-2">
             <History className="h-5 w-5" />
             Activity Log
          </CardTitle>
       </CardHeader>
       <CardContent>
          <ScrollArea className="h-[400px]">
             {isLoading ? (
                 <div className="text-center py-4 text-muted-foreground">Loading...</div>
             ) : logs.length === 0 ? (
                 <div className="text-center py-4 text-muted-foreground">No recent activity</div>
             ) : (
                 <div className="space-y-4">
                    {logs.map(log => (
                        <div key={log.id} className="flex flex-col border-b pb-3 last:border-0">
                           <div className="flex justify-between items-start">
                              <span className="font-semibold text-sm">
                                 {log.action} on {log.table_name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                 {new Date(log.created_at).toLocaleString()}
                              </span>
                           </div>
                           <div className="text-xs text-muted-foreground mt-1">
                              Record: {log.new_data?.name || log.old_data?.name || log.record_id.slice(0, 8)} | 
                              Amount: ₹{log.new_data?.amount || log.old_data?.amount || 0}
                           </div>
                           {/* Simplified Diff View */}
                           {log.action === 'UPDATE' && (
                               <div className="mt-2 text-xs bg-muted/50 p-2 rounded">
                                  <span className="text-red-500 line-through mr-2">Old: ₹{log.old_data?.amount}</span>
                                  <span className="text-green-600">New: ₹{log.new_data?.amount}</span>
                               </div>
                           )}
                        </div>
                    ))}
                 </div>
             )}
          </ScrollArea>
       </CardContent>
    </Card>
  );
}
