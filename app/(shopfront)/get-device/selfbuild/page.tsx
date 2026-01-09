import Link from "next/link";

export default function Page() {
  return (
    <main className="min-h-screen bg-base-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <img src="/m5@360w.png" alt="M5StickC Plus2 device" className="w-48 h-auto mx-auto mb-6" />
          <h1 className="text-4xl font-bold mb-4">Build Your Own Screenie</h1>
          <p className="text-lg text-base-content/80 max-w-2xl mx-auto">
            Want to create your own Screenie device? Follow this step-by-step guide to purchase the hardware and flash it with the official Screenie firmware.
          </p>
        </div>

        {/* Step 1 */}
        <div className="card bg-base-200 shadow-xl mb-8">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-4">
              <span className="badge badge-primary badge-lg mr-3">Step 1</span>
              Get the Hardware
            </h2>
            <p className="mb-4">
              Purchase an <strong>M5StickC Plus2</strong> - a compact ESP32-based development kit that&apos;s perfect for Screenie.
            </p>
            <div className="bg-base-300 p-4 rounded-lg mb-4">
              <p className="font-semibold mb-2">Where to buy:</p>
              <a 
                href="https://shop.m5stack.com/products/m5stickc-plus2-esp32-mini-iot-development-kit" 
                target="_blank"
                rel="noopener noreferrer"
                className="link link-primary"
              >
                M5Stack Official Store
              </a>
              <p className="text-sm text-base-content/70 mt-2">Currently around £20 / $25</p>
            </div>
            <div className="alert alert-info">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span><strong>Tip:</strong> Make sure you get the Plus2 model specifically - it has the display and features needed for Screenie.</span>
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="card bg-base-200 shadow-xl mb-8">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-4">
              <span className="badge badge-primary badge-lg mr-3">Step 2</span>
              Flash the Firmware
            </h2>
            {/* <p className="mb-6">
              You have two options for installing the Screenie firmware on your device:
            </p> */}

            {/* Option A - Coming Soon */}
            {/* <div className="mb-6">
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <span className="badge badge-accent">Option A</span>
                Easy Method: M5Burner
              </h3>
              <p className="mb-3">
                The simplest way to flash Screenie firmware is using M5Burner - M5Stack&apos;s official firmware flashing tool.
              </p>
              <ol className="list-decimal list-inside space-y-2 mb-4 ml-4">
                <li>Download and install <a href="https://docs.m5stack.com/en/uiflow/m5burner/intro" target="_blank" rel="noopener noreferrer" className="link link-primary">M5Burner</a></li>
                <li>Connect your M5StickC Plus2 via USB-C cable</li>
                <li>Open M5Burner and select your device from the port dropdown</li>
                <li>Search for &quot;Screenie&quot; in the firmware list</li>
                <li>Click &quot;Burn&quot; to flash the firmware</li>
              </ol>
              <div className="alert alert-success">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span><strong>Tip:</strong> If the device isn&apos;t recognized, try unplugging and long-pressing the power button to reset, then reconnect.</span>
              </div>
              <div className="mt-3">
                <Link href="https://docs.m5stack.com/en/uiflow/m5burner/FAQ" className="link link-primary text-sm" target="_blank" rel="noopener noreferrer">
                  M5Burner FAQs and Troubleshooting →
                </Link>
              </div>
            </div>

            <div className="divider">OR</div> */}

            {/* Option B */}
            <div>
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                {/* <span className="badge badge-accent">Option B</span> */}
                Build from Source
              </h3>
              <p className="mb-3">
                Build and flash the Screenie firmware directly from the GitHub repository.
              </p>
              <div className="bg-base-300 p-4 rounded-lg mb-4">
                <p className="font-semibold mb-2">Quick steps:</p>
                <ol className="list-decimal list-inside space-y-1 ml-4">
                  <li>Clone the repository from <a href="https://github.com/partridgeworks/pw.screenie.client.m5" target="_blank" rel="noopener noreferrer" className="link link-primary">GitHub</a></li>
                  <li>Install VS Code and PlatformIO extension</li>
                  <li>Add your Wifi credentials in the configuration file</li>
                  <li>Build the firmware using PlatformIO</li>
                  <li>Flash using PlatformIO or esptool</li>
                </ol>
              </div>
              <div className="alert alert-warning">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>This method requires technical knowledge. Follow the complete instructions in the <a href="https://github.com/partridgeworks/pw.screenie.client.m5#readme" target="_blank" rel="noopener noreferrer" className="link">GitHub README</a>.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="card bg-primary text-primary-content shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-2">What&apos;s Next?</h2>
            <p className="mb-4">
              Once your device is flashed, you&apos;ll need to pair it with your Screenie account and configure WiFi settings.
            </p>
            <div className="card-actions justify-end">
              <Link href="/home/pair" className="btn btn-secondary">
                Pair Your Device
              </Link>
              <Link href="/developers" className="btn btn-ghost">
                Developer Docs
              </Link>
            </div>
          </div>
        </div>

        {/* Additional Resources */}
        <div className="mt-8 text-center">
          <h3 className="text-lg font-semibold mb-3">Additional Resources</h3>
          <div className="flex flex-wrap gap-4 justify-center">
            <a href="https://docs.m5stack.com/en/uiflow/m5burner/intro" target="_blank" rel="noopener noreferrer" className="link link-primary">
              M5Burner Download
            </a>
            <a href="https://docs.m5stack.com/en/uiflow/m5burner/FAQ" target="_blank" rel="noopener noreferrer" className="link link-primary">
              M5Burner FAQ
            </a>
            <a href="https://github.com/partridgeworks/pw.screenie.client.m5" target="_blank" rel="noopener noreferrer" className="link link-primary">
              GitHub Repository
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}