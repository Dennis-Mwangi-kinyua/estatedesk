export function PortfolioHierarchy() {
  return <details className="rounded-2xl border border-border bg-card p-4 text-foreground sm:p-5">
    <summary className="min-h-11 cursor-pointer text-sm font-semibold">🏘️ How properties, buildings, and units fit together</summary>
    <div className="mt-3 grid gap-3 sm:grid-cols-3">
      {[{icon:"🏘️",title:"1. Property",text:"The whole site or development you manage, such as Greenview Estate."},{icon:"🏢",title:"2. Building / block",text:"A named structure within the property, such as Block A. Standalone units can belong directly to the property."},{icon:"🚪",title:"3. Unit",text:"One separately rented space, such as Apartment A1, Shop 3, or a bedsitter. An apartment is a unit type, not a separate level."}].map(item=><div key={item.title} className="rounded-xl border border-border bg-muted/15 p-4"><span aria-hidden="true" className="text-2xl">{item.icon}</span><h3 className="mt-2 text-sm font-semibold">{item.title}</h3><p className="mt-2 text-xs leading-5 text-muted-foreground">{item.text}</p></div>)}
    </div>
    <p className="mt-3 text-xs leading-5 text-muted-foreground">Example: Greenview Estate → Block A → Apartment A1 → assigned tenant. “Unit categories” simply group similar units, such as 2-bedroom apartments.</p>
  </details>;
}
