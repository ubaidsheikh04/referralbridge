
"use client";

import { useState, useEffect } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type FieldErrors } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormItem, FormLabel, FormMessage, FormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import { auth, db } from '@/services/firebase'; // Import auth and db
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, type UserCredential } from "firebase/auth";
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";
import Link from 'next/link';
import { Combobox, type ComboboxOption } from "@/components/ui/combobox"; // Import Combobox

const formSchema = z.object({
  companyEmail: z.string().email({
    message: "Invalid company email address.",
  }).refine(email => !email.endsWith('@gmail.com') && email.includes('@'), {
    message: "Please use your company email (e.g., user@company.com, not @gmail.com).",
  }),
  personalEmail: z.string().email({
    message: "Invalid personal email address.",
  }),
  otp: z.string().length(6, { message: "OTP must be 6 digits." }).optional(),
  company: z.string().min(2, {
    message: "Company name must be at least 2 characters.",
  }),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: "You must agree to the terms and conditions to proceed."
  }),
});

type ReferrerSignupFormValues = z.infer<typeof formSchema>;

// Company suggestions list (same as in request-referral page)
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
  { value: "HCL", label: "HCL Microsoft" }, // Corrected, assuming "HCL" or "HCL Technologies"
  { value: "Microsoft", label: "Microsoft" },
  { value: "Oracle", label: "Oracle" },
  { value: "DXC", label: "DXC Technology" }, // Corrected to "DXC Technology"
  { value: "Mercedes", label: "Mercedes-Benz Group" }, // Corrected to "Mercedes-Benz Group"
  { value: "Salesforce", label: "Salesforce" },
  { value: "PwC", label: "PwC" },
];


