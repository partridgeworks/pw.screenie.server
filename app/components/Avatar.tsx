"use client";

import Image from "next/image";

type AvatarSize = "medium" | "large";

interface AvatarProps {
  name: string;
  avatarName?: string;
  size: AvatarSize;
  className?: string;
}

const sizeConfig = {
  medium: {
    container: "w-10 h-10",
    image: 40,
    text: "text-lg",
  },
  large: {
    container: "w-16 h-16",
    image: 64,
    text: "text-2xl",
  },
} as const;

function getInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}

export default function Avatar({ name, avatarName, size, className = "" }: AvatarProps) {
  const config = sizeConfig[size];

  if (avatarName) {
    return (
      <div className={`avatar ${className}`}>
        <div className={`${config.container} rounded-full`}>
          <Image
            src={`/avatars/${avatarName}`}
            alt={`${name}'s avatar`}
            width={config.image}
            height={config.image}
            className="rounded-full"
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`avatar avatar-placeholder ${className}`}>
      <div className={`bg-primary text-primary-content ${config.container} rounded-full`}>
        <span className={config.text}>{getInitial(name)}</span>
      </div>
    </div>
  );
}
