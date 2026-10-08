"use client";

import Image from "next/image";
import Link from "next/link";
import { startTransition, useActionState, useEffect, useState } from "react";
import { saveBnbAction } from "../actions";
import { BNB_AMENITIES, BNB_TYPES, MAX_BNB_PHOTOS, MAX_BNB_PHOTO_BYTES, MAX_BNB_UPLOAD_BYTES, type BnbFormValues, type BnbFormState } from "../validation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type InitialListing = BnbFormValues & { id: string; images: { id: string; url: string }[] };
export function BnbForm({ listing, contactName, currency }: { listing?: InitialListing; contactName: string; currency: string }) {
  const [state, action, pending] = useActionState(saveBnbAction, {} as BnbFormState);
  const [retained, setRetained] = useState(listing?.images.map((image) => image.id) ?? []);
  const [previews, setPreviews] = useState<string[]>([]);
  const [photoError, setPhotoError] = useState("");
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);
  function field(name: keyof BnbFormValues, label: string, props: React.ComponentProps<typeof Input> = {}) {
    const errors = state.fieldErrors?.[name];
    return <label className="block space-y-2 text-sm font-medium" key={name} htmlFor={name}>
      <span>{label}</span><Input {...props} id={name} name={name} defaultValue={String(listing?.[name] ?? props.defaultValue ?? "")} aria-invalid={Boolean(errors)} aria-describedby={errors ? `${name}-error` : undefined} />
      {errors && <span id={`${name}-error`} className="block text-sm text-red-600 dark:text-red-300">{errors[0]}</span>}
    </label>;
  }
  function text(name: "description" | "houseRules", label: string, maxLength: number, required = false) {
    const errors = state.fieldErrors?.[name];
    return <label className="block space-y-2 text-sm font-medium" htmlFor={name}><span>{label}</span><textarea id={name} name={name} defaultValue={listing?.[name] ?? ""} maxLength={maxLength} required={required} minLength={required ? 30 : undefined} rows={5} className="w-full rounded-xl border border-input bg-background p-3 text-base md:text-sm" aria-invalid={Boolean(errors)} aria-describedby={errors ? `${name}-error` : undefined} />{errors && <span id={`${name}-error`} className="block text-red-600 dark:text-red-300">{errors[0]}</span>}</label>;
  }
  return <form onSubmit={(event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => action(formData));
  }} className="space-y-6" encType="multipart/form-data">
    {listing && <input type="hidden" name="id" value={listing.id} />}
    <fieldset disabled={pending} className="space-y-6 disabled:opacity-70">
      <section className="rounded-2xl border bg-card p-5 sm:p-7 space-y-5">
        <h2 className="text-xl font-semibold">About the stay</h2>
        {field("title", "Listing title", { required: true, minLength: 5, maxLength: 120, placeholder: "Cozy studio with a balcony in Kilimani" })}
        <div className="grid gap-5 sm:grid-cols-2">
          {field("location", "Location / neighbourhood", { required: true, minLength: 2, maxLength: 160, placeholder: "Kilimani, Nairobi" })}
          <label className="space-y-2 text-sm font-medium" htmlFor="propertyType"><span className="block">Stay type</span><select id="propertyType" name="propertyType" defaultValue={listing?.propertyType ?? "APARTMENT"} className="h-12 w-full rounded-xl border border-input bg-background px-3">{BNB_TYPES.map((type) => <option key={type} value={type}>{type.toLowerCase().replaceAll("_", " ")}</option>)}</select>{state.fieldErrors?.propertyType && <span className="text-red-600">Choose a valid stay type.</span>}</label>
        </div>
        {field("address", "Address or directions (optional)", { maxLength: 220 })}
        {text("description", "Description", 5000, true)}
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
          {field("bedrooms", "Bedrooms", { type: "number", min: 0, max: 50, required: true, defaultValue: 1 })}
          {field("bathrooms", "Bathrooms", { type: "number", min: 1, max: 50, required: true, defaultValue: 1 })}
          {field("beds", "Beds", { type: "number", min: 1, max: 100, required: true, defaultValue: 1 })}
          {field("maxGuests", "Maximum guests", { type: "number", min: 1, max: 100, required: true, defaultValue: 2 })}
        </div>
      </section>
      <section className="rounded-2xl border bg-card p-5 sm:p-7 space-y-5">
        <h2 className="text-xl font-semibold">Photos</h2><p className="text-sm text-muted-foreground">Up to 8 JPEG, PNG, or WebP photos. Maximum 2 MB each and 6 MB per upload. At least one photo is required to publish. The first photo is the cover.</p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">{listing?.images.map((image, index) => <label key={image.id} className="space-y-2 text-sm"><Image src={image.url} alt={`Existing photo ${index + 1}`} width={320} height={240} className="aspect-[4/3] w-full rounded-xl object-cover" /><span className="flex items-center gap-2"><input type="checkbox" name="retainedImages" value={image.id} checked={retained.includes(image.id)} onChange={(event) => setRetained((current) => event.target.checked ? [...current, image.id] : current.filter((id) => id !== image.id))} />Keep photo {index + 1}</span></label>)}</div>
        <label className="block space-y-2 text-sm font-medium" htmlFor="photos"><span>Add photos</span><Input id="photos" name="photos" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => {
          const next = Array.from(event.target.files ?? []);
          const invalid = next.length + retained.length > MAX_BNB_PHOTOS ? "Keep at most 8 photos in total." : next.some((file) => file.size > MAX_BNB_PHOTO_BYTES) ? "Each photo must be smaller than 2 MB." : next.reduce((sum, file) => sum + file.size, 0) > MAX_BNB_UPLOAD_BYTES ? "New photos must total less than 6 MB." : "";
          setPhotoError(invalid);
          if (invalid) { event.target.value = ""; setPreviews([]); } else setPreviews(next.map((file) => URL.createObjectURL(file)));
        }} /></label>
        {photoError && <p role="alert" className="text-sm text-red-600 dark:text-red-300">{photoError}</p>}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">{previews.map((url, index) => <Image key={url} src={url} alt={`New photo ${index + 1}`} unoptimized width={320} height={240} className="aspect-[4/3] w-full rounded-xl object-cover" />)}</div>
      </section>
      <section className="rounded-2xl border bg-card p-5 sm:p-7 space-y-5">
        <h2 className="text-xl font-semibold">Pricing & amenities</h2>
        <div className="grid gap-5 sm:grid-cols-3">
          {field("nightlyRate", `Nightly rate (${currency})`, { type: "number", min: 0.01, max: 9999999999.99, step: "0.01", required: true })}
          {field("cleaningFee", `Cleaning fee (${currency})`, { type: "number", min: 0, max: 9999999999.99, step: "0.01", required: true, defaultValue: 0 })}
          {field("minimumNights", "Minimum nights", { type: "number", min: 1, max: 365, required: true, defaultValue: 1 })}
        </div>
        <fieldset><legend className="mb-3 text-sm font-medium">Amenities</legend><div className="grid gap-3 sm:grid-cols-3">{BNB_AMENITIES.map((amenity) => <label key={amenity} className="flex min-h-10 items-center gap-2 text-sm"><input type="checkbox" name="amenities" value={amenity} defaultChecked={listing?.amenities.includes(amenity)} />{amenity}</label>)}</div></fieldset>
        {text("houseRules", "House rules (optional)", 2000)}
      </section>
      <section className="rounded-2xl border bg-card p-5 sm:p-7 space-y-5">
        <h2 className="text-xl font-semibold">Contact & publishing</h2><p className="text-sm text-muted-foreground">These contact details appear on the published listing so guests can enquire directly.</p>
        <div className="grid gap-5 sm:grid-cols-3">
          {field("contactName", "Contact name", { required: true, minLength: 2, maxLength: 100, defaultValue: contactName })}
          {field("contactPhone", "Contact phone", { type: "tel", required: true, minLength: 7, maxLength: 25, placeholder: "+254 7XX XXX XXX" })}
          {field("contactEmail", "Contact email (optional)", { type: "email", maxLength: 254 })}
        </div>
        <label className="block space-y-2 text-sm font-medium" htmlFor="status"><span>Listing status</span><select id="status" name="status" defaultValue={listing?.status ?? "DRAFT"} className="h-12 w-full rounded-xl border border-input bg-background px-3"><option value="DRAFT">Draft — only visible in your workspace</option><option value="PUBLISHED">Published — visible on EstateDesk</option><option value="PAUSED">Paused — hidden from guests</option></select></label>
      </section>
      {state.error && <p role="alert" className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">{state.error}</p>}
      <div className="flex flex-wrap gap-3"><Button type="submit">{pending ? "Saving listing…" : listing ? "Save changes" : "Save listing"}</Button><Button asChild variant="outline"><Link href="/dashboard/org/airbnb">Cancel</Link></Button></div>
    </fieldset>
  </form>;
}