const ReferrerSignupPage = () => {
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [otpSentToEmail, setOtpSentToEmail] = useState(''); // Stores the email OTP was sent to
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ReferrerSignupFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyEmail: "",
      personalEmail: "",
      otp: undefined,
      company: "",
      agreeToTerms: false,
    },
    reValidateMode: 'onChange',
  });

  const sendOtpEmailApi = async (email: string, otp: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: email,
          subject: 'Your OTP for Referrer Signup',
          htmlBody: `<p>Your OTP for Referrer Signup is: <strong>${otp}</strong></p>`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send OTP email');
      }
      return true;
    } catch (error: any) {
      console.error("Error sending OTP email via API:", error);
      toast({
        variant: "destructive",
        title: "Email Error",
        description: error.message || "Could not send OTP email. Please try again.",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const sendVerificationCode = async (targetEmail: string) => {
    setIsLoading(true);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(otp); // This is the OTP we'll compare against

    const emailSent = await sendOtpEmailApi(targetEmail, otp);

    if (emailSent) {
      setOtpSentToEmail(targetEmail); // Keep track of which email OTP was sent to
      setIsVerificationSent(true);
      toast({
        title: "Verification Code Sent!",
        description: `Please check your email (${targetEmail}) for the OTP.`,
      });
    }
    setIsLoading(false);
  };

  const verifyOtpAndProceed = async (values: ReferrerSignupFormValues) => {
    setIsLoading(true);
    console.log("Verifying OTP and proceeding with values:", values);

    if (!generatedOtp) {
        toast({ variant: "destructive", title: "Error", description: "OTP not generated or expired. Please request a new one." });
        setIsLoading(false);
        return;
    }
    if (!values.otp || values.otp.length !== 6) {
        form.setError("otp", { type: "manual", message: "OTP must be 6 digits." });
        toast({ variant: "destructive", title: "Error", description: "OTP must be 6 digits."});
        setIsLoading(false);
        return;
    }

    if (values.otp === generatedOtp) {
      toast({ title: "Personal Email Verified!", description: "Attempting to finalize signup..." });
      const firebaseUserEmail = values.personalEmail;
      const defaultPassword = "defaultReferrerPassword123!"; 

      let userCredential: UserCredential | null = null;
      try {
        console.log(`Attempting to sign in Firebase user: ${firebaseUserEmail}`);
        userCredential = await signInWithEmailAndPassword(auth, firebaseUserEmail, defaultPassword);
        console.log("Firebase user signed in. UID:", userCredential.user.uid);
      } catch (error: any) {
        if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
          console.log(`Firebase user not found or invalid credential for ${firebaseUserEmail}, attempting to create...`);
          try {
            userCredential = await createUserWithEmailAndPassword(auth, firebaseUserEmail, defaultPassword);
            console.log("New Firebase user created. UID:", userCredential.user.uid);
          } catch (creationError: any) {
            console.error("Error creating Firebase user:", creationError);
            toast({ variant: "destructive", title: "Signup Error", description: `Failed to create Firebase user account: ${creationError.message}` });
            setIsLoading(false);
            return;
          }
        } else {
          console.error("Error signing in Firebase user:", error);
          toast({ variant: "destructive", title: "Signup Error", description: `Firebase sign-in failed: ${error.message}` });
          setIsLoading(false);
          return;
        }
      }

      if (userCredential && userCredential.user) {
        const user = userCredential.user;
        const referrerData = {
          uid: user.uid,
          email: values.personalEmail, 
          companyRegisteredEmail: values.companyEmail, 
          company: values.company,
          isVerified: true, // Personal email is OTP verified
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp()
        };

        console.log("Firebase user available. UID:", user.uid, "Email:", user.email, "Preparing to write to Firestore 'referrers' collection.");
        console.log("Data to be written to Firestore:", referrerData);

        try {
          console.log(`Attempting to write referrer details to Firestore at referrers/${user.uid}`);
          await setDoc(doc(db, "referrers", user.uid), referrerData, { merge: true });
          console.log("Referrer details successfully written/merged to Firestore.");

          sessionStorage.setItem('company', values.company);
          sessionStorage.setItem('referrerEmail', values.personalEmail); 
          sessionStorage.setItem('referrerUid', user.uid); 
          
          toast({ title: "Signup Successful!", description: "You have successfully signed up as a referrer." });
          router.push('/dashboard');

        } catch (firestoreError: any) {
          console.error("Error writing referrer details to Firestore:", firestoreError);
          toast({ variant: "destructive", title: "Database Error", description: `Failed to save referrer profile: ${firestoreError.message}. Ensure Firestore rules allow writing to 'referrers/${user.uid}'.` });
        }
      } else {
        toast({variant: "destructive", title: "Signup Error", description: "Could not obtain Firebase user details."});
      }
    } else {
      form.setError("otp", { type: "manual", message: "Invalid OTP. Please try again." });
      toast({ variant: "destructive", title: "Error", description: "Invalid OTP. Please try again." });
    }
    setIsLoading(false);
  };

  const onSubmitHandler = async (values: ReferrerSignupFormValues) => {
    console.log("onSubmitHandler called with values:", values);
    if (!values.agreeToTerms && !isVerificationSent) { 
        form.setError("agreeToTerms", { type: "manual", message: "You must agree to the terms to proceed." });
        toast({ variant: "destructive", title: "Terms and Conditions", description: "Please agree to the terms and conditions." });
        return;
    }

    if (!isVerificationSent) {
      console.log("Calling sendVerificationCode for personal email:", values.personalEmail);
      await sendVerificationCode(values.personalEmail);
    } else {
      console.log("Calling verifyOtpAndProceed with values:", values);
      await verifyOtpAndProceed(values);
    }
  };

  const handleValidationErrors = (errors: FieldErrors<ReferrerSignupFormValues>) => {
    if (Object.keys(errors).length > 0) {
      let specificErrorHandled = false;
      if (errors.companyEmail?.message) {
        toast({ variant: "destructive", title: "Company Email Error", description: errors.companyEmail.message });
        specificErrorHandled = true;
      } else if (errors.personalEmail?.message) {
        toast({ variant: "destructive", title: "Personal Email Error", description: errors.personalEmail.message });
        specificErrorHandled = true;
      } else if (errors.company?.message) {
        toast({ variant: "destructive", title: "Company Name Error", description: errors.company.message });
        specificErrorHandled = true;
      } else if (errors.agreeToTerms?.message) {
        toast({ variant: "destructive", title: "Terms Error", description: errors.agreeToTerms.message });
        specificErrorHandled = true;
      } else if (errors.otp?.message && isVerificationSent) { // Only show OTP error toast if verification was sent
        toast({ variant: "destructive", title: "OTP Error", description: errors.otp.message });
        specificErrorHandled = true;
      }

      if (specificErrorHandled) {
        console.warn("Form validation detected and handled with a specific toast. Errors:", JSON.stringify(errors, null, 2));
      } else if (Object.keys(errors).length > 0 && !(errors.otp && !isVerificationSent) ) { 
        console.error("Unhandled Zod validation error or unexpected error structure. Errors:", JSON.stringify(errors, null, 2));
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: "Please correct the highlighted errors in the form.",
        });
      }
    } else {
      console.error("handleValidationErrors called by react-hook-form with an empty errors object. This is unexpected and may indicate an issue with form state or resolver configuration.");
      toast({
        variant: "destructive",
        title: "Form Submission Issue",
        description: "Could not process the form due to an unexpected validation state. Please try again.",
      });
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-4 text-primary">Referrer Signup</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmitHandler, handleValidationErrors)} className="space-y-4">
          <FormField
            control={form.control}
            name="companyEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter your company email (e.g., user@company.com)"
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
            name="personalEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Personal Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter your personal email (e.g., user@gmail.com)"
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
                  <Combobox
                    options={companySuggestions}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Search or type your company name"
                    searchPlaceholder="Type or Search company..."
                    emptyResultText="No company found. You can type a custom name."
                    disabled={isVerificationSent || isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {!isVerificationSent && (
            <FormField
              control={form.control}
              name="agreeToTerms"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-border p-4 shadow">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isLoading || isVerificationSent}
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
          )}
          {isVerificationSent && otpSentToEmail && ( 
            <FormField
              control={form.control}
              name="otp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>OTP (sent to {otpSentToEmail})</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter 6-digit OTP"
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
          <Button 
            type="submit" 
            disabled={
              isLoading ||
              (isVerificationSent && (!form.getValues("otp") || form.getValues("otp")?.length !== 6)) ||
              (!isVerificationSent && !form.watch("agreeToTerms"))
            }
          >
            {isLoading ? "Processing..." : (isVerificationSent ? "Verify OTP & Sign Up" : "Send OTP")}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default ReferrerSignupPage;
    

    