import { ConfirmActionDialog } from "@/shared/ui/confirm-action-dialog";

type CancelTransportServiceDialogProps = {
  open: boolean;
  isConfirming: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onConfirm: () => void;
};

export function CancelTransportServiceDialog({
  open,
  isConfirming,
  errorMessage,
  onClose,
  onConfirm,
}: CancelTransportServiceDialogProps) {
  return (
    <ConfirmActionDialog
      open={open}
      title="Annullare il servizio selezionato?"
      description="Lo stato del servizio passera ad annullato. L'operazione e tracciata e non distruttiva."
      confirmLabel="Conferma annullamento"
      onClose={onClose}
      onConfirm={onConfirm}
      isConfirming={isConfirming}
      errorMessage={errorMessage}
    />
  );
}
