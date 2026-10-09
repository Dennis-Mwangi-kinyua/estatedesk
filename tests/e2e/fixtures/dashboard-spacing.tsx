import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { TenantMobileNav } from "@/components/layout/tenant-mobile-nav";
import { MobileEditBar } from "@/components/tenant/_components/mobile-edit-bar";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";

function Fixture() {
  const [open, setOpen] = useState(false);
  return <div className="estate-workspace min-h-screen lg:pl-72">
    <main className="tenant-dashboard-main p-4 space-y-5">
      <div className="tenant-summary-grid grid grid-cols-2 lg:grid-cols-4 gap-3">
        {["Outstanding balance", "Monthly rent", "Deposit held", "Total paid"].map(label => <div key={label} className="workspace-metric border p-4" data-metric-icon="Wallet"><p>{label}</p><p className="mt-2 text-3xl">KES 1,234,567.89</p></div>)}
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        {["Payment history", "Upcoming inspections"].map(label => <Card key={label}><CardHeader><CardTitle>{label}</CardTitle></CardHeader><CardContent><p>Greenview Gardens and Residences — a longer property name that needs comfortable space.</p></CardContent><CardFooter><button>View details</button><button>Download report</button></CardFooter></Card>)}
      </div>
      <MobileEditBar />
    </main>
    <TenantMobileNav hasActiveLease menuOpen={open} onMenuClick={() => setOpen(!open)} />
  </div>;
}
createRoot(document.getElementById("fixture")!).render(<Fixture />);
