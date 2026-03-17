import React from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";

interface FormDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  onSubmit: () => void;
  submitLabel?: string;
  children: React.ReactNode;
  destructive?: boolean;
  wide?: boolean;
}

export function FormDialog({
  open, onClose, title, description, onSubmit, submitLabel = "Kaydet", children, destructive, wide,
}: FormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className={`${wide ? "sm:max-w-2xl" : ""} max-h-[90vh] flex flex-col`}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="space-y-4 overflow-y-auto py-2 flex-1 pr-1">
          {children}
        </div>
        <DialogFooter className="pt-2 border-t border-border">
          <Button variant="outline" onClick={onClose}>Iptal</Button>
          <Button variant={destructive ? "destructive" : "default"} onClick={onSubmit}>
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface FieldProps {
  label: string;
  children: React.ReactNode;
}

export function Field({ label, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message }: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Iptal</Button>
          <Button variant="destructive" onClick={onConfirm}>Sil</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}