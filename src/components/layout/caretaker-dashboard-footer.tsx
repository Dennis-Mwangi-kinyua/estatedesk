export function CaretakerDashboardFooter() {
  return (
    <footer className="shrink-0 border-t border-neutral-200/80 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="px-4 py-3 text-xs text-neutral-500 sm:px-6 xl:px-8">
        © {new Date().getFullYear()} EstateDesk · Caretaker Dashboard
      </div>
    </footer>
  );
}