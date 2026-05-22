import { redirect } from "next/navigation";

/** Legacy URL — permanent redirect to the events hub */
export default function LegacyEventPage() {
  redirect("/events");
}
