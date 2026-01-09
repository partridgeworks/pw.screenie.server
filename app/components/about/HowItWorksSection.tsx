import CTAButton from "./CTAButton";

export default function HowItWorksSection() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-6">
          How It Works
        </h2>
        <p className="text-center text-base-content/70 max-w-2xl mx-auto mb-16">
          A simple agreement: when the screen is on, the timer runs. When time&apos;s up, they come away.
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body items-center text-center">
              <div className="bg-secondary text-secondary-content rounded-full p-6 mb-4 aspect-square w-16 h-16 items-center justify-center flex">
                <span className="text-4xl">1</span>
              </div>
              <h3 className="card-title">Set Allowances</h3>
              <p className="text-base-content/70">
                Define weekly screen time with custom rules for weekdays, weekends, and special occasions.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body items-center text-center">
              <div className="bg-secondary text-secondary-content rounded-full p-6 mb-4 aspect-square w-16 h-16 items-center justify-center flex">
                <span className="text-4xl">2</span>
              </div>
              <h3 className="card-title">Kids Time Themselves</h3>
              <p className="text-base-content/70">
                Simple push-button action. Start the timer when gaming, stop when done. That&apos;s it.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body items-center text-center">
              <div className="bg-secondary text-secondary-content rounded-full p-6 mb-4 aspect-square w-16 h-16 items-center justify-center flex">
                <span className="text-4xl">3</span>
              </div>
              <h3 className="card-title">Stay Connected</h3>
              <p className="text-base-content/70">
                Get notifications for time requests. Grant bonus time or check usage from anywhere.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <CTAButton />
        </div>
      </div>
    </section>
  );
}
