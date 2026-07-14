export function formatDate(value: Date | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

export function getInitials(name: string | null | undefined) {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export function getNotice(params?: { error?: string; updated?: string }) {
  if (params?.error === "read-only") {
    return {
      tone: "error" as const,
      message: "Platform user records are read-only and cannot be edited here.",
    };
  }

  if (params?.updated === "status") {
    return {
      tone: "success" as const,
      message: "User status updated.",
    };
  }

  if (params?.updated === "profile") {
    return {
      tone: "success" as const,
      message: "User profile updated.",
    };
  }

  if (params?.updated === "permissions") {
    return {
      tone: "success" as const,
      message: "Platform permissions updated.",
    };
  }

  if (params?.updated === "password") {
    return {
      tone: "success" as const,
      message: "Temporary password set. The user must change it on next login.",
    };
  }

  if (params?.error === "self-status") {
    return {
      tone: "error" as const,
      message: "You cannot change your own platform account status.",
    };
  }

  if (params?.error === "self-archive") {
    return {
      tone: "error" as const,
      message: "You cannot archive your own platform account.",
    };
  }

  if (params?.error === "root-protected") {
    return {
      tone: "error" as const,
      message: "Root super admin accounts are protected from this action.",
    };
  }

  if (params?.error === "not-orphan") {
    return {
      tone: "error" as const,
      message:
        "This user still has memberships or platform permissions and cannot be archived as an orphan.",
    };
  }

  if (params?.error === "confirm-archive") {
    return {
      tone: "error" as const,
      message: "Confirmation did not match. Type the shown value exactly.",
    };
  }

  if (params?.error === "duplicate") {
    return {
      tone: "error" as const,
      message: "Another user already uses that username, email, or phone.",
    };
  }

  if (params?.error === "password") {
    return {
      tone: "error" as const,
      message: "Password must be at least 8 characters and both fields must match.",
    };
  }

  if (params?.error === "super-admin") {
    return {
      tone: "error" as const,
      message: "Only a super admin can assign the super admin role.",
    };
  }

  return null;
}
