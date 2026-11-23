import ListingEditor from "@/components/ListingEditor";
export default function EditListing({ params }: { params: { id: string } }) { return <ListingEditor id={params.id} />; }
