import { Suspense } from "react";
import PairingForm from "./components/PairingForm";

interface PageProps {
  params: Promise<{ pairingCode: string }>;
  searchParams: Promise<{ deviceName?: string }>;
}

export default async function PairingPage({ params, searchParams }: PageProps) {
  const { pairingCode } = await params;
  const { deviceName = "device" } = await searchParams;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Device Pairing</h1>
          <p className="text-base-content/70">
            Pairing code: <code className="bg-base-200 px-2 py-1 rounded font-mono">{pairingCode}</code>
          </p>
        </div>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <Suspense
              fallback={
                <div className="flex flex-col items-center justify-center min-h-[50vh]">
                  <div className="loading loading-spinner loading-lg mb-4"></div>
                  <p className="text-lg">Loading...</p>
                </div>
              }
            >
              <PairingForm pairingCode={pairingCode} deviceName={deviceName} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
