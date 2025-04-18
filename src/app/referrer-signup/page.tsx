"use client";

import { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

const formSchema = z.object({
  email: z.string().email({
    message: "Invalid email address. Please use your company email.",
  }).refine(email => email.endsWith('@accenture.com') || email.endsWith('@tcs.com'), {
    message: "Please use your company email (@accenture.com or @tcs.com).",
  }),
});

const ReferrerSignupPage = () => {
  const [isVerificationSent, setIsVerificationSent] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    console.log(values);
    // Implement email verification logic here
    setIsVerificationSent(true);
    toast({
      title: "Verification Email Sent!",
      description: "Please check your company email to verify your account.",
    });
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
                  <Input placeholder="Enter your company email" {...field} disabled={isVerificationSent} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isVerificationSent}>
            {isVerificationSent ? "Verification Sent" : "Sign Up"}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default ReferrerSignupPage;
