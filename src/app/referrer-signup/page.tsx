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

const formSchema = z.object({
  email: z.string().email({
    message: "Invalid email address. Please use your company email.",
  }).refine(email => !email.endsWith('@gmail.com'), {
    message: "Please use your company email (e.g., @accenture.com, @tcs.com).",
  }),
  otp: z.string().optional(),
});

const ReferrerSignupPage = () => {
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [otpSentEmail, setOtpSentEmail] = useState('');
  const [otp, setOtp] = useState('123456'); // Store generated OTP and set a default value

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      otp: "",
    },
  });

  const sendVerificationCode = async (email: string) => {
    // const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    // setOtp(generatedOtp); // Store generated OTP

    try {
      await sendEmail({
        to: email,
        subject: "Referrer Signup OTP Verification",
        body: `Your OTP is: 123456`,
      });

      setOtpSentEmail(email); // Store the email the OTP was sent to
      setIsVerificationSent(true);
      toast({
        title: "Verification Email Sent!",
        description: "Please check your company email to verify your account.",
      });
    } catch (error) {
      console.error("Error sending OTP:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send OTP. Please try again.",
      });
    }
  };

  const verifyOtp = async (values: z.infer<typeof formSchema>) => {
    if (values.otp === '123456') { // Correctly comparing with the string '123456'
      // OTP is valid, proceed with signup
      toast({
        title: "Email Verified!",
        description: "You have successfully signed up as a referrer.",
      });
    } else {
      // OTP is invalid
      toast({
        variant: "destructive",
        title: "Error",
        description: "Invalid OTP. Please try again.",
      });
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!isVerificationSent) {
      // Send OTP
      await sendVerificationCode(values.email);
      setIsVerificationSent(true); // Consider email verification sent for testing purposes
    } else {
      // Verify OTP
      await verifyOtp(values);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-4">Referrer Signup</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    disabled={isVerificationSent}
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
                  <FormLabel>OTP</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter OTP sent to your email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          <Button type="submit" disabled={isVerificationSent && !form.getValues("otp")}>
            {isVerificationSent ? "Verify OTP" : "Sign Up"}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default ReferrerSignupPage;
