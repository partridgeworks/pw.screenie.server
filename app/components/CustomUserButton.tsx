"use client";

import { UserButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import SettingsIcon from "@/app/assets/icons/cog.svg";

export default function CustomUserButton() {
  const router = useRouter();

  return (
    <UserButton>
      <UserButton.MenuItems>
        <UserButton.Action 
          label="Settings" 
          labelIcon={<SettingsIcon className="w-4 h-4" aria-hidden="true" focusable="false" />} 
          onClick={() => router.push("/home/settings")} 
        />
      </UserButton.MenuItems>
    </UserButton>
  );
}
