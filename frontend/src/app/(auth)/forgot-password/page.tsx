import Link from "next/link";

import { buttonVariants } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";

export default function ForgotPasswordPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Forgot password</CardTitle>
        <CardDescription>Contact your administrator to reset access for your IMS account.</CardDescription>
      </CardHeader>
      <CardContent>
        <Link className={buttonVariants({ variant: "outline" })} href="/login">
          Back to login
        </Link>
      </CardContent>
    </Card>
  );
}
