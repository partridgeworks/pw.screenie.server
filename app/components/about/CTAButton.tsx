import Link from "next/link";
import ArrowRightIcon from "@/app/assets/icons/arrow-right.svg";

interface CTAButtonProps {
  variant?: "primary" | "outline";
  size?: "default" | "large";
  className?: string;
}

export default function CTAButton({ variant = "primary", className = "", size = "default" }: CTAButtonProps) {
  const baseClasses = "btn gap-2";
  const variantClasses = variant === "primary" 
    ? "btn-primary text-white" 
    : "btn-outline border-primary text-primary hover:bg-primary hover:text-white";
  const sizeClasses = size === "large"
    ? "btn-lg"
    : "btn-md";

  return (
    <Link href="/home" className={`${baseClasses} ${variantClasses} ${sizeClasses} ${className}`}>
      Get Started
      <ArrowRightIcon className="w-5 h-5" />
    </Link>
  );
}
