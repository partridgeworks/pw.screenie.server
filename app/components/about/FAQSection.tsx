import ReactMarkdown from "react-markdown";
const faqs = [
  {
    question: "How do a get a Screenie device?",
    answer: `At the moment, the only way to get a Screenie is to buy an m5stick2 device and then copy the screenie firmware onto it. Full instructions are on the Screenie device blog [here](https://partridge.works/screenie-project-part-4-its-alive/).

We are considering making a small batch of pre-flashed devices available for purchase in the future, but have no firm plans yet. If you'd be interested in buying one, please register your interest [here](https://forms.gle/11YPPzRYxNBGK4we7).`,
  },
  {
    question: "Where did the Screenie project come from? Who built it?",
    answer: `Screenie was a holiday project by [Carl Partridge](https://partridge.works), a software engineer and dad of two based in the UK. Frustrated by the lack of good options for managing his kids' screen time, he decided to build his own solution using affordable hardware and open-source software. You can read more about the origins of Screenie on [his blog](https://partridge.works/screenie-christmas-project-2025-26/).`,
  },
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
    {
    question: "Can I build X for Screenie? Is there an API?",
    answer: `Absolutely - there is a full [developer API](https://screenie.org/developers) and you can build your own smartphone or smartwatch app, local e-ink display of screentime, whatwever your imagination can come up with!
    
Let us know what you have built and we'd be happy to feature it on the site.`,
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
                <div className="text-base-content/70">
                  <ReactMarkdown
                    components={{
                      a: ({ node, ...props }) => (
                        <a {...props} className="link link-primary" target="_blank" rel="noopener noreferrer" />
                      ),
                      p: ({ node, ...props }) => (
                        <p {...props} className="mb-4 last:mb-0" />
                      ),
                    }}
                  >
                    {faq.answer}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
