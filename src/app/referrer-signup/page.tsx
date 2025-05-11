"use client";

import { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type FieldErrors } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormItem, FormLabel, FormMessage, FormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';

const formSchema = z.object({
  email: z.string().email({
    message: "Invalid email address. Please use your company email.",
  }).refine(email => !email.endsWith('@gmail.com') && email.includes('@'), {
    message: "Please use your company email (e.g., user@company.com, not @gmail.com).",
  }),
  otp: z.string().length(6, { message: "OTP must be 6 digits." }).optional(),
  company: z.string().min(2, {
    message: "Company name must be at least 2 characters.",
  }),
});

type ReferrerSignupFormValues = z.infer<typeof formSchema>;

const ReferrerSignupPage = () => {
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [otpSentEmail, setOtpSentEmail] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ReferrerSignupFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      otp: "",
      company: "",
    },
    reValidateMode: 'onChange', // Set reValidateMode
  });

  const sendOtpEmailApi = async (email: string, otp: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: email,
          subject: 'Your OTP for Referrer Signup',
          htmlBody: `<p>Your OTP for Referrer Signup is: <strong>${otp}</strong></p>`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send OTP email');
      }
      return true;
    } catch (error: any) {
      console.error("Error sending OTP email via API:", error);
      toast({
        variant: "destructive",
        title: "Email Error",
        description: error.message || "Could not send OTP email. Please try again.",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const sendVerificationCode = async (email: string) => {
    console.log("Attempting to send verification code to:", email);
    setIsLoading(true);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(otp);

    const emailSent = await sendOtpEmailApi(email, otp);

    if (emailSent) {
      setOtpSentEmail(email);
      setIsVerificationSent(true);
      toast({
        title: "Verification Code Sent!",
        description: "Please check your email for the OTP.",
      });
    }
    setIsLoading(false);
  };

  const verifyOtpAndProceed = async (values: ReferrerSignupFormValues) => {
    console.log("Attempting to verify OTP and proceed with values:", values);
    setIsLoading(true);
    if (!generatedOtp) {
        toast({ variant: "destructive", title: "Error", description: "OTP not generated or expired. Please request a new one." });
        setIsLoading(false);
        return;
    }
    if (values.otp === generatedOtp) {
      toast({
        title: "Email Verified!",
        description: "You have successfully signed up as a referrer.",
      });
      sessionStorage.setItem('company', values.company);
      router.push('/dashboard');
    } else {
      form.setError("otp", { type: "manual", message: "Invalid OTP. Please try again." });
      toast({
        variant: "destructive",
        title: "Error",
        description: "Invalid OTP. Please try again.",
      });
    }
    setIsLoading(false);
  };

  const onSubmitHandler = async (values: ReferrerSignupFormValues) => {
    console.log("onSubmitHandler called with values:", values); // Crucial log
    if (!isVerificationSent) {
      console.log("Calling sendVerificationCode");
      await sendVerificationCode(values.email);
    } else {
      console.log("Calling verifyOtpAndProceed");
      await verifyOtpAndProceed(values);
    }
  };

  const handleValidationErrors = (errors: FieldErrors<ReferrerSignupFormValues>) => {
    // Log the raw errors object for detailed debugging
    console.log("Raw errors object in handleValidationErrors:", JSON.stringify(errors, null, 2));

    if (Object.keys(errors).length > 0) {
      console.error("Form validation detected. Errors object:", errors); // Changed log message for clarity
      let toastShown = false;
      if (errors.email?.message) {
        toast({ variant: "destructive", title: "Input Error", description: errors.email.message });
        toastShown = true;
      } else if (errors.company?.message) {
        toast({ variant: "destructive", title: "Input Error", description: errors.company.message });
        toastShown = true;
      } else if (errors.otp?.message && isVerificationSent) {
         toast({ variant: "destructive", title: "Input Error", description: errors.otp.message });
         toastShown = true;
      }

      if (!toastShown) {
        // If errors object had keys, but no specific toast was shown for email, company, or OTP,
        // it means there's an error on a field not explicitly handled or an unexpected error structure.
        console.error("Unhandled validation error structure. Errors:", errors);
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: "Please review your input. Some fields might be invalid or an unexpected error occurred.",
        });
      }
    } else {
      // This case: react-hook-form called the error handler,
      // but the `errors` object it provided is empty.
      console.log("handleValidationErrors was called by react-hook-form, but the errors object was empty. This often indicates an issue with form state or resolver not related to field-specific Zod errors, or the form is considered invalid by RHF for reasons other than Zod validation (e.g., native browser validation if not prevented).");
      toast({
        variant: "destructive",
        title: "Form Submission Issue",
        description: "Could not process the form. Please ensure all fields are correctly filled and try again.",
      });
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-4 text-primary">Referrer Signup</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmitHandler, handleValidationErrors)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter your company email"
                    {...field}
                    disabled={isVerificationSent || isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
             <FormField
              control={form.control}
              name="company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your company name"
                      {...field}
                      disabled={isVerificationSent || isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          {isVerificationSent && otpSentEmail && (
            <FormField
              control={form.control}
              name="otp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>OTP (6 digits)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter OTP"
                      {...field}
                      maxLength={6}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          <Button type="submit" disabled={isLoading || (isVerificationSent && !form.getValues("otp"))}>
            {isLoading ? "Processing..." : (isVerificationSent ? "Verify OTP & Sign Up" : "Send OTP")}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default ReferrerSignupPage;
