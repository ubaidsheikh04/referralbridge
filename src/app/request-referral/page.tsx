
"use client";

import { useState, useEffect, ChangeEvent } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { toast } from "@/hooks/use-toast";
import { uploadFile } from "@/services/file-upload";
import { addDoc, collection, serverTimestamp, getDocs, query, where } from "firebase/firestore";
import { db } from "@/services/firebase";
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import ReferralRequestTile from '@/components/ReferralRequestTile';
import Link from 'next/link';

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  targetCompany: z.string().min(1, { message: "Target company cannot be empty." }),
  jobId: z.string().min(1, { message: "Job ID/Referral ID cannot be empty." }).describe("Check details in job openings"),
  currentCompany: z.string().min(1, { message: "Current company, 'Fresher', or 'N/A' is required." }),
  resume: z.any().refine(
    (files) => typeof window === 'undefined' || (files instanceof FileList && files?.length === 1 && ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(files[0].type)),
    "Resume (PDF or DOCX) is required."
  ),
  otp: z.string().length(6, { message: "OTP must be 6 digits." }).optional(),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: "You must agree to the terms and conditions to proceed."
  }),
});

type ReferralFormValues = z.infer<typeof formSchema>;

interface ReferralRequestData {
  id: string;
  name: string;
  email: string;
  targetCompany: string;
  jobId: string;
  currentCompany: string;
  resumeUrl?: string;
  status?: 'pending' | 'referred' | 'rejected';
  paymentStatus?: string;
  viewCount?: number;
}

type PageView = 'form' | 'emailPrompt' | 'requestsDisplay';

const companySuggestions: ComboboxOption[] = [
  { value: "Accenture", label: "Accenture" },
  { value: "Tata Consultancy Services (TCS)", label: "Tata Consultancy Services (TCS)" },
  { value: "Infosys", label: "Infosys" },
  { value: "Capgemini", label: "Capgemini" },
  { value: "Wipro", label: "Wipro" },
  { value: "Cognizant", label: "Cognizant" },
  { value: "Tech Mahindra", label: "Tech Mahindra" },
  { value: "Amdocs", label: "Amdocs" },
  { value: "Nice", label: "Nice" },
  { value: "Fujitsu", label: "Fujitsu" },
  { value: "Deloitte", label: "Deloitte" },
  { value: "HCL", label: "HCL Microsoft" },
  { value: "Microsoft", label: "Microsoft" },
  { value: "Oracle", label: "Oracle" },
  { value: "DXC", label: "DXC Technology" },
  { value: "Mercedes", label: "Mercedes-Benz Group" },
  { value: "Salesforce", label: "Salesforce" },
  { value: "PwC", label: "PwC" },
];


