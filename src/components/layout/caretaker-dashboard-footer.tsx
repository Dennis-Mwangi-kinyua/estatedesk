export function CaretakerDashboardFooter() {
  return (
    <footer className="hidden shrink-0 border-t border-border bg-card/80 backdrop-blur-2xl md:block">
      <div className="px-4 py-3 text-xs text-muted-foreground sm:px-6 xl:px-8">
        © {new Date().getFullYear()} EstateDesk · Caretaker Dashboard
      </div>
    </footer>
  );
}
