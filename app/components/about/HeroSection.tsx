import CTAButton from "./CTAButton";

export default function HeroSection() {
  return (
    <section className="min-h-[80vh] flex flex-col items-center justify-center text-center px-6 py-16">
      <img src="/screenie-icon.png" alt="Screenie Logo" className="w-24 h-24 mb-6" />
      <h1 className="text-5xl md:text-7xl font-bold text-primary mb-6">
        Screenie
      </h1>
      <p className="text-xl md:text-2xl text-base-content/80 max-w-2xl mb-8">
        Simple screen time, built on trust.
      </p>
      <p className="text-lg text-base-content/60 max-w-xl mb-12">
        Help kids take charge of their screen time with a smart timer that syncs across all devices.
      </p>
      <CTAButton />
    </section>
  );
}
