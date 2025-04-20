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
import { uploadFile } from "@/services/file-upload";
import { sendEmail } from "@/services/email";
import { firebaseApp, initFirestore, collection, getFirestore } from "@/services/firebase";
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { addDoc } from "firebase/firestore";

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
  resume: z.any().refine((files) => files?.length > 0, {
    message: "Resume is required.",
  }),
  otp: z.string().optional(),
});

const RequestReferralPage = () => {
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otp, setOtp] = useState("123456"); // Set a default OTP for testing
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      targetCompany: "",
      jobId: "",
      resume: null,
      otp: "",
    },
  });
  const router = useRouter();

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (isOtpSent) {
      // Verify OTP
      if (values.otp === otp) {
        // OTP is valid, proceed to submit the referral request
        try {
          // Upload the resume and get the URL
          const resumeFile = values.resume[0];
          const uploadedResumeUrl = await uploadFile(resumeFile);
          setResumeUrl(uploadedResumeUrl);

          // Add the referral request to Firestore
          const db = getFirestore(firebaseApp);
          const referralCollection = collection(db, 'referralRequests');
          await addDoc(referralCollection, {
            name: values.name,
            email: values.email,
            targetCompany: values.targetCompany,
            jobId: values.jobId,
            resumeUrl: uploadedResumeUrl,
          });

          // Send email
          await sendEmail({
            to: values.email,
            subject: "Referral Request",
            body: `Thank you for your referral request. Your resume has been uploaded to ${uploadedResumeUrl}`,
          });

          toast({
            title: "Referral Request Submitted!",
            description: "We have received your referral request and will process it soon.",
          });

          router.push('/');
        } catch (error) {
          console.error("Error submitting referral request:", error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to submit referral request. Please try again.",
          });
        }
      } else {
        // OTP is invalid
        toast({
          variant: "destructive",
          title: "Error",
          description: "Invalid OTP. Please try again.",
        });
      }
    } else {
      // Send OTP
      setIsOtpSent(true);
      form.setValue("email", values.email); // Persist the email value
      toast({
        title: "OTP Sent!",
        description: "Please use 123456 as OTP",
      });
    }
  };

  return (
    <div className="container mx-auto py-10">
       <header className="flex items-center mb-4">
        <Link href="/" className="flex items-center">
          <ArrowLeft className="mr-2" />
        </Link>
      </header>
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
                  <Input placeholder="Enter your name" {...field} onChange={field.onChange} value={field.value}/>
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
                  <Input placeholder="Enter your email" {...field} onChange={field.onChange} value={field.value}/>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="targetCompany"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Target Company</FormLabel>
                <FormControl>
                  <Input placeholder="Enter target company" {...field}  onChange={field.onChange} value={field.value}/>
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
                <FormLabel>Job ID/ Referral ID</FormLabel>
                <FormControl>
                  <Input placeholder="Enter Job ID/Referral ID and advice checking details in job openings" {...field}  onChange={field.onChange} value={field.value}/>
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
                  <Input
                    type="file"
                    accept=".pdf,.docx"
                    onChange={(e) => field.onChange(e.target.files)}
                  />
                </FormControl>
                <FormDescription>
                  Upload your resume in PDF or DOCX format
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          {isOtpSent && (
            <FormField
              control={form.control}
              name="otp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>OTP</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter OTP sent to your email" {...field}  onChange={field.onChange} value={field.value}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          <Button type="submit" disabled={isOtpSent && !form.getValues("otp")}>
            {isOtpSent ? "Submit Referral Request" : "Verify Email"}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default RequestReferralPage;
