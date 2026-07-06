export type CaretakerDashboardStats = {
  assignedUnits: number;
  activeLeases: number;
  activeTenants: number;
  openIssues: number;
  resolvedToday: number;
  urgentIssues: number;
  scheduledInspections: number;
  completedInspectionsToday: number;
  pendingWaterBills: number;
};

export type RecentIssue = {
  id: string;
  title: string;
  status: string;
  updatedAt: Date;
  unit: {
    houseNo: string;
    property: { name: string | null } | null;
    building: { name: string | null } | null;
  } | null;
};

export type UpcomingInspection = {
  id: string;
  scheduledAt: Date | null;
  notice: {
    tenant: { fullName: string };
    lease: {
      unit: {
        houseNo: string;
        property: { name: string | null } | null;
        building: { name: string | null } | null;
      };
    };
  };
};

export type CaretakerDashboardData = CaretakerDashboardStats & {
  recentIssues: RecentIssue[];
  upcomingInspections: UpcomingInspection[];
};

export type CaretakerDashboardResult =
  | { ok: true; data: CaretakerDashboardData }
  | { ok: false; errorMessage: string };