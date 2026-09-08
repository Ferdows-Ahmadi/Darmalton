export default function LoadingPage() {
  return (
    <div className="page-section page-skeleton" role="status" aria-label="Loading">
      <span className="skeleton skeleton-heading" />
      <span className="skeleton skeleton-copy" />
      <div className="skeleton-grid">
        {Array.from({ length: 6 }, (_, index) => (
          <span className="skeleton skeleton-card" key={index} />
        ))}
      </div>
    </div>
  );
}
