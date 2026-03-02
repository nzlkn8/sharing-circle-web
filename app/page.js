export const metadata = {
  title: "SharingCircle — Share your finds with your people",
  description:
    "A warm, personal link sharing platform. Share links and thoughts with your inner circle via WhatsApp.",
};

const features = [
  {
    icon: "🔗",
    title: "Share links",
    desc: "Forward any URL to the bot and it lands in your circle's feed, summarized and ready to read.",
  },
  {
    icon: "✍️",
    title: "Share thoughts",
    desc: "Drop a voice note, a quick take, or a caption alongside any share — your words travel with it.",
  },
  {
    icon: "📬",
    title: "Get daily digests",
    desc: "Every day your circle receives a tidy digest of everything shared — nothing gets buried.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-cream">
      {/* Nav */}
      <nav className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-full bg-terracotta flex items-center justify-center">
            <span className="w-3 h-3 rounded-full bg-white" />
          </span>
          <span className="font-serif text-xl font-semibold text-warm-900">SharingCircle</span>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 pt-20 pb-28 text-center">
        <p className="text-xs font-semibold tracking-[0.2em] uppercase text-terracotta mb-8">
          Your personal link digest
        </p>
        <h1 className="font-serif text-5xl md:text-6xl font-bold text-warm-900 leading-[1.1] mb-7">
          Share your finds<br />with your people.
        </h1>
        <p className="text-xl text-warm-500 leading-relaxed mb-12 max-w-xl mx-auto">
          SharingCircle is a WhatsApp bot that turns the links your inner circle
          shares into a beautiful, organized feed — just for you.
        </p>
        <a
          href="https://wa.me/16472039443"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 bg-terracotta text-white font-semibold px-9 py-4 rounded-full text-lg hover:bg-terracotta-dark transition-colors shadow-sm"
        >
          <WhatsAppIcon />
          Get started on WhatsApp
        </a>
        <p className="mt-4 text-sm text-warm-400">Free to try · No account needed</p>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 pb-28">
        <div className="bg-cream-dark rounded-3xl px-8 py-12 md:px-12 md:py-14">
          <p className="text-center text-sm font-semibold tracking-[0.15em] uppercase text-warm-400 mb-10">
            How it works
          </p>
          <div className="grid md:grid-cols-3 gap-10 md:gap-8">
            {features.map((f, i) => (
              <div key={i} className="text-center md:text-left">
                <div className="text-3xl mb-4 md:text-left text-center">{f.icon}</div>
                <h3 className="font-serif text-xl font-semibold text-warm-900 mb-2">{f.title}</h3>
                <p className="text-warm-500 leading-relaxed text-[15px]">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Soft CTA repeat */}
      <section className="max-w-xl mx-auto px-6 pb-28 text-center">
        <div className="inline-block bg-white rounded-3xl px-10 py-10 shadow-sm border border-warm-100">
          <p className="font-serif text-2xl font-semibold text-warm-900 mb-3">
            Ready to start your circle?
          </p>
          <p className="text-warm-500 text-[15px] mb-7">
            Message our bot on WhatsApp and invite up to 15 people you actually talk to.
          </p>
          <a
            href="https://wa.me/16472039443"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 bg-terracotta text-white font-semibold px-7 py-3.5 rounded-full hover:bg-terracotta-dark transition-colors"
          >
            <WhatsAppIcon size={18} />
            Open WhatsApp
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-warm-100 py-8 text-center text-warm-400 text-sm">
        Made with warmth · © {new Date().getFullYear()} SharingCircle
      </footer>
    </div>
  );
}

function WhatsAppIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}