const RequestReferralPage = () => {
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentInProgress, setPaymentInProgress] = useState(false);
  const [currentReferralData, setCurrentReferralData] = useState<ReferralFormValues | null>(null);
  const router = useRouter();

  const [currentView, setCurrentView] = useState<PageView>('form');
  const [myRequestsLookupEmail, setMyRequestsLookupEmail] = useState('');
  const [myFetchedRequests, setMyFetchedRequests] = useState<ReferralRequestData[]>([]);
  const [isLoadingMyRequests, setIsLoadingMyRequests] = useState(false);

  const form = useForm<ReferralFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      targetCompany: "",
      jobId: "",
      currentCompany: "",
      resume: undefined,
      otp: "",
      agreeToTerms: false,
    },
  });

  const sendOtpEmailApi = async (email: string, otp: string, subject?: string, htmlBody?: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: email,
          subject: subject || 'Your OTP for ReferralBridge',
          htmlBody: htmlBody || `<p>Your OTP for ReferralBridge is: <strong>${otp}</strong></p><p>This OTP is valid for 10 minutes.</p>`
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.error("sendOtpEmailApi failed with:", errorData);
        throw new Error(errorData.error || 'Failed to send OTP email');
      }
      return true;
    } catch (error: any) {
      console.error("Error sending OTP/email via API:", error);
      toast({ variant: "destructive", title: "Email API Error", description: error.message || "Could not send email. Please try again." });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async () => {
    setIsLoading(true);
    const preOtpFieldsValid = await form.trigger(["name", "email", "targetCompany", "jobId", "currentCompany", "resume", "agreeToTerms"]);

    if (!preOtpFieldsValid) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill in all required fields and agree to the terms before sending an OTP.",
      });
      setIsLoading(false);
      return;
    }

    const email = form.getValues("email");
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(otp);

    const emailSent = await sendOtpEmailApi(email, otp);

    if (emailSent) {
      setIsOtpSent(true);
      toast({ title: "OTP Sent!", description: "Please check your email for the OTP." });
    }
    setIsLoading(false);
  };


  const handleVerifyOtpAndProceedToPayment = async () => {
    setIsLoading(true);
    const otpValue = form.getValues("otp");
    const formData = form.getValues();

    if (!generatedOtp) {
      toast({ variant: "destructive", title: "Error", description: "OTP not generated. Please request OTP first." });
      setIsLoading(false);
      return;
    }

    const { name, email, targetCompany, jobId, currentCompany, resume, agreeToTerms } = formData;
    if (!name || !email || !targetCompany || !jobId || !currentCompany || !(resume instanceof FileList && resume.length > 0) || !agreeToTerms) {
      toast({ variant: "destructive", title: "Missing Information", description: "Please ensure all form fields are filled and terms are agreed to before proceeding." });
      form.trigger(["name", "email", "targetCompany", "jobId", "currentCompany", "resume", "agreeToTerms"]);
      setIsLoading(false);
      return;
    }

    setCurrentReferralData(formData); // Set currentReferralData before initiating payment

    if (otpValue === generatedOtp) {
      setIsEmailVerified(true);
      toast({ title: "Email Verified!", description: "Proceeding to payment..." });
      await createRazorpayOrder(formData);
    } else {
      form.setError("otp", { type: "manual", message: "Invalid OTP." });
      toast({ variant: "destructive", title: "Error", description: "Invalid OTP. Please try again." });
      setIsLoading(false);
    }
  };

  const createRazorpayOrder = async (referralDataForOrder: ReferralFormValues) => {
    setPaymentInProgress(true);
    setIsLoading(true);

    if (!referralDataForOrder.name || !referralDataForOrder.email || !referralDataForOrder.targetCompany || !referralDataForOrder.jobId || !referralDataForOrder.currentCompany || !referralDataForOrder.agreeToTerms) {
      toast({ variant: 'destructive', title: 'Error', description: 'All fields and terms agreement are required before payment.' });
      setIsLoading(false);
      setPaymentInProgress(false);
      return;
    }
    const resumeFiles = referralDataForOrder.resume;
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
        body: JSON.stringify({ amount: 9900 }), // Rs. 100 (10000 paise)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error creating Razorpay order. Server response:", errorText);
        let errorData = { error: `Failed to create Razorpay order. Status: ${response.status}` };
        try { errorData = JSON.parse(errorText || "{}"); } catch (parseError) { console.warn("Could not parse error response from create-order as JSON", parseError); }
        throw new Error(errorData.error || `Failed to create Razorpay order. Status: ${response.status}`);
      }

      const data = await response.json();
      if (!data.orderId || !data.keyId) {
        throw new Error("Received invalid order data from server.");
      }
      handleRazorpayPayment(data.keyId, data.orderId, referralDataForOrder); // Pass referralDataForOrder
    } catch (error: any) {
      console.error('Error creating Razorpay order:', error);
      toast({ variant: 'destructive', title: 'Payment Error', description: error.message || 'Failed to create payment order.' });
      setIsEmailVerified(false); // Reset email verification on payment error
      setIsLoading(false);
      setPaymentInProgress(false);
    }
  };

  const handleRazorpayPayment = (keyId: string, orderId: string, referralDataOnPayment: ReferralFormValues | null) => {
     if (!referralDataOnPayment) { // Use the parameter directly
      console.error("Referral data (referralDataOnPayment parameter) is null in handlePayment at the start of Razorpay options");
      toast({ variant: "destructive", title: "Error", description: "Critical: Form data is missing. Cannot proceed with payment." });
      setIsLoading(false);
      setPaymentInProgress(false);
      return;
    }

    const options = {
      key: keyId,
      amount: 10000, // Rs. 100 (10000 paise)
      currency: "INR",
      name: "ReferralBridge",
      description: "Referral Request Fee",
      order_id: orderId,
      handler: async function (response: any) {
        // This function is called when payment is successful
        if (!referralDataOnPayment) { // Double check, though it should be set
          console.error("Critical: referralDataOnPayment is null in payment handler callback.");
          toast({ variant: "destructive", title: "Error", description: "Session data lost. Cannot save referral." });
          setIsLoading(false);
          setPaymentInProgress(false);
          return;
        }

        try {
          // Verify payment signature on your backend
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
            let errorData = { error: `Payment verification failed. Status: ${verificationResponse.status}` };
            try { errorData = JSON.parse(errorText || "{}"); } catch (parseError) { console.warn("Could not parse error response from verify-payment as JSON", parseError); }
            throw new Error(errorData.error || `Payment verification failed. Status: ${verificationResponse.status}`);
          }

          toast({ title: "Payment Successful!", description: "Verifying and saving your request..." });

          let uploadedResumeUrl = '';
          const resumeFiles = referralDataOnPayment.resume;
          if (resumeFiles instanceof FileList && resumeFiles.length === 1) {
            try {
              uploadedResumeUrl = await uploadFile(resumeFiles[0]);
            } catch (uploadError: any) {
              console.error("Error uploading resume after payment:", uploadError);
              toast({ variant: "destructive", title: "File Upload Error", description: `Your payment was successful, but resume upload failed: ${uploadError.message}. Please contact support.` });
              // Still proceed to save other data even if resume upload fails here, as payment is done.
            }
          } else {
            console.warn("Resume file was not in the expected format after payment verification.");
          }

          // Save referral request to Firestore
          if (referralDataOnPayment.name && referralDataOnPayment.email && referralDataOnPayment.targetCompany && referralDataOnPayment.jobId && referralDataOnPayment.currentCompany) {
            await addDoc(collection(db, 'referralRequests'), {
              name: referralDataOnPayment.name,
              email: referralDataOnPayment.email,
              targetCompany: referralDataOnPayment.targetCompany,
              jobId: referralDataOnPayment.jobId,
              currentCompany: referralDataOnPayment.currentCompany,
              resumeUrl: uploadedResumeUrl,
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              paymentStatus: 'paid',
              status: 'pending', // Initial status for a new paid request
              timestamp: serverTimestamp(),
              viewCount: 0, // Initialize viewCount
            });

            // Send submission confirmation email
            try {
              const subject = `Your Referral Request for ${referralDataOnPayment.jobId} has been submitted!`;
              const htmlBody = `
                Hello ${referralDataOnPayment.name},<br><br>
                Your referral request for Job ID: <strong>${referralDataOnPayment.jobId}</strong> at <strong>${referralDataOnPayment.targetCompany}</strong> has been successfully submitted.<br><br>
                Thank you for choosing ReferralBridge! You will be notified of any actions taken on your resume.<br><br>
                Best regards,<br>
                The ReferralBridge Team
              `;
              await sendOtpEmailApi(referralDataOnPayment.email, '', subject, htmlBody); // OTP is empty as it's not an OTP email
              console.log(`Submission confirmation email sent to ${referralDataOnPayment.email}`);
            } catch (emailError: any) {
              console.error("Failed to send submission confirmation email:", emailError.message);
              // Don't let email failure block the thank you page, but log it.
            }

            toast({ title: "Referral Submitted!", description: "Your referral request has been successfully submitted." });
            sessionStorage.setItem('candidateViewEmail', referralDataOnPayment.email); // Store email for "My Requests"
            router.push('/thank-you');
          } else {
            // This case should ideally not be reached if form validation is robust
            toast({ variant: "destructive", title: "Data Error", description: "Key form data was missing after payment. Request not saved. Please contact support." });
          }
        } catch (error: any) {
          console.error("Error processing payment or saving data:", error);
          toast({ variant: "destructive", title: "Processing Error", description: error.message || "Failed to process your request after payment. Please contact support." });
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
        currentCompany: referralDataOnPayment.currentCompany,
      },
      theme: {
        color: "#FDB813" // ReferralBridge accent color
      },
      modal: {
        ondismiss: function () {
          toast({ variant: "default", title: "Payment Cancelled", description: "Your payment was not completed." });
          setIsLoading(false);
          setPaymentInProgress(false);
          setIsEmailVerified(false); // Reset email verification if payment is cancelled
        }
      }
    };

    if (typeof window !== 'undefined' && (window as any).Razorpay) {
      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        toast({ variant: "destructive", title: "Payment Failed", description: response.error.description || 'Payment failed.' });
        setIsLoading(false);
        setPaymentInProgress(false);
        setIsEmailVerified(false); // Reset email verification on payment failure
      });
      rzp.open();
    } else {
      toast({ variant: "destructive", title: "Error", description: "Payment gateway not loaded. Please refresh." });
      setIsLoading(false);
      setPaymentInProgress(false);
    }
  };

  // Function to load Razorpay script
  const loadRazorpayScript = (callback?: () => void) => {
    if (typeof window === 'undefined') return; // Don't run on server

    const existingScript = document.getElementById('razorpay-checkout-js');
    if (existingScript && (window as any).Razorpay) {
      callback?.(); // If already loaded and Razorpay object exists, call callback
      return;
    }
    if (existingScript) {
      // If script tag exists but Razorpay object might not, wait for load
      existingScript.addEventListener('load', () => {
        if ((window as any).Razorpay) {
          callback?.();
        } else {
          // This case is unlikely if the script tag exists and loaded.
          toast({ variant: 'destructive', title: 'Error', description: 'Payment gateway failed to initialize after loading. Please refresh.' });
          setIsLoading(false); // Stop loading indicators
          setPaymentInProgress(false);
        }
      });
      return;
    }

    // If script tag doesn't exist, create and load it
    const script = document.createElement('script');
    script.id = 'razorpay-checkout-js';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      if ((window as any).Razorpay) {
        callback?.(); // Call callback after script loads and Razorpay object exists
      } else {
        toast({ variant: 'destructive', title: 'Error', description: 'Payment gateway failed to initialize. Please refresh.' });
        setIsLoading(false); // Stop loading indicators
        setPaymentInProgress(false);
      }
    };
    script.onerror = () => {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load payment gateway. Please check your connection and refresh.' });
      setIsLoading(false); // Stop loading indicators
      setPaymentInProgress(false);
    };
    document.body.appendChild(script);
  };


  useEffect(() => {
    // Load Razorpay script once the component mounts.
    // No callback needed here, just ensure it's loaded for later use.
    loadRazorpayScript();

    // Attempt to get email from session for "My Requests" view
    const candidateEmailFromSession = sessionStorage.getItem('candidateViewEmail');
    if (candidateEmailFromSession) {
        setMyRequestsLookupEmail(candidateEmailFromSession);
    }
  }, []);


  const getButtonAction = () => {
    if (!isOtpSent) return handleSendOtp;
    if (!isEmailVerified) return handleVerifyOtpAndProceedToPayment;
    // If email is verified, the next action is payment, handled by handleVerifyOtpAndProceedToPayment
    // No direct button action needed here as Razorpay modal takes over.
    // The button text will be "Payment in Progress" or similar and disabled.
    return () => { }; // No-op if payment is already in progress or verified
  };

  const getButtonText = () => {
    if (isLoading && !paymentInProgress && isOtpSent && !isEmailVerified) return "Verifying OTP & Initializing Payment...";
    if (isLoading && paymentInProgress) return "Processing Payment...";
    if (isLoading) return "Processing...";
    if (!isOtpSent) return "Send OTP";
    if (!isEmailVerified) return "Verify OTP & Proceed to Pay";
    return "Payment in Progress"; // Or "Ready for Payment" / "Proceed to Payment"
  };

  const isButtonDisabled = () => {
    if (isLoading || paymentInProgress) return true; // Disable if any loading or payment is active

    // For "Send OTP" stage
    if (!isOtpSent) {
      // Disable if email is invalid or terms not agreed
      // This check could be more dynamic based on form.getFieldState("email").invalid but form.getValues is simpler here.
      if (form.getFieldState("email").invalid || !form.getValues("email") || !form.getValues("agreeToTerms")) {
        return true;
      }
      // Optionally, check other required fields too before allowing OTP send
      const { name, targetCompany, jobId, currentCompany, resume } = form.getValues();
      if (!name || !targetCompany || !jobId || !currentCompany || !resume || (resume instanceof FileList && resume.length === 0)) {
         return true; // Keep disabled if core fields aren't touched.
      }
    }
    // For "Verify OTP & Proceed to Pay" stage
    if (isOtpSent && !isEmailVerified) {
      const otpValue = form.getValues("otp");
      if (!otpValue || otpValue.length !== 6) return true; // Disable if OTP is not 6 digits

      // Also ensure all other form fields are valid before proceeding to payment
      // This re-checks all fields, useful if user changed something after OTP was sent
      const { name, email, targetCompany, jobId, currentCompany, resume, agreeToTerms } = form.getValues();
      if (!name || !email || !targetCompany || !jobId || !currentCompany || !agreeToTerms || !resume || (resume instanceof FileList && resume.length === 0)) {
        return true;
      }
    }
    return false; // Enable button if no conditions above met
  };

  const handleFetchMyRequests = async () => {
    if (!myRequestsLookupEmail || !/\S+@\S+\.\S+/.test(myRequestsLookupEmail)) {
      toast({ variant: "destructive", title: "Invalid Email", description: "Please enter a valid email address." });
      return;
    }
    setIsLoadingMyRequests(true);
    setMyFetchedRequests([]); // Clear previous results
    const referralCollectionRef = collection(db, 'referralRequests');
    // Query for requests matching the email and where paymentStatus is 'paid'
    const q = query(referralCollectionRef, where("email", "==", myRequestsLookupEmail), where("paymentStatus", "==", "paid"));
    try {
      const querySnapshot = await getDocs(q);
      const requests = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ReferralRequestData));
      setMyFetchedRequests(requests);
      setCurrentView('requestsDisplay'); // Switch to display view
      if (requests.length === 0) {
        toast({ title: "No Requests", description: "No paid referral requests found for this email." });
      }
    } catch (error) {
      console.error("Error fetching your requests:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to fetch your requests." });
    } finally {
      setIsLoadingMyRequests(false);
    }
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'emailPrompt':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-center text-primary">View Your Requests</h2>
            {/* Use basic HTML label and div, not FormItem/FormLabel from react-hook-form here */}
            <div className="space-y-2">
              <label htmlFor="lookup-email" className="block text-sm font-medium text-foreground">Your Email Address</label>
              <Input
                id="lookup-email"
                type="email"
                placeholder="Enter your email"
                value={myRequestsLookupEmail}
                onChange={(e) => setMyRequestsLookupEmail(e.target.value)}
                disabled={isLoadingMyRequests}
                className="bg-background border-border placeholder:text-muted-foreground"
              />
            </div>
            <Button onClick={handleFetchMyRequests} disabled={isLoadingMyRequests || !myRequestsLookupEmail} className="w-full">
              {isLoadingMyRequests ? "Fetching..." : "Fetch My Requests"}
            </Button>
            <Button variant="outline" onClick={() => setCurrentView('form')} className="w-full">
              Back to New Request Form
            </Button>
          </div>
        );
      case 'requestsDisplay':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-center text-primary">Your Submitted Requests</h2>
            {isLoadingMyRequests && <p className="text-center text-foreground">Loading requests...</p>}
            {!isLoadingMyRequests && myFetchedRequests.length === 0 && (
              <p className="text-center text-muted-foreground">No paid referral requests found for {myRequestsLookupEmail}.</p>
            )}
            {!isLoadingMyRequests && myFetchedRequests.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myFetchedRequests.map((request) => (
                  <ReferralRequestTile key={request.id} request={request} viewMode="candidate" />
                ))}
              </div>
            )}
            <Button variant="outline" onClick={() => { setCurrentView('emailPrompt'); setMyFetchedRequests([]); }} className="w-full">
              Check Different Email
            </Button>
            <Button variant="outline" onClick={() => setCurrentView('form')} className="w-full mt-2">
              Back to New Request Form
            </Button>
          </div>
        );
      case 'form':
      default:
        return (
          <>
            <div className="flex justify-end mb-4">
              <Button variant="link" onClick={() => setCurrentView('emailPrompt')} className="text-primary">
                View My Requests
              </Button>
            </div>
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
                        <Combobox
                          options={companySuggestions}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Search or type your target company name"
                          searchPlaceholder="Type or Search company..."
                          emptyResultText="No company found. You can type a custom name."
                          disabled={isLoading || isEmailVerified || paymentInProgress}
                        />
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
                        <Input placeholder="Enter the Job ID or Referral ID" {...field} disabled={isLoading || isEmailVerified || paymentInProgress} />
                      </FormControl>
                      <FormDescription>Please check the company's job openings page for the correct ID.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="currentCompany"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Company (or 'Fresher'/'N/A')</FormLabel>
                      <FormControl>
                        <Input placeholder="Your current company, or 'Fresher', 'N/A'" {...field} disabled={isLoading || isEmailVerified || paymentInProgress} />
                      </FormControl>    
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="resume"
                  render={({ field: { onChange, value, ...rest } }) => ( // Ensure correct handling of file input
                    <FormItem>
                      <FormLabel>Resume (PDF or DOCX)</FormLabel>
                      <FormControl>
                        <Input type="file" accept=".pdf,.docx" onChange={(e: ChangeEvent<HTMLInputElement>) => { const files = e.target.files; if (files) { onChange(files); } }} {...rest} disabled={isLoading || isEmailVerified || paymentInProgress} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="agreeToTerms"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-border p-4 shadow">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isLoading || isEmailVerified || paymentInProgress}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          I agree to the{' '}
                          <Link href="/policy" target="_blank" rel="noopener noreferrer" className="underline text-primary hover:text-primary/80 cursor-pointer">
                               Terms and Conditions
                          </Link>
                        </FormLabel>
                        <FormMessage />
                      </div>
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
                          <Input placeholder="Enter OTP" {...field} type="text" maxLength={6} disabled={isLoading || paymentInProgress} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                {/* Pricing Information Display */}
                {!paymentInProgress && (
                  <div className="text-center my-4 p-3 bg-secondary/30 rounded-md border border-border">
                    <p className="text-sm text-muted-foreground mb-1">Platform Fee:</p>
                    <p className="text-2xl font-bold text-primary">
                      ₹99
                      <s className="text-base font-normal text-muted-foreground ml-2">₹499</s>
                    </p>
                    <p className="text-xs text-accent mt-1">Limited time offer!</p>
                  </div>
                )}

                <Button type="button" onClick={getButtonAction()} className="w-full" disabled={isButtonDisabled()}>
                  {getButtonText()}
                </Button>
              </form>
            </Form>
          </>
        );
    }
  };

  return (
    <>
      {/* Ensure Razorpay script is loaded via next/script for proper handling */}
      <Script id="razorpay-checkout-js-loader" src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" onLoad={() => console.log("Razorpay script loaded via next/script.")} />
      <div className="container mx-auto p-4">
        <div className="max-w-lg mx-auto bg-card text-card-foreground rounded-lg shadow-lg p-8 mt-10 border border-border">
          {renderCurrentView()}
        </div>
      </div>
    </>
  );
};

export default RequestReferralPage;

    