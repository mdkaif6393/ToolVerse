import { SignInForm } from "@/components/auth/SignInForm";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const SignIn = () => {
  return (
    <div className="relative min-h-screen">
      {/* Back to home button */}
      <div className="absolute top-4 left-4 z-10">
        <Link to="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </Link>
      </div>
      
      <SignInForm />
    </div>
  );
};

export default SignIn;