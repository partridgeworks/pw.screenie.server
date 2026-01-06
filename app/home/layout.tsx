import { getCurrentUser } from "@/lib/server/auth";
import { UserProvider } from "@/app/contexts/UserContext";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import type { user } from "@/lib/models/User";
import PushNotificationManager from "@/app/components/PushNotificationManager";
import AddToHomeScreenPrompt from "@/app/components/AddToHomeScreenPrompt";
import EnableNotificationsPrompt from "@/app/components/EnableNotificationsPrompt";

const PENDING_APPROVAL_PATH = "/home/pending-approval";

export default async function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Preload the user on the server side
  const currentUser = await getCurrentUser();

  // Serialize user for Client Component (converts ObjectId and Dates to plain values)
  const serializedUser = JSON.parse(JSON.stringify(currentUser)) as user;

  // Get the current pathname from headers
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || headersList.get("x-invoke-path") || "";

  // Redirect pending users to the pending approval page (unless they're already there)
  if (currentUser.status === "pending" && !pathname.includes(PENDING_APPROVAL_PATH)) {
    redirect(PENDING_APPROVAL_PATH);
  }

  // Redirect approved/active users away from the pending page
  if (currentUser.status === "approved" && pathname.includes(PENDING_APPROVAL_PATH)) {
    redirect("/home");
  }

  return (
    <UserProvider initialUser={serializedUser}>
      <PushNotificationManager />
      {/* <div className="p-8"> */}
        <div className="mb-8 space-y-4">
          <EnableNotificationsPrompt />
          <AddToHomeScreenPrompt />
        </div>
        {children}
      {/* </div> */}
    </UserProvider>
  );
}
