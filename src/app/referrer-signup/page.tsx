"use client";

import { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormItem, FormLabel, FormMessage, FormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { sendEmail } from "@/services/email";
import { useRouter } from 'next/navigation';

const formSchema = z.object({
  email: z.string().email({
    message: "Invalid email address. Please use your company email.",
  }).refine(email => !email.endsWith('@gmail.com'), {
    message: "Please use your company email (e.g., @accenture.com, @tcs.com).",
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
  });

  const sendVerificationCode = async (email: string) => {
    setIsLoading(true);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(otp);

    try {
      // Simulate sending email
      await sendEmail({
        to: email,
        subject: "Referrer Signup OTP Verification",
        body: `Your OTP is: ${otp}`, // Actual email sending is mocked
      });

      setOtpSentEmail(email);
      setIsVerificationSent(true);
      toast({
        title: "Verification Code Sent!",
        description: `For testing, your OTP is: ${otp}`, // Display OTP for testing
      });
    } catch (error) {
      console.error("Error sending OTP:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send OTP. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtpAndProceed = async (values: ReferrerSignupFormValues) => {
    setIsLoading(true);
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
    if (!isVerificationSent) {
      await sendVerificationCode(values.email);
    } else {
      await verifyOtpAndProceed(values);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-4 text-primary">Referrer Signup</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmitHandler)} className="space-y-4">
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
