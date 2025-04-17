"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

export function ProfileCompletionModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const router = useRouter();

  const handleContinueToDashboard = () => {
    onClose();
    router.push("/dashboard");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900 mb-4">
            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-300" />
          </div>
          <DialogTitle className="text-xl text-center">Account Created Successfully</DialogTitle>
          <DialogDescription className="text-center">
            Your account has been created and verified. You can now access all features of the application.
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="pt-4 flex flex-col sm:flex-row sm:justify-center">
          <Button 
            onClick={handleContinueToDashboard}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            Continue to Dashboard
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
