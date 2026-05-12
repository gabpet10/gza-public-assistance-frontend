import { ConfirmActionDialog } from "@/shared/ui/confirm-action-dialog";

type DeleteTransportSheetDialogProps = {
  open: boolean;
  isConfirming: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onConfirm: () => void;
};

export function DeleteTransportSheetDialog({
  open,
  isConfirming,
  errorMessage,
  onClose,
  onConfirm,
}: DeleteTransportSheetDialogProps) {
  return (
    <ConfirmActionDialog
      open={open}
      title="Eliminare la scheda trasporto del servizio selezionato?"
      description="L'operazione elimina definitivamente la scheda associata al servizio."
      confirmLabel="Conferma eliminazione scheda"
      onClose={onClose}
      onConfirm={onConfirm}
      isConfirming={isConfirming}
      errorMessage={errorMessage}
    />
  );
}
