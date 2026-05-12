import { ConfirmActionDialog } from "@/shared/ui/confirm-action-dialog";

type DeleteTransportServiceDialogProps = {
  open: boolean;
  isConfirming: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onConfirm: () => void;
};

export function DeleteTransportServiceDialog({
  open,
  isConfirming,
  errorMessage,
  onClose,
  onConfirm,
}: DeleteTransportServiceDialogProps) {
  return (
    <ConfirmActionDialog
      open={open}
      title="Eliminare il servizio selezionato?"
      description="L'operazione elimina definitivamente il servizio di trasporto selezionato."
      confirmLabel="Conferma eliminazione"
      onClose={onClose}
      onConfirm={onConfirm}
      isConfirming={isConfirming}
      errorMessage={errorMessage}
    />
  );
}
