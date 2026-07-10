"use client";

import { memo } from "react";
import type { StaffRole } from "@/features/staff/constants/role-meta";
import type { AssignmentTarget, FormValues } from "../_lib/types";

export const CaretakerHiddenFields = memo(function CaretakerHiddenFields({
  values,
  selectedRole,
  selectedTarget,
  assignmentPropertyId,
  assignmentBuildingId,
  assignmentUnitId,
}: {
  values: FormValues;
  selectedRole: StaffRole;
  selectedTarget: AssignmentTarget | null;
  assignmentPropertyId: string;
  assignmentBuildingId: string;
  assignmentUnitId: string;
}) {
  return (
    <>
      <input type="hidden" name="fullName" value={values.fullName} />
      <input type="hidden" name="username" value={values.username} />
      <input type="hidden" name="email" value={values.email} />
      <input type="hidden" name="phone" value={values.phone} />
      <input type="hidden" name="salaryAmount" value={values.salaryAmount} />
      <input type="hidden" name="salaryCurrency" value={values.salaryCurrency} />
      <input type="hidden" name="educationLevel" value={values.educationLevel} />
      <input type="hidden" name="jobTitle" value={values.jobTitle} />
      <input type="hidden" name="nationalId" value={values.nationalId} />
      <input type="hidden" name="emergencyContact" value={values.emergencyContact} />
      <input type="hidden" name="staffProfileNotes" value={values.staffProfileNotes} />
      <input type="hidden" name="password" value={values.password} />
      <input type="hidden" name="confirmPassword" value={values.confirmPassword} />
      <input type="hidden" name="role" value={selectedRole} />

      <input
        type="hidden"
        name="assignmentTargetType"
        value={selectedTarget?.type ?? ""}
      />
      <input
        type="hidden"
        name="assignmentPropertyId"
        value={assignmentPropertyId}
      />
      <input
        type="hidden"
        name="assignmentBuildingId"
        value={assignmentBuildingId}
      />
      <input type="hidden" name="assignmentUnitId" value={assignmentUnitId} />
      <input
        type="hidden"
        name="assignmentNotes"
        value={values.assignmentNotes}
      />
      <input
        type="hidden"
        name="assignmentIsPrimary"
        value={values.assignmentIsPrimary ? "on" : ""}
      />
    </>
  );
});