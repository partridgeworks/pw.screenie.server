import TrustIcon from "@/app/assets/icons/trust.svg";
import DevicesIcon from "@/app/assets/icons/devices.svg";
import NoPhoneIcon from "@/app/assets/icons/no-phone.svg";
import HeartIcon from "@/app/assets/icons/heart.svg";
import CheckCircleIcon from "@/app/assets/icons/check-circle.svg";
import FamilyIcon from "@/app/assets/icons/family.svg";

const benefits = [
  {
    icon: TrustIcon,
    title: "Trust, Not Enforcement",
    description: "Kids take ownership of their time. Build responsibility instead of resentment.",
  },
  {
    icon: DevicesIcon,
    title: "All Devices, One Timer",
    description: "Console, tablet, phone, laptop — one unified allowance. No more device-hopping loopholes.",
  },
  {
    icon: NoPhoneIcon,
    title: "No Phone Required",
    description: "Perfect for younger kids. The physical Screenie device works without needing a smartphone.",
  },
  {
    icon: HeartIcon,
    title: "Better Wellbeing",
    description: "Less screen time means better sleep, focus, and mental health for growing minds.",
  },
  {
    icon: CheckCircleIcon,
    title: "No App Whitelisting",
    description: "Stop fiddling with settings to exclude educational apps. You trust the kids.",
  },
  {
    icon: FamilyIcon,
    title: "Parent Visibility",
    description: "See when the timer runs. Add bonus time. Set minimum session lengths if needed.",
  },
];

export default function BenefitsSection() {
  return (
    <section className="py-20 px-6 bg-base-200">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
          Why Screenie?
        </h2>
        <p className="text-center text-base-content/70 max-w-2xl mx-auto mb-16">
          Screenie focuses on measurement, not enforcement. Empower kids while keeping you in control.
        </p>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="bg-primary/10 rounded-xl p-3">
                  <benefit.icon className="w-8 h-8 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">{benefit.title}</h3>
                <p className="text-base-content/70 text-sm">{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
