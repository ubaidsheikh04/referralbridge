
"use client";

import { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { uploadFile } from "@/services/file-upload";
import { sendEmail } from "@/services/email";
import { addDoc, collection, getFirestore } from "firebase/firestore";
import { firebaseApp } from "@/services/firebase";
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Script from 'next/script';

// Define the Zod schema for the form
const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  targetCompany: z.string().min(2, { message: "Company name must be at least 2 characters." }),
  jobId: z.string().min(1, { message: "Job ID/Referral ID cannot be empty." }).describe("Check details in job openings"),
  resume: z.instanceof(FileList).refine(files => files?.length === 1, "Resume is required."),
  otp: z.string().optional(),
});

const RequestReferralPage = () => {
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false); // Track if email is verified
  const [orderId, setOrderId] = useState<string | null>(null);
  const [razorpayKey, setRazorpayKey] = useState<string | null>(null);
  const [referralData, setReferralData] = useState<any>(null); // Store form data temporarily


  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      targetCompany: "",
      jobId: "",
      resume: undefined,
      otp: "",
    },
  });

  // Function to handle the first step: Sending OTP
  const handleVerifyEmail = async () => {
    const email = form.getValues("email");
    if (!email) {
      form.setError("email", { type: "manual", message: "Email is required to verify." });
      return;
    }
    const emailError = form.getFieldState("email").error;
    if (emailError) {
      return; // Don't proceed if email format is invalid
    }

    const generatedOtp = "123456"; // Use a fixed OTP for testing

    try {
      // Simulate sending email (replace with actual email sending logic later)
       await sendEmail({
         to: email,
         subject: "Referral Request OTP Verification",
         body: `Your OTP is: ${generatedOtp}`,
       });

      setIsOtpSent(true);
      toast({
        title: "OTP Sent!",
        description: `Please use ${generatedOtp} as OTP`,
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

  // Function to handle the second step: Verifying OTP
  const handleVerifyOtp = async () => {
    const otp = form.getValues("otp");
    const expectedOtp = "123456"; // The fixed OTP used for testing

    if (otp === expectedOtp) {
      setIsVerified(true); // Mark email as verified
      toast({
        title: "Email Verified!",
        description: "You can now proceed to payment.",
      });
      // Proceed to create Razorpay order after OTP verification
      await createRazorpayOrder();

    } else {
      form.setError("otp", { type: "manual", message: "Invalid OTP." });
      toast({
        variant: "destructive",
        title: "Error",
        description: "Invalid OTP. Please try again.",
      });
    }
  };


  // Function to create Razorpay Order
 const createRazorpayOrder = async () => {
    try {
      const response = await fetch('/api/razorpay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount: 10000 }), // amount in paise (100 INR)
      });

      if (!response.ok) {
        throw new Error('Failed to create Razorpay order');
      }

      const data = await response.json();
      setOrderId(data.orderId);
      setRazorpayKey(data.keyId);
      setReferralData(form.getValues()); // Store form data before payment
       // Initiate payment after order creation
      handlePayment(data.keyId, data.orderId);


    } catch (error) {
      console.error('Error creating Razorpay order:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create payment order. Please try again.',
      });
    }
  };


 // Function to handle the payment process
  const handlePayment = (keyId: string, orderId: string) => {
    const options = {
      key: keyId,
      amount: 10000, // amount in paise
      currency: "INR",
      name: "ReferralBridge",
      description: "Referral Request Fee",
      order_id: orderId,
      handler: async function (response: any) {
        // Payment successful, now save data to Firestore
        try {
          if (referralData) {
            const resumeFile = referralData.resume[0];
            const uploadedResumeUrl = await uploadFile(resumeFile);
             setResumeUrl(uploadedResumeUrl);

            const db = getFirestore(firebaseApp);
            const referralCollection = collection(db, 'referralRequests');
            await addDoc(referralCollection, {
              name: referralData.name,
              email: referralData.email,
              targetCompany: referralData.targetCompany,
              jobId: referralData.jobId,
              resumeUrl: uploadedResumeUrl,
              paymentId: response.razorpay_payment_id, // Store payment ID
              orderId: response.razorpay_order_id,
              paymentSignature: response.razorpay_signature,
              paymentStatus: 'paid' // Mark as paid
            });

             toast({
              title: "Payment Successful!",
              description: "Your referral request has been submitted.",
            });
            router.push('/thank-you');
          } else {
             throw new Error("Referral data not found after payment.");
          }
        } catch (error) {
          console.error("Error saving referral request after payment:", error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to save referral request after payment. Please contact support.",
          });
        }
      },
       prefill: {
        name: form.getValues("name"),
        email: form.getValues("email"),
      },
      theme: {
        color: "#FBBF24", // Yellow color for Razorpay theme
      },
    };

    // Dynamically load the Razorpay script and open checkout
    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  };


  // Combined onSubmit handler
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
     if (!isOtpSent) {
      await handleVerifyEmail();
    } else if (!isVerified) {
       await handleVerifyOtp();
     }
     // Payment is handled via handlePayment after successful OTP verification and order creation
  };


  // Helper to determine button text and action
  const getButtonAction = () => {
    if (!isOtpSent) {
      return { text: "Verify Email", action: handleVerifyEmail, type: "button" as "button" | "submit" };
    } else if (!isVerified) {
      return { text: "Verify OTP & Proceed to Pay", action: handleVerifyOtp, type: "button" as "button" | "submit" };
    } else {
      // After verification, the payment modal should open automatically
      // We might disable the button or change its state
       return { text: "Processing Payment...", action: () => {}, type: "button" as "button" | "submit", disabled: true };
    }
  };

  const buttonConfig = getButtonAction();

  return (
     <>
      <Script
        id="razorpay-checkout-js"
        src="https://checkout.razorpay.com/v1/checkout.js"
      />
      <div className="container mx-auto p-4">
        <div className="max-w-lg mx-auto bg-card text-card-foreground rounded-lg shadow-lg p-8 mt-10 border border-border">
          <h1 className="text-3xl font-bold mb-6 text-center text-primary">Request a Referral</h1>
          <Form {...form}>
             <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                      <Input type="email" placeholder="Enter your email" {...field} disabled={isOtpSent} />
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
                      <Input placeholder="Enter the company you want a referral for" {...field} />
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
                    <FormLabel>Job ID / Referral ID</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter the Job ID or Referral ID" {...field} />
                    </FormControl>
                    <FormDescription>
                      Please check the company's job openings page for the correct ID.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="resume"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resume (PDF or DOCX)</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept=".pdf,.docx"
                        onChange={(e) => field.onChange(e.target.files)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isOtpSent && !isVerified && (
                <FormField
                  control={form.control}
                  name="otp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>OTP</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter OTP sent to your email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

               <Button
                type={buttonConfig.type}
                onClick={buttonConfig.type === 'button' ? buttonConfig.action : undefined}
                className="w-full"
                disabled={buttonConfig.disabled}
              >
                {buttonConfig.text}
              </Button>

            </form>
          </Form>
        </div>
      </div>
    </>
  );
};

export default RequestReferralPage;
