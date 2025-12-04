interface LoadingOverlayProps {
  label?: string;
}

const LoadingOverlay = ({ label = 'Loading...' }: LoadingOverlayProps) => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="space-y-3 text-center">
      <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-brand-400 border-t-transparent" />
      <p className="text-sm text-slate-400">{label}</p>
    </div>
  </div>
);

export default LoadingOverlay;
