import BatteryIcon from "@/app/assets/icons/battery.svg";
import TimerIcon from "@/app/assets/icons/timer.svg";
import NotificationIcon from "@/app/assets/icons/notification.svg";
import DevicePhysicalIcon from "@/app/assets/icons/device-physical.svg";

export default function DeviceSection() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Device Visual */}
          <div className="flex justify-center order-2 md:order-1">
            <div className="relative">
              <div className="bg-linear-to-br from-primary/20 to-primary/5 rounded-3xl p-12">
                <div className="bg-base-100 rounded-2xl shadow-2xl p-8 max-w-xs">
                  <div className="bg-base-300 rounded-xl p-6 mb-4 text-center">
                    <div className="text-5xl font-mono font-bold text-primary">23:45</div>
                    <div className="text-sm text-base-content/60 mt-2">remaining today</div>
                  </div>
                  <div className="flex justify-center">
                    <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center shadow-lg">
                      <div className="w-12 h-12 bg-primary/80 rounded-full border-4 border-white/30"></div>
                    </div>
                  </div>
                  <p className="text-center text-xs text-base-content/50 mt-4">Push to start/stop</p>
                </div>
              </div>
              <div className="absolute -top-4 right-0 sm:-right-4 bg-primary text-white text-xs px-3 py-1 rounded-full">
                Physical Device
              </div>
            </div>
          </div>

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
      </div>
    </section>
  );
}
