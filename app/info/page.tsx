export default function InfoPage() {
  return (
    <main className="min-h-screen bg-black text-white relative">
      <a
        href="/"
        className="fixed top-5 right-5 z-50 w-9 h-9 flex items-center justify-center rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors text-lg"
        aria-label="Back to Grid"
      >
        ✕
      </a>
      <div className="max-w-2xl mx-auto px-6 py-16">

        <h1 className="text-3xl font-bold mb-2">Million Dollar Grid</h1>
        <p className="text-zinc-500 text-sm mb-12">Info & Legal</p>

        {/* Personal message */}
        <section className="mb-10 bg-zinc-900 border border-zinc-700 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-amber-400 mb-1">A message from me — Twal</h2>
          <p className="text-zinc-500 text-xs mb-4">Founder of Million Dollar Grid</p>
          <p className="text-zinc-300 leading-relaxed">
            Hey, I'm Twal — the person behind this project. I built Million Dollar Grid to challenge
            myself and gain real experience in web development and online business. I learn something
            new every day.
          </p>
          <p className="text-zinc-300 leading-relaxed mt-3">
            At the same time, I hope this project can help me earn a little something for my family.
            When you buy a cell, you're not supporting some big corporation — you're supporting one
            person with a real goal.
          </p>
          <p className="text-zinc-300 leading-relaxed mt-3">
            Thank you for being here. It truly means a lot to me. 🙏
          </p>
          <p className="text-amber-400 font-semibold mt-4">— Twal</p>
        </section>

        {/* What is it? */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-amber-400 mb-3">What is Million Dollar Grid?</h2>
          <p className="text-zinc-400 leading-relaxed">
            Million Dollar Grid is a digital canvas with 1,000,000 cells (1000×1000).
            Each cell can be purchased to place your own image and link —
            permanently visible to every visitor.
          </p>
        </section>

        {/* How does it work? */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-amber-400 mb-3">How does it work?</h2>
          <ul className="text-zinc-400 leading-relaxed space-y-2">
            <li>• Register for free with email and password</li>
            <li>• Choose a free cell on the grid</li>
            <li>• Pay securely by credit card (1 cell = €1.24, 10×10 = €124 etc.)</li>
            <li>• Upload your image and optionally add a link</li>
            <li>• Your image is instantly visible to everyone</li>
          </ul>
        </section>

        {/* Disclaimer */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-amber-400 mb-3">Disclaimer</h2>
          <p className="text-zinc-400 leading-relaxed mb-3">
            All images and links on Million Dollar Grid are provided solely by individual users.
            The operator of this site accepts no responsibility for any content uploaded or linked
            by users.
          </p>
          <p className="text-zinc-400 leading-relaxed mb-3">
            External links have not been reviewed. The operator expressly distances themselves from
            all linked content and accepts no liability for their content or any consequences of
            visiting them.
          </p>
          <p className="text-zinc-400 leading-relaxed">
            The operators of linked websites are solely responsible for their content.
          </p>
        </section>

        {/* Prohibited content */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-amber-400 mb-3">Prohibited Content</h2>
          <p className="text-zinc-400 leading-relaxed mb-3">The following content is strictly forbidden on Million Dollar Grid:</p>
          <ul className="text-zinc-400 leading-relaxed space-y-2">
            <li>• Illegal or criminal content</li>
            <li>• Pornographic or sexually explicit content</li>
            <li>• Content that endangers minors</li>
            <li>• Hate speech, discrimination or depictions of violence</li>
            <li>• Copyrighted content without permission</li>
            <li>• Spam, fraud or misleading content</li>
          </ul>
          <p className="text-zinc-400 leading-relaxed mt-3">
            The operator reserves the right to remove any content that violates these rules
            at any time and without prior notice.
          </p>
        </section>

        {/* Purchases */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-amber-400 mb-3">Purchases & Refunds</h2>
          <p className="text-zinc-400 leading-relaxed">
            All purchases are final. As these are digital goods, no refund is available once a
            cell has been purchased and activated. Payments are processed securely via Stripe.
          </p>
        </section>

        {/* Contact */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-amber-400 mb-3">Contact</h2>
          <p className="text-zinc-400 leading-relaxed mb-2">
            For questions, issues or reports of inappropriate content, reach us at:
          </p>
          <a
            href="mailto:m.dollargrid@proton.me"
            className="text-amber-400 hover:text-amber-300 transition-colors font-medium"
          >
            m.dollargrid@proton.me
          </a>
        </section>

        {/* Withdrawal right */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-amber-400 mb-3">Right of Withdrawal</h2>
          <p className="text-zinc-400 leading-relaxed">
            By completing a purchase, you expressly request immediate delivery of this digital
            service and acknowledge that you lose your right of withdrawal once the cell has been
            activated, since performance begins immediately at your request.
          </p>
        </section>

        <div className="border-t border-zinc-800 pt-8">
          <a href="/privacy" className="text-zinc-500 hover:text-white text-sm transition-colors">
            Privacy Policy
          </a>
        </div>

        <div className="border-t border-zinc-800 pt-8 mt-4 text-zinc-600 text-xs">
          Million Dollar Grid — All rights reserved
        </div>
      </div>
    </main>
  );
}
