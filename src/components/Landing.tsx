import { Logo } from './Logo'

export function Landing({ onStart }: { onStart: () => void }) {
  return <div className="landing">
    <header className="landing-nav"><div className="landing-wrap nav-inner"><a href="#top" className="brand-link"><Logo /></a><nav aria-label="Landing sections"><a href="#why">Why trace</a><a href="#process">Approach</a><a href="#privacy">Privacy</a><button className="button pill" onClick={onStart}>Start tracing</button></nav></div></header>
    <main id="top">
      <section className="cinema" aria-labelledby="hero-title">
        <div className="hero">
          <h1 id="hero-title"><span>Preserve what happened.</span><span>Keep control of</span><span><em>what happens next.</em></span></h1>
          <p className="hero-copy">trace helps people document online harassment, stalking, threats, impersonation, and image-based abuse while keeping original evidence, personal context, and report decisions under their control.</p>
          <button className="button pill hero-cta" onClick={onStart}>Start tracing</button>
        </div>
        <a className="scroll-cue" href="#why"><span/>Why trace matters<span/></a>
      </section>
      <section className="landing-problem" id="why" aria-labelledby="why-title">
        <div className="landing-wrap problem-intro"><h2 id="why-title">Documentation should not become <em>another burden.</em></h2><p>When abuse is still unfolding, the targeted person may be left to preserve scattered files, reconstruct a sequence, distinguish what a file says from what they know, and decide what can be shared safely.</p></div>
      </section>
      <section className="process landing-wrap" id="process" aria-labelledby="process-title">
        <div className="process-intro"><h2 id="process-title"><span>Evidence</span><span>Context</span><span><em>Report</em></span></h2><p className="process-summary">Preserve what arrived, add what only you know, then choose what becomes part of the record.</p><p className="process-note"><strong>Integrity is recorded.</strong> Truth is never declared.</p></div>
        <div className="process-path" role="list">
          <article role="listitem"><h3>Preserve</h3><p>Keep the original separate from notes, redactions, and working copies.</p></article>
          <article role="listitem"><h3>Understand</h3><p>Review provenance and optional authenticity signals with uncertainty made explicit.</p></article>
          <article role="listitem"><h3>Contextualize</h3><p>Build a clear timeline in your own words without changing the original files.</p></article>
          <article role="listitem"><h3>Control</h3><p>Choose what belongs in a report copy and what stays private on the device.</p></article>
        </div>
      </section>
      <section className="privacy-statement" id="privacy" aria-labelledby="privacy-title"><div className="landing-wrap privacy-inner"><Logo compact/><div><h2 id="privacy-title">Your evidence does not leave this device unless <em>you export it.</em></h2><p>No account. No analytics. No cloud database. Files are stored as original Blobs in your browser using IndexedDB. Clearing browser data also removes trace cases.</p></div></div></section>
      <section className="support landing-wrap"><h2>Evidence is one part of a response.</h2><p>trace is an organization tool, not an emergency service or a substitute for legal advice. If you are in immediate danger, contact an appropriate local emergency or crisis service. Location-specific resources can be added here in a future release.</p></section>
    </main>
    <footer><div className="landing-wrap footer-inner"><Logo/><p>A private, understandable evidence workspace for technology-facilitated abuse.</p><button className="text-button" onClick={onStart}>Open workspace</button></div></footer>
  </div>
}
