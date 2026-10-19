import { z } from "zod";

export const nativeActionLinkSchema = z.object({ id: z.string(), title: z.string(), destructive: z.boolean().optional() });
export const nativeActionFieldSchema = z.object({
  name: z.string(), label: z.string(), type: z.enum(["hidden", "text", "multiline", "email", "phone", "decimal", "integer", "password", "date", "select", "multiselect", "checkbox", "signature"]),
  required: z.boolean().optional(), maxLength: z.number().optional(), defaultValue: z.string().optional(),
  options: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  when: z.object({ field: z.string(), equals: z.string() }).optional(),
});
export const nativeActionDefinitionSchema = z.object({
  id: z.string(), title: z.string(), description: z.string(), submitLabel: z.string(), confirmation: z.string(), destructive: z.boolean().optional(),
  groups: z.array(z.object({ id: z.string(), title: z.string(), description: z.string().optional(), repeat: z.boolean().optional(), fields: z.array(nativeActionFieldSchema) })),
});
export const nativeActionRequestSchema = z.object({
  kind: z.enum(["organization", "platform"]), path: z.string().min(1).max(200), actionId: z.string().min(1).max(100), recordId: z.string().min(1).max(2000).optional(),
  values: z.record(z.string().max(100), z.union([z.string().max(350200), z.array(z.string().max(10000)).max(200)])).optional(),
}).superRefine((input, context) => {
  for (const [name, value] of Object.entries(input.values ?? {})) {
    if (name !== "signature" && typeof value === "string" && value.length > 60000) context.addIssue({ code: "custom", path: ["values", name], message: "Form text must be at most 60000 characters." });
  }
});
export const nativeActionResultSchema = z.object({
  ok: z.literal(true), message: z.string(),
  credentials: z.object({ fullName: z.string(), username: z.string(), password: z.string(), email: z.string().nullable().optional(), phone: z.string().nullable().optional(), loginUrl: z.string() }).optional(),
  document: z.object({ filename: z.string(), content: z.string().max(36_000_000) }).optional(),
  file: z.object({ filename: z.string(), content: z.string().max(36_000_000), mimeType: z.literal("application/zip") }).optional(),
  vaultCookie: z.string().max(8192).optional(),
  plainKey: z.string().max(1000).optional(),
  sessionCookie: z.string().max(8192).optional(),
  supportCookie: z.string().max(8192).nullable().optional(),
  contextChanged: z.boolean().optional(),
  allocationDraft: z.object({ fullName: z.string(), email: z.string().nullable().optional(), phone: z.string().nullable().optional(), subject: z.string(), message: z.string() }).optional(),
});
export type NativeActionLink = z.infer<typeof nativeActionLinkSchema>;
export type NativeActionDefinition = z.infer<typeof nativeActionDefinitionSchema>;
export type NativeActionField = z.infer<typeof nativeActionFieldSchema>;
export type NativeActionRequest = z.infer<typeof nativeActionRequestSchema>;
export type NativeActionResult = z.infer<typeof nativeActionResultSchema>;

/** Whitelist transport keys and retain repeated HTML form fields in row order. */
export function nativeActionFormData(definition: NativeActionDefinition, values: NonNullable<NativeActionRequest["values"]>) {
  const fields = new Map(definition.groups.flatMap(group => group.fields.map(field => [field.name, { field, repeat: !!group.repeat || field.type === "multiselect" }] as const)));
  for (const name of Object.keys(values)) if (!fields.has(name)) throw new Error(`Unexpected form field: ${name}`);
  const form = new FormData();
  for (const [name, { field, repeat }] of fields) {
    const supplied = values[name] ?? (repeat ? [] : "");
    if (repeat !== Array.isArray(supplied)) throw new Error(`Invalid form field: ${name}`);
    const entries = Array.isArray(supplied) ? supplied : [supplied];
    for (const value of entries) {
      if (field.maxLength && value.length > field.maxLength) throw new Error(`${field.label} is too long.`);
      form.append(name, value);
    }
  }
  for (const group of definition.groups.filter(group => group.repeat)) {
    const lengths = group.fields.map(field => form.getAll(field.name).length);
    if (lengths.some(length => length !== lengths[0])) throw new Error("Repeated form rows must contain every field.");
  }
  return form;
}
