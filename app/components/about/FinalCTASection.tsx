import CTAButton from "./CTAButton";

export default function FinalCTASection() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-5xl font-bold mb-6">
          Ready to take control?
        </h2>
        <p className="text-xl text-base-content/70 mb-10 max-w-2xl mx-auto">
          Join families who&apos;ve found a better way to manage screen time — one built on trust, not conflict.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <CTAButton />
          <CTAButton variant="outline" />
        </div>
      </div>
    </section>
  );
}
