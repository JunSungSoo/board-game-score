export function LoadingScreen() {
  return <div className="loading-screen" role="status" aria-label="Loading">
    <span className="loading-label">Loading<span className="loading-dots" aria-hidden="true" /></span>
  </div>;
}
