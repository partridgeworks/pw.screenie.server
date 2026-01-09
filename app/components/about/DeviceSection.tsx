import BatteryIcon from "@/app/assets/icons/battery.svg";
import TimerIcon from "@/app/assets/icons/timer.svg";
import NotificationIcon from "@/app/assets/icons/notification.svg";
import DevicePhysicalIcon from "@/app/assets/icons/device-physical.svg";
import Link from "next/link";

export default function DeviceSection() {
  return (
    <section className="py-20 px-6">
      <div className="mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Device Visual */}
          <img src="/m5@360w.png" alt="Screenie Device" className="mx-auto" />


          {/* Features */}
          <div className="space-y-8 order-1 md:order-2">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                The Screenie Device
              </h2>
              <p className="text-base-content/70">
                A portable, rechargeable timer that kids can take anywhere. No phone needed — perfect for younger children.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 rounded-lg p-2">
                  <DevicePhysicalIcon className="w-6 h-6 text-primary" />
                </div>
                <span>One-button simplicity</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 rounded-lg p-2">
                  <TimerIcon className="w-6 h-6 text-primary" />
                </div>
                <span>Clear countdown display</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 rounded-lg p-2">
                  <NotificationIcon className="w-6 h-6 text-primary" />
                </div>
                <span>Loud beep when time&apos;s up</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 rounded-lg p-2">
                  <BatteryIcon className="w-6 h-6 text-primary" />
                </div>
                <span>3-day battery, USB-C charging</span>
              </div>
            </div>
          </div>


        </div>


        <div className="flex justify-center mt-16">
          <Link href="/get-device" className="btn btn-secondary btn-lg">Get a device</Link>
        </div>

      </div>


    </section>
  );
}
