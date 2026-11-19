export default function Loading() {
  return (
    <main
      className="public-state-screen"
      role="status"
      aria-label="Loading website"
    >
      <div className="public-state-grid" />
      <div className="public-state-glow" />

      <div className="public-state-content">
        <div className="public-loading-symbols" aria-hidden="true">
          <span className="public-loading-symbol">○</span>
          <span className="public-loading-symbol">□</span>
          <span className="public-loading-symbol">×</span>
          <span className="public-loading-symbol">△</span>
        </div>

        <p className="public-loading-heading">Initializing</p>

        <p className="public-loading-description">
          Preparing your experience...
        </p>

        <div className="public-loading-track" aria-hidden="true">
          <div className="public-loading-bar" />
        </div>
      </div>
    </main>
  );
}
