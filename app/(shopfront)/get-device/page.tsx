import Link from "next/link";

export default function Page() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <img src="/m5@360w.png" alt="m5stick device" className="w-48 h-auto mb-1" />
      <h1 className="text-4xl font-bold mb-12 text-center">Get a Screenie Device</h1>
      
      <div className="flex flex-col md:flex-row gap-8 max-w-4xl w-full">
        {/* Build Your Own Option */}
        <div className="flex-1 flex flex-col items-center text-center p-8 bg-base-200 rounded-xl">
          <h2 className="text-2xl font-semibold mb-4">Build your own Screenie</h2>
          <p className="text-base-content/70 mb-6">
            Purchase an m5stick device and flash the firmware yourself. Requires low-to-medium technical knowhow and a laptop.
          </p>
          <Link
            href="https://partridge.works/screenie-project-part-4-its-alive/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-xl btn-primary"
          >
            Build Your Own
          </Link>
        </div>

        {/* Buy Pre-made Option */}
        <div className="flex-1 flex flex-col items-center text-center p-8 bg-base-200 rounded-xl">
          <h2 className="text-2xl font-semibold mb-4">Buy a pre-made Screenie</h2>
          <p className="text-base-content/70 mb-6">
            We are considering making a batch of pre-made Screenies available at a low cost, e.g. £29 GBP. Register your interest here if you&apos;d like one.
          </p>
          <Link
            href="https://forms.gle/11YPPzRYxNBGK4we7"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-xl btn-primary"
          >
            Register Interest
          </Link>
        </div>
      </div>
    </main>
  );
}