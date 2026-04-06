export function CaretakerDashboardFooter() {
  return (
    <footer className="border-t border-black/5 bg-white/80 backdrop-blur">
      <div className="px-4 py-4 text-xs text-neutral-500 sm:px-6 xl:px-8">
        © {new Date().getFullYear()} EstateDesk · Caretaker Dashboard
      </div>
    </footer>
  );
}