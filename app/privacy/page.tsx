export default function PrivacyPage() {
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

        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-zinc-500 text-sm mb-12">Million Dollar Grid</p>

        <section className="mb-10">
          <h2 className="text-lg font-bold text-amber-400 mb-3">1. Controller</h2>
          <p className="text-zinc-400 leading-relaxed">
            The party responsible for data processing on this website is listed in the{' '}
            <a href="/impressum" className="text-amber-400 hover:text-amber-300 underline">Impressum</a>.
            For privacy-related questions, contact:{' '}
            <a href="mailto:m.dollargrid@proton.me" className="text-amber-400 hover:text-amber-300 underline">
              m.dollargrid@proton.me
            </a>.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-bold text-amber-400 mb-3">2. What data we process</h2>
          <ul className="text-zinc-400 leading-relaxed space-y-2">
            <li>• <strong>Account data:</strong> email address and display name, when you register</li>
            <li>• <strong>Purchase data:</strong> the cells you bought, your display name, and any image/link you upload</li>
            <li>• <strong>Payment data:</strong> handled entirely by Stripe — we never see or store your card details</li>
            <li>• <strong>Technical data:</strong> IP address (temporarily, for rate limiting and abuse prevention)</li>
            <li>• <strong>Usage data:</strong> likes and comments you post, linked to your account</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-bold text-amber-400 mb-3">3. Why we process this data</h2>
          <ul className="text-zinc-400 leading-relaxed space-y-2">
            <li>• To let you create an account and manage your purchased cells (Art. 6(1)(b) GDPR — contract)</li>
            <li>• To process payments securely via Stripe (Art. 6(1)(b) GDPR — contract)</li>
            <li>• To prevent abuse and spam through rate limiting (Art. 6(1)(f) GDPR — legitimate interest)</li>
            <li>• To display your uploaded content publicly on the grid, as the core function of the service (Art. 6(1)(b) GDPR — contract)</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-bold text-amber-400 mb-3">4. Third-party services we use</h2>
          <ul className="text-zinc-400 leading-relaxed space-y-2">
            <li>
              • <strong>Supabase</strong> (database, file storage, authentication) —{' '}
              <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:text-amber-300 underline">
                privacy policy
              </a>
            </li>
            <li>
              • <strong>Stripe</strong> (payment processing) —{' '}
              <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:text-amber-300 underline">
                privacy policy
              </a>
            </li>
            <li>
              • <strong>Vercel</strong> (hosting) —{' '}
              <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:text-amber-300 underline">
                privacy policy
              </a>
            </li>
          </ul>
          <p className="text-zinc-400 leading-relaxed mt-3">
            These providers may process data outside the EU under their own safeguards (e.g. Standard
            Contractual Clauses). We do not sell your data or share it with advertisers.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-bold text-amber-400 mb-3">5. Cookies & local storage</h2>
          <p className="text-zinc-400 leading-relaxed">
            We use your browser's local storage to keep you logged in and remember your preferences
            (e.g. "Clean view" mode). We do not use third-party advertising or tracking cookies.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-bold text-amber-400 mb-3">6. How long we keep your data</h2>
          <p className="text-zinc-400 leading-relaxed">
            Purchased cells and their content remain visible permanently, as that is the core purpose
            of the service. Account data is kept until you delete your account. IP addresses used for
            rate limiting are kept only briefly in memory and not persisted.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-bold text-amber-400 mb-3">7. Your rights</h2>
          <p className="text-zinc-400 leading-relaxed mb-3">
            Under GDPR, you have the right to access, correct, or delete your personal data, and to
            object to or restrict certain processing. You can delete your account at any time from the
            account settings page, which removes your account data.
          </p>
          <p className="text-zinc-400 leading-relaxed">
            Note that cells you purchased and their uploaded content may remain on the grid even after
            account deletion, since the cell itself was a one-time purchase tied to that specific
            position rather than to your ongoing account. Contact us if you'd like a cell's content
            removed.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-bold text-amber-400 mb-3">8. Complaints</h2>
          <p className="text-zinc-400 leading-relaxed">
            If you believe your data has been processed unlawfully, you have the right to lodge a
            complaint with your local data protection authority.
          </p>
        </section>

        <div className="border-t border-zinc-800 pt-8 text-zinc-600 text-xs">
          Million Dollar Grid — Privacy Policy
        </div>
      </div>
    </main>
  );
}
