import { useOrganization } from '@/contexts/OrganizationContext';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Building2, Check, ChevronsUpDown, Plus } from 'lucide-react';

export function OrganizationSwitcher() {
  const { currentOrganization, userOrganizations, setCurrentOrganization } = useOrganization();
  const navigate = useNavigate();

  if (!currentOrganization) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          <div className="flex items-center gap-2 truncate">
            <Building2 className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{currentOrganization.name}</span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 flex-shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[200px]" align="end">
        <DropdownMenuLabel>Organizations</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {userOrganizations.map((userRole) => (
          <DropdownMenuItem
            key={userRole.organization.id}
            onClick={() => {
              setCurrentOrganization(userRole.organization);
              navigate('/');
            }}
            className="cursor-pointer"
          >
            <Check
              className={`mr-2 h-4 w-4 ${
                currentOrganization.id === userRole.organization.id
                  ? 'opacity-100'
                  : 'opacity-0'
              }`}
            />
            <div className="flex-1 truncate">
              <div className="truncate">{userRole.organization.name}</div>
              <div className="text-xs text-muted-foreground capitalize">
                {userRole.role}
              </div>
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate('/organizations')} className="cursor-pointer">
          <Plus className="mr-2 h-4 w-4" />
          Manage Organizations
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
