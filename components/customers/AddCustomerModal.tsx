"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  UserPlus,
  Mail,
  Phone,
  User,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

export interface CustomerCreatedData {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  isActive: boolean;
  createdAt?: string;
}

interface AddCustomerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCustomerCreated?: (customer: CustomerCreatedData) => void;
}

export function AddCustomerModal({
  open,
  onOpenChange,
  onCustomerCreated,
}: AddCustomerModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setPassword("");
    setShowPassword(false);
  };

  const handleGeneratePassword = () => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const generated = `Client@${randomSuffix}!`;
    setPassword(generated);
    setShowPassword(true);
    toast({
      title: "Password Generated",
      description: `Generated: ${generated}`,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter the customer's full name.",
        variant: "destructive",
      });
      return;
    }

    if (!email.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          password: password.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast({
          title: "Failed to Add Customer",
          description: data.error || "Could not register customer.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Customer Added Successfully! 🎉",
        description: `${data.customer.name} (${data.customer.email}) has been registered.`,
      });

      if (onCustomerCreated) {
        onCustomerCreated(data.customer);
      }

      resetForm();
      onOpenChange(false);
    } catch (err: any) {
      console.error("Error creating customer:", err);
      toast({
        title: "Network Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-[#FCFBF7] rounded-3xl border border-[#E8E1D4] p-6 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-[#07111F] text-[#D9B45B]">
              Manager Access
            </span>
            <span className="text-xs text-[#6B7280] font-medium flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              Role: Customer
            </span>
          </div>

          <DialogTitle className="font-serif text-xl sm:text-2xl font-black text-[#07111F] flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#C89B3C]/15 border border-[#C89B3C]/30 text-[#A97918] flex items-center justify-center">
              <UserPlus className="h-4 w-4" />
            </div>
            Register New Customer
          </DialogTitle>
          <DialogDescription className="text-xs text-[#6B7280] pt-1">
            Create a client record to instantly issue rental agreements, track inquiries, or assign booking reservations.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Full Name */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-[#07111F] flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-[#C89B3C]" />
              Full Name *
            </Label>
            <Input
              type="text"
              required
              placeholder="e.g. Michael Thorne or Sarah Jenkins"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-white border-[#E8E1D4] rounded-xl text-xs h-10 text-[#07111F] placeholder:text-[#9CA3AF] focus:border-[#C89B3C] focus:ring-[#C89B3C]"
            />
          </div>

          {/* Email Address */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-[#07111F] flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-[#C89B3C]" />
              Email Address *
            </Label>
            <Input
              type="email"
              required
              placeholder="e.g. customer@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white border-[#E8E1D4] rounded-xl text-xs h-10 text-[#07111F] placeholder:text-[#9CA3AF] focus:border-[#C89B3C] focus:ring-[#C89B3C]"
            />
          </div>

          {/* Phone Number */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-[#07111F] flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-[#C89B3C]" />
              Phone Number <span className="text-[#9CA3AF] font-normal">(Optional)</span>
            </Label>
            <Input
              type="tel"
              placeholder="e.g. +1 (555) 234-5678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="bg-white border-[#E8E1D4] rounded-xl text-xs h-10 text-[#07111F] placeholder:text-[#9CA3AF] focus:border-[#C89B3C] focus:ring-[#C89B3C]"
            />
          </div>

          {/* Account Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-[#07111F] flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-[#C89B3C]" />
                Password <span className="text-[#9CA3AF] font-normal">(Optional)</span>
              </Label>
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="text-[11px] font-bold text-[#A97918] hover:text-[#07111F] flex items-center gap-1 transition-colors"
              >
                <Sparkles className="h-3 w-3" />
                Generate
              </button>
            </div>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Leave blank for default: Customer123!"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white border-[#E8E1D4] rounded-xl text-xs h-10 text-[#07111F] placeholder:text-[#9CA3AF] pr-9 focus:border-[#C89B3C] focus:ring-[#C89B3C]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#07111F] p-1"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
            <p className="text-[11px] text-[#6B7280]">
              If left blank, the customer can sign in using default password{" "}
              <code className="px-1.5 py-0.5 rounded bg-[#F7F3EA] text-[#A97918] font-mono text-[10px] font-bold">
                Customer123!
              </code>
            </p>
          </div>

          <DialogFooter className="pt-3 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl border-[#E8E1D4] text-[#07111F] text-xs font-bold hover:bg-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] font-black text-xs rounded-xl shadow-md hover:brightness-105 border-0 gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Creating Customer...
                </>
              ) : (
                <>
                  <UserPlus className="h-3.5 w-3.5" />
                  Register Customer
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
