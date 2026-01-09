export default function WhatIsSection() {
  return (
    <section className="py-20 px-6 bg-base-200">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
          What is Screenie?
        </h2>
        <p className="text-center text-base-content/70 max-w-2xl mx-auto mb-16">
          <strong>Screenie™</strong> is a smart timer that syncs with your family&apos;s screen time rules. Available as a parent app and a portable device for kids — no phone required.
        </p>
        
        <div className="grid md:grid-cols-1 gap-12 items-center">
          {/* Phone Mockup */}
          <img src="/Devices@390w.png" alt="Screenie Devices" className="mx-auto  " />
          {/* <div className="flex justify-center">
            <div className="mockup-phone border-primary scale-75 sm:scale-100">
              <div className="camera"></div>
              <div className="display">
                <div className="artboard artboard-demo phone-1 bg-base-100 flex flex-col items-center justify-center p-6">
                  <div className="text-6xl mb-4">👨‍👩‍👧‍👦</div>
                  <div className="text-lg font-semibold mb-2">Family Dashboard</div>
                  <div className="text-sm text-base-content/60 text-center">
                    Set allowances, approve requests, monitor usage
                  </div>
                </div>
              </div>
            </div>
          </div> */}

          {/* Description */}
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <span className="text-4xl">⏱️</span>
              <div>
                <h3 className="text-xl font-semibold mb-2">The smartest timer</h3>
                <p className="text-base-content/70">
                  Syncs with your weekly allowance, supports per-day settings, weekends, wake times, and bedtimes.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <span className="text-4xl">📱</span>
              <div>
                <h3 className="text-xl font-semibold mb-2">Push notifications</h3>
                <p className="text-base-content/70">
                  Kids can request extra time. You get notified instantly and approve with one tap.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <span className="text-4xl">🎮</span>
              <div>
                <h3 className="text-xl font-semibold mb-2">Works everywhere</h3>
                <p className="text-base-content/70">
                  One timer for console, laptop, tablet, or phone. No more juggling settings across devices.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
