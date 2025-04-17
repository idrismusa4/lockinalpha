"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle, UserCircle } from "lucide-react";

export function WelcomeProfileModal() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isLoaded } = useUser();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<"form" | "success">("form");
  const router = useRouter();

  useEffect(() => {
    // Check if this is the first time visiting dashboard after signup
    const shouldShowWelcome = localStorage.getItem("show_welcome_profile");
    
    if (shouldShowWelcome === "true" && isLoaded && user) {
      // Pre-fill with any existing values
      if (user.firstName) setFirstName(user.firstName);
      if (user.lastName) setLastName(user.lastName);
      
      // Show the modal
      setIsOpen(true);
      
      // Remove the flag so we don't show it again
      localStorage.removeItem("show_welcome_profile");
    }
  }, [isLoaded, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLoaded || !user) return;
    
    try {
      setIsSubmitting(true);
      
      console.log("Updating profile with:", firstName, lastName);
      
      // Use metadata approach which seems more reliable with Clerk
      await user.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          preferredFirstName: firstName,
          preferredLastName: lastName
        }
      });
      
      // Second attempt with direct fields
      try {
        await user.update({
          firstName,
          lastName
        });
      } catch (nameError) {
        console.log("Could not update name directly, but metadata was updated", nameError);
      }
      
      // Move to success step
      setStep("success");
      
    } catch (error: any) {
      console.error("Failed to update profile:", error);
      toast.error("Could not update profile, but you can try again later in settings");
      // Close the modal even if there's an error
      setIsOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setStep("form");
  };

  if (!isLoaded || !isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        {step === "form" ? (
          <>
            <DialogHeader>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900 mb-4">
                <UserCircle className="h-6 w-6 text-purple-600 dark:text-purple-300" />
              </div>
              <DialogTitle className="text-xl text-center">Complete Your Profile</DialogTitle>
              <DialogDescription className="text-center">
                Welcome to LockIn! Let's set up your profile information.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <DialogFooter className="pt-4">
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating Profile...
                    </>
                  ) : (
                    "Complete Profile"
                  )}
                </Button>
                
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={handleClose}
                  className="w-full mt-2"
                >
                  Skip for Now
                </Button>
              </DialogFooter>
            </form>
          </>
        ) : (
          <>
            <DialogHeader>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900 mb-4">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-300" />
              </div>
              <DialogTitle className="text-xl text-center">Profile Updated</DialogTitle>
              <DialogDescription className="text-center">
                Your profile information has been updated successfully.
              </DialogDescription>
            </DialogHeader>
            
            <DialogFooter className="pt-4">
              <Button 
                onClick={handleClose}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                Continue to Dashboard
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
