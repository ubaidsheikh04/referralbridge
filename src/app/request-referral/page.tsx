"use client";

import { useState, useEffect } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { uploadFile } from "@/services/file-upload";
// import { sendEmail } from "@/services/email"; // Email sending is mocked for OTP
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
    setIsOtpSent(true);
    // For testing, display OTP in toast as actual email sending is not fully implemented
    toast({
      title: "OTP Sent!",
      description: `For testing, your OTP is: ${otp}`,
    });
    setIsLoading(false);
  };

  const handleVerifyOtpAndProceedToPayment = async () => {
    setIsLoading(true);
    const otpValue = form.getValues("otp");

    if (otpValue === generatedOtp) {
      setIsEmailVerified(true);
      toast({
        title: "Email Verified!",
        description: "Proceeding to payment...",
      });
      // Initiate Razorpay payment
      await createRazorpayOrder();
    } else {
      form.setError("otp", { type: "manual", message: "Invalid OTP." });
      toast({
        variant: "destructive",
        title: "Error",
        description: "Invalid OTP. Please try again.",
      });
      setIsLoading(false);
    }
    // setIsLoading will be handled by createRazorpayOrder or set to false on error here
  };

 const createRazorpayOrder = async () => {
    setPaymentInProgress(true); // Indicate payment process has started
    // setIsLoading(true) should already be true or set by calling function
    const currentReferralData = form.getValues();
     if (!currentReferralData.name || !currentReferralData.email || !currentReferralData.targetCompany || !currentReferralData.jobId) {
        toast({ variant: 'destructive', title: 'Error', description: 'All fields are required before payment.' });
        setIsLoading(false);
        setPaymentInProgress(false);
        return;
    }
     const resumeFiles = form.getValues("resume");
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
        const errorData = await response.json().catch(() => ({ error: `Server error: ${response.status}` }));
        throw new Error(errorData.error || 'Failed to create Razorpay order.');
      }

      const data = await response.json();
      if (!data.orderId || !data.keyId) {
        throw new Error("Received invalid order data from server.");
      }

      handleRazorpayPayment(data.keyId, data.orderId, currentReferralData);

    } catch (error: any) {
      console.error('Error creating Razorpay order:', error);
      toast({ variant: 'destructive', title: 'Payment Error', description: error.message || 'Failed to create payment order.' });
      setIsEmailVerified(false); // Reset email verification on payment initiation error
      setIsLoading(false);
      setPaymentInProgress(false);
    }
  };

  const handleRazorpayPayment = (keyId: string, orderId: string, referralData: ReferralFormValues) => {
    const options = {
      key: keyId,
      amount: 10000, // 100 INR in paise
      currency: "INR",
      name: "ReferralBridge",
      description: "Referral Request Fee",
      order_id: orderId,
      handler: async function (response: any) {
        setIsLoading(true); // Keep loading for post-payment verification and data saving
        setPaymentInProgress(true);
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
            const errorData = await verificationResponse.json().catch(() => ({ error: 'Payment verification failed.' }));
            throw new Error(errorData.error || 'Payment verification failed.');
          }
          
          // Payment Verified, now upload resume and save data
          let uploadedResumeUrl = '';
          const resumeFiles = referralData.resume;
          if (resumeFiles instanceof FileList && resumeFiles.length === 1) {
            uploadedResumeUrl = await uploadFile(resumeFiles[0]);
          } else {
            // This case should ideally be caught before payment, but as a fallback:
            throw new Error("Resume file missing or invalid after payment.");
          }

          await addDoc(collection(db, 'referralRequests'), {
            ...referralData,
            resume: undefined, // Don't store FileList object
            resumeUrl: uploadedResumeUrl,
            paymentId: response.razorpay_payment_id,
            orderId: response.razorpay_order_id,
            paymentStatus: 'paid',
            timestamp: new Date(),
          });

          toast({ title: "Payment Successful!", description: "Your referral request has been submitted." });
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
        name: referralData.name,
        email: referralData.email,
      },
      notes: {
        ...referralData
      },
      theme: { color: "#FDB813" },
      modal: {
        ondismiss: function() {
          toast({ variant: "default", title: "Payment Cancelled", description: "Your payment was not completed." });
          setIsLoading(false);
          setPaymentInProgress(false);
          setIsEmailVerified(false); // Allow re-verification if payment is cancelled
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
    if (existingScript) { // Script tag exists but Razorpay object not yet on window
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
    return () => {}; // Payment in progress or completed
  };

  const getButtonText = () => {
    if (isLoading && !paymentInProgress && isOtpSent && !isEmailVerified) return "Verifying OTP...";
    if (isLoading && paymentInProgress) return "Processing Payment...";
    if (isLoading) return "Processing...";
    if (!isOtpSent) return "Send OTP";
    if (!isEmailVerified) return "Verify OTP & Proceed to Pay";
    return "Payment in Progress"; // Fallback, should ideally be disabled
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
                             onChange={(e) => onChange(e.target.files)}
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
