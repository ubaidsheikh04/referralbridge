

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
import { sendEmail } from "@/services/email";
import { addDoc, collection, getFirestore } from "firebase/firestore";
import { firebaseApp } from "@/services/firebase"; // Corrected import
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import Razorpay from 'razorpay'; // Import Razorpay type if needed, or use any


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
  const [referralData, setReferralData] = useState<z.infer<typeof formSchema> | null>(null); // Store form data temporarily


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
      setReferralData(form.getValues()); // Store form data before payment attempt
      toast({
        title: "Email Verified!",
        description: "Proceeding to payment...",
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
    const currentReferralData = form.getValues(); // Get current form values
    if (!currentReferralData.name || !currentReferralData.email) {
         toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Name and email are required to proceed with payment.',
        });
        return;
    }
    setReferralData(currentReferralData); // Store the latest data

    try {
      const response = await fetch('/api/razorpay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount: 10000 }), // amount in paise (100 INR)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create Razorpay order');
      }

      const data = await response.json();
       console.log("Razorpay Order Created:", data); // Debug log
      setOrderId(data.orderId);
      setRazorpayKey(data.keyId);

       // Ensure Razorpay script is loaded before initiating payment
       if (typeof window !== 'undefined' && (window as any).Razorpay) {
           handlePayment(data.keyId, data.orderId);
       } else {
           console.error("Razorpay script not loaded yet.");
           // Attempt to load script again or inform user
           loadRazorpayScript(() => handlePayment(data.keyId, data.orderId));
           toast({
               variant: 'default', // Use default variant for info
               title: 'Initializing Payment',
               description: 'Payment gateway is loading. Please wait...',
           });
       }


    } catch (error: any) {
      console.error('Error creating Razorpay order:', error);
      toast({
        variant: 'destructive',
        title: 'Payment Error',
        description: error.message || 'Failed to create payment order. Please try again.',
      });
    }
  };


 // Function to handle the payment process
  const handlePayment = (keyId: string, orderId: string) => {
     console.log("Initiating Payment with Key:", keyId, "Order ID:", orderId); // Debug log
     // Ensure referralData is populated before proceeding
     const currentReferralData = referralData || form.getValues(); // Use stored or current form values
     if (!currentReferralData) {
        console.error("Referral data is null in handlePayment");
         toast({
            variant: "destructive",
            title: "Error",
            description: "Form data is missing. Cannot proceed with payment.",
        });
        return;
     }

     // Ensure resume file is available
     if (!currentReferralData.resume || currentReferralData.resume.length === 0) {
          console.error("Resume file is missing in handlePayment");
           toast({
               variant: "destructive",
               title: "Error",
               description: "Resume file is required. Please upload your resume.",
           });
           // Optionally reset state to allow re-upload/retry
           setIsVerified(false);
           setReferralData(null);
           return;
     }

    const options = {
      key: keyId,
      amount: 10000, // amount in paise
      currency: "INR",
      name: "ReferralBridge",
      description: "Referral Request Fee",
      order_id: orderId,
      handler: async function (response: any) {
         console.log("Payment Response:", response); // Debug log
        // Payment successful, now save data to Firestore
        try {
          // Use the referralData captured *before* initiating payment
           if (currentReferralData && currentReferralData.resume && currentReferralData.resume.length > 0) {
            const resumeFile = currentReferralData.resume[0];
             console.log("Uploading resume:", resumeFile.name); // Debug log
            const uploadedResumeUrl = await uploadFile(resumeFile);
            console.log("Resume Uploaded:", uploadedResumeUrl); // Debug log
             setResumeUrl(uploadedResumeUrl); // Update state if needed elsewhere

            const db = getFirestore(firebaseApp);
            const referralCollection = collection(db, 'referralRequests');
             console.log("Saving to Firestore:", currentReferralData); // Debug log
            await addDoc(referralCollection, {
              name: currentReferralData.name,
              email: currentReferralData.email,
              targetCompany: currentReferralData.targetCompany,
              jobId: currentReferralData.jobId,
              resumeUrl: uploadedResumeUrl,
              paymentId: response.razorpay_payment_id, // Store payment ID
              orderId: response.razorpay_order_id,
              paymentSignature: response.razorpay_signature,
              paymentStatus: 'paid', // Mark as paid
              timestamp: new Date() // Add timestamp
            });
             console.log("Firestore save successful"); // Debug log

             toast({
              title: "Payment Successful!",
              description: "Your referral request has been submitted.",
            });
             // Add a small delay before redirecting to ensure toast is seen
            setTimeout(() => {
              router.push('/thank-you');
            }, 500); // 500ms delay

          } else {
             console.error("Referral data or resume file not found after payment confirmation.");
             throw new Error("Referral data or resume file not found after payment.");
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
        name: currentReferralData.name,
        email: currentReferralData.email,
      },
       notes: {
           name: currentReferralData.name,
           email: currentReferralData.email,
           targetCompany: currentReferralData.targetCompany,
           jobId: currentReferralData.jobId,
       },
      theme: {
        color: "#FBBF24", // Yellow color for Razorpay theme
      },
       modal: {
           ondismiss: function() {
                console.log('Checkout form closed');
                // Handle the case where the user closes the payment modal
                 toast({
                    variant: "default",
                    title: "Payment Cancelled",
                    description: "Your payment was not completed.",
                });
                setIsVerified(false); // Reset verification status if payment is cancelled
                setReferralData(null); // Clear stored data
           }
       }
    };

    // Dynamically load the Razorpay script and open checkout
    try {
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
    } catch (e) {
         console.error("Razorpay Error:", e);
         toast({
            variant: "destructive",
            title: "Payment Error",
            description: "Could not initiate the payment gateway. Please try again.",
        });
        setIsVerified(false); // Reset verification status
        setReferralData(null);
    }
  };


  // Combined onSubmit handler for the form element
  const handleFormSubmit = async (values: z.infer<typeof formSchema>) => {
     // This function is triggered when the form is submitted via the main button
     console.log("Form submitted with values:", values);
     // Logic depends on the current state (verify email or verify OTP)
     if (!isOtpSent) {
         await handleVerifyEmail();
     } else if (!isVerified) {
         await handleVerifyOtp();
     }
     // No direct submission action here unless you change the button logic
  };


  // Helper to determine button text and action based on state
  const getButtonConfig = () => {
    if (!isOtpSent) {
      return { text: "Verify Email", action: handleVerifyEmail, type: "button" as "button" | "submit", disabled: false };
    } else if (!isVerified) {
      return { text: "Verify OTP & Proceed to Pay", action: handleVerifyOtp, type: "button" as "button" | "submit", disabled: !form.getValues("otp") || form.getValues("otp")?.length !== 6 };
    } else {
       // Once verified, the payment process is ongoing or completed
       return { text: "Processing Payment...", action: () => {}, type: "button" as "button" | "submit", disabled: true };
    }
  };

  const buttonConfig = getButtonConfig();

  const loadRazorpayScript = (callback?: () => void) => {
      const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (existingScript) {
          if ((window as any).Razorpay) {
             callback?.(); // Call callback immediately if script is loaded
          } else {
              // Wait for the script to fully load if it exists but Razorpay object isn't ready
              existingScript.addEventListener('load', () => callback?.());
          }
          return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => callback?.(); // Call callback after script loads
      script.onerror = () => {
          console.error("Failed to load Razorpay script.");
          toast({
              variant: 'destructive',
              title: 'Error',
              description: 'Payment gateway script failed to load. Please refresh and try again.',
          });
      };
      document.body.appendChild(script);
  };

  // Effect to load Razorpay script on component mount
    useEffect(() => {
        loadRazorpayScript();

        // Clean up function (optional, might interfere if script is needed later)
        // return () => {
        //     const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
        //     if (existingScript) {
        //         // Consider carefully if removing is necessary. If removed, needs re-adding on subsequent payment attempts.
        //         // document.body.removeChild(existingScript);
        //     }
        // };
    }, []);

  return (
     <>
       {/* Razorpay script is loaded via useEffect */}
      <div className="container mx-auto p-4">
        <div className="max-w-lg mx-auto bg-card text-card-foreground rounded-lg shadow-lg p-8 mt-10 border border-border">
          <h1 className="text-3xl font-bold mb-6 text-center text-primary">Request a Referral</h1>
          <Form {...form}>
             {/* Use handleFormSubmit for the form's onSubmit */}
             <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
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
                render={({ field: { onChange, value, ...rest } }) => ( // Destructure field correctly
                    <FormItem>
                        <FormLabel>Resume (PDF or DOCX)</FormLabel>
                        <FormControl>
                        <Input
                            type="file"
                            accept=".pdf,.docx"
                            onChange={(e) => {
                                console.log("File selected:", e.target.files); // Debug log
                                onChange(e.target.files); // Pass FileList to react-hook-form
                            }}
                            {...rest} // Pass other field props
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
                        <Input placeholder="Enter 6-digit OTP" {...field} type="number" maxLength={6} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

               {/* Button uses onClick for specific actions based on state */}
               <Button
                type={buttonConfig.type} // Dynamically set type based on config
                onClick={(e) => {
                     // Prevent default if it's a 'button' type triggering an action
                     if (buttonConfig.type === 'button') {
                         e.preventDefault();
                         buttonConfig.action();
                     }
                     // If type is 'submit', the form's onSubmit (handleFormSubmit) will be called
                 }}
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
