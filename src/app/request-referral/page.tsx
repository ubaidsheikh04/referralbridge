"use client";

import { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Invalid email address.",
  }),
  targetCompany: z.string().min(2, {
    message: "Target company must be at least 2 characters.",
  }),
  jobId: z.string().min(2, {
    message: "Job ID must be at least 2 characters.",
  }),
  linkedinUrl: z.string().url({
    message: "Invalid LinkedIn URL.",
  }).optional(),
  resume: z.any().refine((files) => files?.length > 0, {
    message: "Resume is required.",
  }),
});

const RequestReferralPage = () => {
  const [isOtpSent, setIsOtpSent] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      targetCompany: "",
      jobId: "",
      linkedinUrl: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    console.log(values);
    // Implement OTP verification logic here
    setIsOtpSent(true);
    toast({
      title: "OTP Sent!",
      description: "Please check your email to verify your email address.",
    });
  };

  const onVerifyOtp = async () => {
    // Implement OTP verification logic here
    toast({
      title: "Email Verified!",
      description: "You can now submit your referral request.",
    });
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-4">Referral Request Form</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your email" {...field} disabled={isOtpSent} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {isOtpSent ? (
            <div className="flex items-center space-x-2">
              <Input placeholder="Enter OTP" />
              <Button onClick={onVerifyOtp}>Verify OTP</Button>
            </div>
          ) : (
            <Button type="submit">Send OTP</Button>
          )}
          <FormField
            control={form.control}
            name="targetCompany"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Target Company</FormLabel>
                <FormControl>
                  <Input placeholder="Enter target company" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="jobId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Job ID/Referral ID</FormLabel>
                <FormControl>
                  <Input placeholder="Enter Job ID or Referral ID" {...field} />
                </FormControl>
                <FormMessage />
                <FormDescription>Please check details in job openings.</FormDescription>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="linkedinUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>LinkedIn URL</FormLabel>
                <FormControl>
                  <Input placeholder="Enter LinkedIn URL" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="resume"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Resume</FormLabel>
                <FormControl>
                  <Input type="file" {...field} />
                </FormControl>
                <FormMessage />
                <FormDescription>Upload your resume in PDF or DOCX format.</FormDescription>
              </FormItem>
            )}
          />
          <Button type="submit" disabled={!isOtpSent}>
            Submit
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default RequestReferralPage;
