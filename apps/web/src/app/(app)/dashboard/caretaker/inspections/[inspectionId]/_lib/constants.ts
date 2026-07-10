export const reportChecklistItems = [
  { label: "Cleanliness", key: "cleanlinessOk" },
  { label: "Walls condition", key: "wallsOk" },
  { label: "Doors & windows", key: "doorsWindowsOk" },
  { label: "Plumbing", key: "plumbingOk" },
  { label: "Electrical", key: "electricalOk" },
  { label: "Keys returned", key: "keysReturned" },
  { label: "Meter readings taken", key: "meterReadingsTaken" },
  { label: "Damage observed", key: "damageObserved" },
] as const;

export const inspectionChecklistFields = [
  { name: "cleanlinessOk", label: "Cleanliness is acceptable" },
  { name: "wallsOk", label: "Walls are in good condition" },
  { name: "doorsWindowsOk", label: "Doors and windows are okay" },
  { name: "plumbingOk", label: "Plumbing is okay" },
  { name: "electricalOk", label: "Electrical fixtures are okay" },
  { name: "keysReturned", label: "Keys have been returned" },
  { name: "meterReadingsTaken", label: "Meter readings captured" },
  { name: "damageObserved", label: "Damage has been observed" },
] as const;
