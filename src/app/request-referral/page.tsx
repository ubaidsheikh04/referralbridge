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
// import { sendEmail } from "@/services/email"; // Email sending commented out for testing
import { addDoc, collection, getFirestore } from "firebase/firestore";
import { firebaseApp } from "@/services/firebase";
import { useRouter } from 'next/navigation';
import Script from 'next/script';
// Removed unused ArrowLeft import
// import { ArrowLeft } from 'lucide-react';

// Define the Zod schema for the form
const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  targetCompany: z.string().min(2, { message: "Company name must be at least 2 characters." }),
  jobId: z.string().min(1, { message: "Job ID/Referral ID cannot be empty." }).describe("Check details in job openings"),
  resume: z.instanceof(FileList).refine(files => files?.length === 1 && files[0].size > 0, "Resume is required."),
  otp: z.string().optional(),
});

const RequestReferralPage = () => {
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false); // Track if email is verified
  const [orderId, setOrderId] = useState<string | null>(null);
  const [razorpayKey, setRazorpayKey] = useState<string | null>(null);
  const [referralData, setReferralData] = useState<z.infer<typeof formSchema> | null>(null); // Store form data temporarily
  const [isLoading, setIsLoading] = useState(false); // Loading state for async operations


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
    setIsLoading(true);
    const email = form.getValues("email");
    if (!email) {
      form.setError("email", { type: "manual", message: "Email is required to verify." });
      setIsLoading(false);
      return;
    }
    const emailError = form.getFieldState("email").error;
    if (emailError) {
        setIsLoading(false);
      return; // Don't proceed if email format is invalid
    }

    const generatedOtp = "123456"; // Use a fixed OTP for testing

    try {
       // Simulate sending email for testing
       console.log(`Simulating OTP send to ${email}. OTP: ${generatedOtp}`);
       // Uncomment the line below to enable actual email sending when service is ready
       // await sendEmail({ to: email, subject: "Referral Request OTP Verification", body: `Your OTP is: ${generatedOtp}` });

      setIsOtpSent(true);
      toast({
        title: "OTP Sent!",
        description: `Please use ${generatedOtp} as OTP`, // Show the OTP in the toast for testing
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

  // Function to handle the second step: Verifying OTP
  const handleVerifyOtp = async () => {
    setIsLoading(true);
    const otp = form.getValues("otp");
    const expectedOtp = "123456"; // The fixed OTP used for testing

    if (otp === expectedOtp) {
      setIsVerified(true); // Mark email as verified
      setReferralData(form.getValues()); // Store form data before payment attempt
      toast({
        title: "Email Verified!",
        description: "Proceeding to payment...",
      });
      // Proceed to create Razorpay order after OTP verification
      await createRazorpayOrder(); // createRazorpayOrder will handle setting loading state

    } else {
      form.setError("otp", { type: "manual", message: "Invalid OTP." });
      toast({
        variant: "destructive",
        title: "Error",
        description: "Invalid OTP. Please try again.",
      });
      setIsLoading(false); // Stop loading on OTP error
    }
  };


  // Function to create Razorpay Order
 const createRazorpayOrder = async () => {
    // isLoading should already be true from handleVerifyOtp
    const currentReferralData = form.getValues(); // Get current form values
    if (!currentReferralData.name || !currentReferralData.email) {
         toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Name and email are required to proceed with payment.',
        });
        setIsLoading(false); // Stop loading
        return;
    }
    // Ensure resume is selected
    if (!currentReferralData.resume || currentReferralData.resume.length === 0 || currentReferralData.resume[0].size === 0) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Please select a valid resume file.',
        });
        setIsLoading(false); // Stop loading
        return;
    }

    setReferralData(currentReferralData); // Store the latest data just before payment attempt

    let response; // Declare response outside try block
    try {
      console.log("Attempting to create Razorpay order...");
      response = await fetch('/api/razorpay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount: 10000 }), // amount in paise (100 INR)
      });
      console.log("Response status:", response.status);


      if (!response.ok) {
         // Read the body once here
         const responseBody = await response.text();
         let errorData = { error: `HTTP error! status: ${response.status}` };
         try {
             // Try to parse the already read body as JSON
             errorData = JSON.parse(responseBody);
             console.error("API Error Response JSON:", errorData);
         } catch (e) {
             // If parsing failed, use the text body
             console.error("API Error Response Text:", responseBody);
             errorData = { error: responseBody || `Failed to create Razorpay order. Status: ${response.status}` };
         }
         throw new Error(errorData.error);
      }

      const data = await response.json();
      console.log("Razorpay Order Created Data:", data); // Debug log
      if (!data.orderId || !data.keyId) {
        throw new Error("Received invalid order data from server.");
      }
      setOrderId(data.orderId);
      setRazorpayKey(data.keyId);

      // Ensure Razorpay script is loaded before initiating payment
      if (typeof window !== 'undefined' && (window as any).Razorpay) {
           console.log("Razorpay script loaded, initiating payment...");
           handlePayment(data.keyId, data.orderId);
           // handlePayment will set isLoading to false on completion/failure
       } else {
           console.error("Razorpay script not loaded yet. Attempting to load...");
           loadRazorpayScript(() => {
               console.log("Razorpay script loaded via callback, initiating payment...");
               handlePayment(data.keyId, data.orderId);
           });
           toast({
               variant: 'default', // Use default variant for info
               title: 'Initializing Payment',
               description: 'Payment gateway is loading. Please wait...',
           });
           // Keep isLoading true while script loads
       }

    } catch (error: any) {
      console.error('Error during createRazorpayOrder:', error);
      toast({
        variant: 'destructive',
        title: 'Payment Error',
        description: error.message || 'Failed to create payment order. Please try again.',
      });
       setIsVerified(false); // Reset verification on payment error
       setReferralData(null); // Clear stored data
       setIsLoading(false); // Stop loading on error
    }
  };


 // Function to handle the payment process
 const handlePayment = (keyId: string, orderId: string) => {
    console.log("Initiating Payment with Key:", keyId, "Order ID:", orderId);
    const currentReferralData = referralData; // Use the data stored just before createRazorpayOrder

    if (!currentReferralData) {
        console.error("Referral data is null in handlePayment");
        toast({ variant: "destructive", title: "Error", description: "Form data is missing. Cannot proceed." });
        setIsLoading(false);
        return;
    }
    if (!currentReferralData.resume || currentReferralData.resume.length === 0 || currentReferralData.resume[0].size === 0) {
        console.error("Resume file is missing in handlePayment");
        toast({ variant: "destructive", title: "Error", description: "Resume file is missing or invalid." });
        setIsLoading(false);
        return;
    }

    const options = {
        key: keyId,
        amount: 10000, // Amount in paise
        currency: "INR",
        name: "ReferralBridge",
        description: "Referral Request Fee",
        order_id: orderId,
        handler: async function (response: any) {
            console.log("Payment Success Response:", response);
            // Payment successful: Upload file and save data
            try {
                setIsLoading(true); // Start loading for post-payment processing
                const resumeFile = currentReferralData.resume![0];
                console.log("Uploading resume:", resumeFile.name);
                const uploadedResumeUrl = await uploadFile(resumeFile);
                console.log("Resume Uploaded:", uploadedResumeUrl);
                setResumeUrl(uploadedResumeUrl); // Update state if needed

                const db = getFirestore(firebaseApp);
                const referralCollection = collection(db, 'referralRequests');
                console.log("Saving paid referral to Firestore:", currentReferralData);
                await addDoc(referralCollection, {
                    name: currentReferralData.name,
                    email: currentReferralData.email,
                    targetCompany: currentReferralData.targetCompany,
                    jobId: currentReferralData.jobId,
                    resumeUrl: uploadedResumeUrl,
                    paymentId: response.razorpay_payment_id,
                    orderId: response.razorpay_order_id,
                    paymentSignature: response.razorpay_signature,
                    paymentStatus: 'paid',
                    timestamp: new Date()
                });
                console.log("Firestore save successful for paid referral.");

                toast({ title: "Payment Successful!", description: "Your referral request has been submitted." });
                setTimeout(() => { router.push('/thank-you'); }, 500);

            } catch (error) {
                console.error("Error processing successful payment:", error);
                toast({ variant: "destructive", title: "Post-Payment Error", description: "Payment successful, but failed to save request. Please contact support." });
            } finally {
                setIsLoading(false); // Stop loading after processing
            }
        },
        prefill: {
            name: currentReferralData.name,
            email: currentReferralData.email,
        },
        notes: {
            name: currentReferralData.name,
            email: currentReferralData.email,
            targetCompany: currentReferralData.targetCompany,
            jobId: currentReferralData.jobId,
        },
        theme: { color: "#008080" }, // Updated theme color to Teal
        modal: {
            ondismiss: function() {
                console.log('Checkout form closed by user.');
                toast({ variant: "default", title: "Payment Cancelled", description: "Your payment was not completed." });
                setIsVerified(false); // Reset verification status
                setReferralData(null); // Clear stored data
                setIsLoading(false); // Stop loading
            }
        }
    };

    try {
        // Ensure Razorpay object exists on window
         if (!(window as any).Razorpay) {
             console.error("Razorpay object not found on window. Cannot initiate payment.");
             toast({ variant: "destructive", title: "Error", description: "Payment gateway not loaded. Please refresh." });
             setIsLoading(false);
             return;
         }
        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', function (response: any) {
            console.error('Payment Failed:', response.error);
            toast({
                variant: "destructive",
                title: "Payment Failed",
                description: response.error.description || 'An unknown error occurred during payment.',
            });
             setIsVerified(false); // Reset verification status
             setReferralData(null); // Clear stored data
             setIsLoading(false); // Stop loading
        });
        rzp.open();
    } catch (e) {
        console.error("Error opening Razorpay checkout:", e);
        toast({ variant: "destructive", title: "Payment Error", description: "Could not initiate payment gateway. Please try again." });
        setIsVerified(false);
        setReferralData(null);
        setIsLoading(false); // Stop loading
    }
};


  // Combined onSubmit handler for the form element - This is NOT used by the buttons directly
  const handleFormSubmit = async (values: z.infer<typeof formSchema>) => {
     // This function is technically the form's onSubmit, but the buttons have their own onClick handlers.
     // You might keep this for accessibility (e.g., submitting with Enter key),
     // but the primary logic is in handleVerifyEmail and handleVerifyOtp triggered by button clicks.
     console.log("Form submitted via Enter key (potentially) with values:", values);
     // Decide action based on state if submitted this way
     if (!isOtpSent) {
         await handleVerifyEmail();
     } else if (!isVerified) {
         await handleVerifyOtp();
     }
  };


  // Helper to determine button text and action based on state
  const getButtonConfig = () => {
    if (!isOtpSent) {
      // Step 1: Verify Email
      return { text: "Verify Email", action: handleVerifyEmail, disabled: isLoading };
    } else if (!isVerified) {
      // Step 2: Verify OTP & Proceed
      return { text: "Verify OTP & Proceed to Pay", action: handleVerifyOtp, disabled: isLoading || !form.getValues("otp") || form.getValues("otp")?.length !== 6 };
    } else {
       // Step 3: Payment is in progress or completed
       return { text: "Processing Payment...", action: () => {}, disabled: true };
    }
  };

  const buttonConfig = getButtonConfig();

  const loadRazorpayScript = (callback?: () => void) => {
      const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (existingScript && (window as any).Razorpay) {
          console.log("Razorpay script already loaded.");
          callback?.();
          return;
      }
      if (existingScript) {
            console.log("Razorpay script tag exists, waiting for load...");
            existingScript.addEventListener('load', () => {
                if ((window as any).Razorpay){
                    console.log("Razorpay object now available after waiting.");
                     callback?.();
                } else {
                     console.error("Script loaded, but Razorpay object still not found.");
                     toast({ variant: 'destructive', title: 'Error', description: 'Payment gateway failed to initialize correctly. Please refresh.' });
                     setIsLoading(false); // Stop loading if script fails to initialize
                }
            });
           existingScript.addEventListener('error', () => {
                console.error("Error loading existing Razorpay script tag.");
                toast({ variant: 'destructive', title: 'Error', description: 'Payment gateway script failed to load. Please refresh.' });
                setIsLoading(false);
           });
           return; // Script tag exists, don't add another
      }


      console.log("Loading Razorpay script...");
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => {
          console.log("Razorpay script loaded successfully.");
          if ((window as any).Razorpay) {
             callback?.();
          } else {
              console.error("Script loaded, but Razorpay object not found.");
               toast({ variant: 'destructive', title: 'Error', description: 'Payment gateway failed to initialize. Please refresh.' });
               setIsLoading(false);
          }
      };
      script.onerror = () => {
          console.error("Failed to load Razorpay script.");
          toast({ variant: 'destructive', title: 'Error', description: 'Payment gateway script failed to load. Please refresh and try again.' });
          setIsLoading(false); // Stop loading on script load error
      };
      document.body.appendChild(script);
  };

  // Effect to load Razorpay script on component mount
    useEffect(() => {
        loadRazorpayScript();
        // Cleanup function is usually not needed for external scripts like this
        // unless you need to specifically remove it on unmount, which is rare.
    }, []);

  return (
     <>
       {/* Razorpay script is loaded via useEffect */}
      <div className="container mx-auto p-4">
        <div className="max-w-lg mx-auto bg-card text-card-foreground rounded-lg shadow-lg p-8 mt-10 border border-border">
          <h1 className="text-3xl font-bold mb-6 text-center text-primary">Request a Referral</h1>
          <Form {...form}>
             {/* Use handleFormSubmit for the form's onSubmit if needed for accessibility, otherwise button onClick handles logic */}
             <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your name" {...field} disabled={isLoading || isVerified} />
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
                      <Input type="email" placeholder="Enter your email" {...field} disabled={isLoading || isOtpSent} />
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
                      <Input placeholder="Enter the company you want a referral for" {...field} disabled={isLoading || isVerified} />
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
                      <Input placeholder="Enter the Job ID or Referral ID" {...field} disabled={isLoading || isVerified}/>
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
                             onChange={(e) => {
                                // React Hook Form expects the FileList object for file inputs
                                console.log("File selected RHF:", e.target.files); // Debug log
                                onChange(e.target.files); // Pass FileList to react-hook-form state
                             }}
                            {...rest} // Pass other necessary props from RHF like name, ref
                            disabled={isLoading || isVerified}
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
                        <Input placeholder="Enter 6-digit OTP" {...field} type="number" maxLength={6} disabled={isLoading}/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

               {/* Button uses onClick to trigger specific state transitions */}
               <Button
                type="button" // Use type="button" to prevent default form submission
                onClick={(e) => {
                    e.preventDefault(); // Explicitly prevent default
                    buttonConfig.action(); // Call the action determined by getButtonConfig
                }}
                className="w-full"
                disabled={buttonConfig.disabled} // Disable based on state and loading
              >
                {isLoading ? (
                     <span className="animate-pulse">Processing...</span>
                 ) : (
                    buttonConfig.text
                 )}
              </Button>

            </form>
          </Form>
        </div>
      </div>
    </>
  );
};

export default RequestReferralPage;
