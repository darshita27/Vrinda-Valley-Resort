import SmartImg from "./SmartImg";
import { slotFallback } from "../media";
import type { ContentStore } from "../store";

/** Image bound to an admin-editable media slot. */
export default function MediaImg({
  store,
  id,
  alt,
  className,
}: {
  store: ContentStore;
  id: string;
  alt: string;
  className?: string;
}) {
  return <SmartImg src={store.img(id)} fallback={slotFallback(id)} alt={alt} className={className} />;
}
