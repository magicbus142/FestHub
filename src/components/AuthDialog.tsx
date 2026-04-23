import { OrganizationLoginDialog } from '@/components/OrganizationLoginDialog';
import { useOrganization } from '@/contexts/OrganizationContext';

interface AuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AuthDialog = ({ isOpen, onClose, onSuccess }: AuthDialogProps) => {
  const { currentOrganization } = useOrganization();

  return (
    <OrganizationLoginDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      onSuccess={() => {
        onSuccess();
        onClose();
      }}
      prefilledName={currentOrganization?.name}
    />
  );
};