import PostEditor from "@/components/PostEditor";
export default function EditPost({ params }: { params: { id: string } }) { return <PostEditor id={params.id} />; }
