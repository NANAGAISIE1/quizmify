"use client";
import { Button } from "./ui/button";
import { signIn } from "@/lib/auth-client";

type Props = { text: string };

const SignInButton = ({ text }: Props) => {
  return (
    <Button
      onClick={() => {
        signIn.social({ provider: "google" }).catch(console.error);
      }}
    >
      {text}
    </Button>
  );
};

export default SignInButton;
