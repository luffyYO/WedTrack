import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

const faqData = [
  {
    question: "What is Wed Tracks and how does it help couples?",
    answer: "Wed Tracks is a premium wedding management platform designed to simplify guest entry and gift tracking. By using digital QR passes, Wed Tracks ensures your special day is organized, secure, and elegantly managed, replacing traditional paper lists with digital harmony."
  },
  {
    question: "How do I create a wedding track on Wed Tracks?",
    answer: "Creating your personalized wed tracks is simple and fast. Just sign up for an account, enter your wedding details like venue and date, and your unique wedding track will be ready to use. You can then begin generating secure QR codes for all your esteemed guests instantly."
  },
  {
    question: "Are my wedding tracks and guest data secure?",
    answer: "Yes, security is a primary focus at Wed Tracks. Every wedding track is protected by unique, non-sequential IDs, and only authorized admins can access the detailed gift ledger and guest analytics. Your data is encrypted and managed with SaaS-level security protocols."
  },
  {
    question: "Can I share my Wed Tracks digital invites with guests via WhatsApp?",
    answer: "Absolutely! Once you've created your wed tracks, you can generate a personalized link or QR code for each guest. This can be easily shared via WhatsApp, SMS, or email, allowing guests to view their digital pass and event details with a single click."
  },
  {
    question: "How does the gift tracking work on Wed Tracks?",
    answer: "When guests scan their unique wed tracks QR code at the reception, they have the option to leave digital wishes and record their financial gifts. This information is instantly synchronized with your private dashboard, providing an immaculate real-time view of all contributions."
  }
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  // Structured Data for Google SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqData.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <section id="faq" className="py-24 relative z-10 bg-white/30 backdrop-blur-sm border-t border-slate-100">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <div className="container mx-auto px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-pink-100 text-pink-500 mb-6 border border-pink-200 shadow-sm">
              <HelpCircle size={24} />
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-6 text-slate-800 tracking-tight">
              Frequently Asked Questions <br />
              <span className="bg-gradient-to-r from-pink-500 to-rose-400 bg-clip-text text-transparent">about Wed Tracks</span>
            </h2>
            <p className="text-slate-500 font-medium">Everything you need to know about managing your wedding tracks.</p>
          </div>

          <div className="space-y-4">
            {faqData.map((faq, index) => (
              <div 
                key={index}
                className={`group rounded-3xl border transition-all duration-300 ${openIndex === index ? 'bg-white border-pink-200 shadow-[0_10px_30px_rgba(244,114,182,0.08)]' : 'bg-white/50 border-slate-100 hover:border-slate-200 shadow-sm'}`}
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full flex items-center justify-between p-6 sm:p-8 text-left focus:outline-none"
                  aria-expanded={openIndex === index}
                >
                  <h3 className={`text-lg font-bold transition-colors ${openIndex === index ? 'text-slate-900' : 'text-slate-700'}`}>
                    {faq.question}
                  </h3>
                  <div className={`shrink-0 ml-4 w-8 h-8 rounded-full flex items-center justify-center transition-all ${openIndex === index ? 'bg-pink-500 text-white rotate-180' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}>
                    <ChevronDown size={18} strokeWidth={3} />
                  </div>
                </button>
                
                <div 
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${openIndex === index ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0'}`}
                >
                  <div className="px-6 pb-8 sm:px-8 text-slate-500 leading-relaxed font-medium">
                    <p>{faq.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
