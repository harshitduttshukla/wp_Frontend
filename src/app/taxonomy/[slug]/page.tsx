"use client";
import { notFound, useParams } from "next/navigation";
import TermManager from "@/components/TermManager";
import { TAXONOMIES } from "@/lib/api";

export default function TaxonomyPage() {
  const { slug } = useParams<{ slug: string }>();
  const tax = TAXONOMIES.find((t) => t.slug === slug);
  if (!tax) notFound();
  return <TermManager key={tax.slug} tax={tax} />;
}
