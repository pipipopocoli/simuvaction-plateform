import { redirect } from "next/navigation";

export default function AtlasPage() {
  redirect("/?focus=map");
}
