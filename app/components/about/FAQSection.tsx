const faqs = [
  {
    question: "What if my kids forget to start Screenie?",
    answer: "Set clear rules upfront — like reduced screen time if forgotten. Once it's a habit, this rarely happens!",
  },
  {
    question: "What if they forget to stop it?",
    answer: "No problem. You can grant bonus time through the app to make up for honest mistakes.",
  },
  {
    question: "Does my child need a phone?",
    answer: "Not at all! The physical Screenie device works independently. The app is optional and for older kids.",
  },
  {
    question: "Can I set different limits for weekdays vs weekends?",
    answer: "Yes! Full flexibility for per-day settings, wake times, and bedtimes.",
  },
];

export default function FAQSection() {
  return (
    <section className="py-20 px-6 bg-base-200">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          Common Questions
        </h2>
        
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="collapse collapse-arrow bg-base-100 shadow">
              <input type="radio" name="faq-accordion" defaultChecked={index === 0} />
              <div className="collapse-title text-lg font-medium">
                {faq.question}
              </div>
              <div className="collapse-content">
                <p className="text-base-content/70">{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
