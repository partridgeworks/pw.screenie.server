"use client";

import Link from "next/link";
import NotificationSettings from "@/app/components/NotificationSettings";

export default function AdminPage() {
  const cards = [
    {
      title: "API Key Management",
      description: "Generate and manage API keys for programmatic access",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
      ),
      href: "/home/settings/apikey"
    },
    {
      title: "Pair Device",
      description: "Connect a new device to your family",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      href: "/home/pair"
    }
  ];

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      {/* Notification Settings Card */}
      <div className="mb-8 max-w-xl">
        <NotificationSettings />
      </div>

      <h2 className="text-xl font-semibold mb-4">Other Settings</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => (
          <Link 
            key={card.href}
            href={card.href}
            className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow duration-200 hover:scale-[1.02] cursor-pointer"
          >
            <div className="card-body">
              <h2 className="card-title mb-4">{card.title}</h2>
              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0" style={{ color: 'var(--primary)' }}>
                  {card.icon}
                </div>
                <p className="text-base-content/70">{card.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
