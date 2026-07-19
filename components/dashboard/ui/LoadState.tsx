// Shared load-state fragment for the gated dashboard views (Brain/Coach/People).
// Each view keeps its own wrapper/typography; this owns the single source of
// truth for the "loading vs. couldn't-load + Retry" copy so the three views
// can't drift apart.
export function LoadState({ loadError, retryLoad }: { loadError: boolean; retryLoad: () => void }) {
  return loadError ? (
    <>
      Couldn&apos;t load your data.{" "}
      <button onClick={retryLoad} className="underline text-[#A51C30]">Retry</button>
    </>
  ) : (
    <>Loading…</>
  );
}
