"use client";

import { useState, useEffect, ChangeEvent } from 'react';
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
import { firebaseApp, db } from "@/services/firebase";
import { useRouter } from 'next/navigation';
import Script from 'next/script';

// Define the Zod schema for the form
const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  targetCompany: z.string().min(2, { message: "Company name must be at least 2 characters." }),
  jobId: z.string().min(1, { message: "Job ID/Referral ID cannot be empty." }).describe("Check details in job openings"),
  resume: z.any().refine(
    (files) => typeof window === 'undefined' || (files instanceof FileList && files?.length === 1 && files[0].size > 0 && ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(files[0].type)),
    "Resume (PDF or DOCX) is required."
  ),
  otp: z.string().length(6, { message: "OTP must be 6 digits." }).optional(),
});

// Type for the form data
type ReferralFormValues = z.infer<typeof formSchema>;


const RequestReferralPage = () => {
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentInProgress, setPaymentInProgress] = useState(false);
  const [currentReferralData, setCurrentReferralData] = useState<ReferralFormValues | null>(null);


  const router = useRouter();
  const form = useForm<ReferralFormValues>({
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

  const handleSendOtp = async () => {
    setIsLoading(true);
    const email = form.getValues("email");
    if (!email || form.getFieldState("email").invalid) {
      form.setError("email", { type: "manual", message: "Valid email is required to send OTP." });
      toast({ variant: "destructive", title: "Error", description: "Please enter a valid email address." });
      setIsLoading(false);
      return;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(otp);
    
    // Attempt to send email (currently logs to console)
    try {
        await sendEmail({ 
          to: email,
          subject: "Your OTP for ReferralBridge",
          body: `Your OTP is: ${otp}`,
        });
        toast({
          title: "OTP Sent!",
          description: "Please check your email for the OTP.", // Generic message
        });
    } catch (error) {
        console.error("Error attempting to send OTP email:", error);
        toast({
            variant: "destructive",
            title: "Email Error",
            description: "Could not attempt to send OTP email. Please try again.",
        });
        setIsLoading(false);
        return;
    }

    setIsOtpSent(true);
    // The following toast is removed as per user request to not show OTP in prompt
    // toast({
    //   title: "OTP Sent!",
    //   description: `For testing, your OTP is: ${otp}`, 
    // });
    setIsLoading(false);
  };

  const handleVerifyOtpAndProceedToPayment = async () => {
    setIsLoading(true);
    const otpValue = form.getValues("otp");
    const formData = form.getValues();
    setCurrentReferralData(formData);


    if (otpValue === generatedOtp) {
      setIsEmailVerified(true);
      toast({
        title: "Email Verified!",
        description: "Proceeding to payment...",
      });
      await createRazorpayOrder(formData);
    } else {
      form.setError("otp", { type: "manual", message: "Invalid OTP." });
      toast({
        variant: "destructive",
        title: "Error",
        description: "Invalid OTP. Please try again.",
      });
      setIsLoading(false);
    }
  };

 const createRazorpayOrder = async (referralData: ReferralFormValues) => {
    setPaymentInProgress(true); 
    setIsLoading(true); 

    if (!referralData.name || !referralData.email || !referralData.targetCompany || !referralData.jobId) {
        toast({ variant: 'destructive', title: 'Error', description: 'All fields are required before payment.' });
        setIsLoading(false);
        setPaymentInProgress(false);
        return;
    }
     const resumeFiles = referralData.resume;
     if (typeof window === 'undefined' || !(resumeFiles instanceof FileList && resumeFiles.length === 1 && resumeFiles[0].size > 0)) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please select a valid resume file.' });
        setIsLoading(false);
        setPaymentInProgress(false);
        return;
    }

    try {
      const response = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 10000 }), // amount in paise (100 INR)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error creating Razorpay order. Server response:", errorText);
        const errorData = JSON.parse(errorText || "{}");
        throw new Error(errorData.error || `Failed to create Razorpay order. Status: ${response.status}`);
      }

      const data = await response.json();
      if (!data.orderId || !data.keyId) {
        throw new Error("Received invalid order data from server.");
      }
      setCurrentReferralData(referralData); // Ensure referralData is set before payment
      handleRazorpayPayment(data.keyId, data.orderId, referralData);

    } catch (error: any) {
      console.error('Error creating Razorpay order:', error);
      toast({ variant: 'destructive', title: 'Payment Error', description: error.message || 'Failed to create payment order.' });
      setIsEmailVerified(false); 
      setIsLoading(false);
      setPaymentInProgress(false);
    }
  };

  const handleRazorpayPayment = (keyId: string, orderId: string, referralDataOnPayment: ReferralFormValues) => {
     if (!referralDataOnPayment) {
        console.error("Referral data is null in handlePayment at the start of Razorpay options");
        toast({ variant: "destructive", title: "Error", description: "Critical: Form data is missing. Cannot proceed with payment." });
        setIsLoading(false);
        setPaymentInProgress(false);
        return;
    }
    const options = {
      key: keyId,
      amount: 10000, 
      currency: "INR",
      name: "ReferralBridge",
      description: "Referral Request Fee",
      order_id: orderId,
      handler: async function (response: any) {
        setIsLoading(true); 
        setPaymentInProgress(true);

        if (!currentReferralData) {
            console.error("Critical: currentReferralData is null in payment handler callback.");
            toast({ variant: "destructive", title: "Error", description: "Session data lost. Cannot save referral." });
            setIsLoading(false);
            setPaymentInProgress(false);
            return;
        }
        
        try {
          const verificationResponse = await fetch('/api/razorpay/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });

          if (!verificationResponse.ok) {
             const errorText = await verificationResponse.text();
             console.error("Payment verification failed. Server response:", errorText);
             const errorData = JSON.parse(errorText || "{}");
             throw new Error(errorData.error || `Payment verification failed. Status: ${verificationResponse.status}`);
          }
          
          toast({ title: "Payment Successful!", description: "Verifying and saving your request..." });
          
          let uploadedResumeUrl = '';
          const resumeFiles = currentReferralData.resume; // Use currentReferralData

          if (resumeFiles instanceof FileList && resumeFiles.length === 1) {
            try {
                uploadedResumeUrl = await uploadFile(resumeFiles[0]);
            } catch (uploadError: any) {
                console.error("Error uploading resume after payment:", uploadError);
                toast({ variant: "destructive", title: "File Upload Error", description: `Your payment was successful, but resume upload failed: ${uploadError.message}. Please contact support.` });
                // Decide if you still want to save the record without resume or guide user
                // For now, we'll proceed without resume URL if upload fails post-payment
            }
          } else {
             console.warn("Resume file was not in the expected format after payment verification.");
             // Fallback, ideally caught before payment.
          }

          await addDoc(collection(db, 'referralRequests'), {
            name: currentReferralData.name,
            email: currentReferralData.email,
            targetCompany: currentReferralData.targetCompany,
            jobId: currentReferralData.jobId,
            resumeUrl: uploadedResumeUrl, // May be empty if upload failed
            paymentId: response.razorpay_payment_id,
            orderId: response.razorpay_order_id,
            paymentStatus: 'paid',
            timestamp: new Date(),
          });

          toast({ title: "Referral Submitted!", description: "Your referral request has been successfully submitted." });
          router.push('/thank-you');

        } catch (error: any) {
          console.error("Error processing payment or saving data:", error);
          toast({ variant: "destructive", title: "Processing Error", description: error.message || "Failed to process your request after payment." });
        } finally {
          setIsLoading(false);
          setPaymentInProgress(false);
        }
      },
      prefill: {
        name: referralDataOnPayment.name,
        email: referralDataOnPayment.email,
      },
      notes: {
        name: referralDataOnPayment.name,
        email: referralDataOnPayment.email,
        targetCompany: referralDataOnPayment.targetCompany,
        jobId: referralDataOnPayment.jobId,
      },
      theme: { color: "#FDB813" },
      modal: {
        ondismiss: function() {
          toast({ variant: "default", title: "Payment Cancelled", description: "Your payment was not completed." });
          setIsLoading(false);
          setPaymentInProgress(false);
          setIsEmailVerified(false); 
        }
      }
    };

    if (typeof window !== 'undefined' && (window as any).Razorpay) {
      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        toast({ variant: "destructive", title: "Payment Failed", description: response.error.description || 'Payment failed.' });
        setIsLoading(false);
        setPaymentInProgress(false);
        setIsEmailVerified(false);
      });
      rzp.open();
    } else {
      toast({ variant: "destructive", title: "Error", description: "Payment gateway not loaded. Please refresh." });
      setIsLoading(false);
      setPaymentInProgress(false);
    }
  };

  const loadRazorpayScript = (callback?: () => void) => {
    if (typeof window === 'undefined') return;
    const existingScript = document.getElementById('razorpay-checkout-js');
    if (existingScript && (window as any).Razorpay) {
      callback?.();
      return;
    }
    if (existingScript) { 
        existingScript.addEventListener('load', () => {
            if ((window as any).Razorpay) callback?.();
            else {
                 toast({ variant: 'destructive', title: 'Error', description: 'Payment gateway failed to initialize. Please refresh.'});
                 setIsLoading(false); setPaymentInProgress(false);
            }
        });
        return;
    }

    const script = document.createElement('script');
    script.id = 'razorpay-checkout-js';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
        if ((window as any).Razorpay) callback?.();
        else {
            toast({ variant: 'destructive', title: 'Error', description: 'Payment gateway failed to initialize. Please refresh.'});
            setIsLoading(false); setPaymentInProgress(false);
        }
    };
    script.onerror = () => {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load payment gateway. Please check your connection and refresh.' });
      setIsLoading(false); setPaymentInProgress(false);
    };
    document.body.appendChild(script);
  };

  useEffect(() => {
    loadRazorpayScript();
  }, []);

  const getButtonAction = () => {
    if (!isOtpSent) return handleSendOtp;
    if (!isEmailVerified) return handleVerifyOtpAndProceedToPayment;
    return () => {}; 
  };

  const getButtonText = () => {
    if (isLoading && !paymentInProgress && isOtpSent && !isEmailVerified) return "Verifying OTP & Initializing Payment...";
    if (isLoading && paymentInProgress) return "Processing Payment...";
    if (isLoading) return "Processing...";
    if (!isOtpSent) return "Send OTP";
    if (!isEmailVerified) return "Verify OTP & Proceed to Pay";
    return "Payment in Progress"; 
  };
  
  const isButtonDisabled = () => {
    if (isLoading || paymentInProgress) return true;
    if (isOtpSent && !isEmailVerified && (!form.getValues("otp") || form.getValues("otp")?.length !== 6)) return true;
    return false;
  };


  return (
     <>
      <div className="container mx-auto p-4">
        <div className="max-w-lg mx-auto bg-card text-card-foreground rounded-lg shadow-lg p-8 mt-10 border border-border">
          <h1 className="text-3xl font-bold mb-6 text-center text-primary">Request a Referral</h1>
          <Form {...form}>
             <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your name" {...field} disabled={isLoading || isEmailVerified || paymentInProgress} />
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
                      <Input type="email" placeholder="Enter your email" {...field} disabled={isLoading || isOtpSent || paymentInProgress} />
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
                      <Input placeholder="Enter the company you want a referral for" {...field} disabled={isLoading || isEmailVerified || paymentInProgress} />
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
                      <Input placeholder="Enter the Job ID or Referral ID" {...field} disabled={isLoading || isEmailVerified || paymentInProgress}/>
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
                render={({ field: { onChange, value, ...rest } }) => (
                    <FormItem>
                        <FormLabel>Resume (PDF or DOCX)</FormLabel>
                        <FormControl>
                        <Input
                            type="file"
                            accept=".pdf,.docx"
                             onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                const files = e.target.files;
                                if (files) {
                                    onChange(files);
                                }
                            }}
                            {...rest}
                            disabled={isLoading || isEmailVerified || paymentInProgress}
                        />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                 )}
                />


              {isOtpSent && !isEmailVerified && (
                <FormField
                  control={form.control}
                  name="otp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>OTP (6 digits)</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter OTP" {...field} type="text" maxLength={6} disabled={isLoading || paymentInProgress}/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

               <Button
                type="button"
                onClick={getButtonAction()}
                className="w-full"
                disabled={isButtonDisabled()}
              >
                {getButtonText()}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </>
  );
};

export default RequestReferralPage;