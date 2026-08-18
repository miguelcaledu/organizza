import { initialsOf } from "@/lib/constants";

export function Avatar({
  name,
  color = "#8A9A7B",
  size = 30,
  className = "",
  offset,
}: {
  name: string;
  color?: string;
  size?: number;
  className?: string;
  offset?: number;
}) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold ${className}`}
      style={{
        width: size,
        height: size,
        background: color + "1F",
        color,
        fontSize: Math.max(9, size * 0.36),
        marginLeft: offset,
        border: offset !== undefined ? "2px solid var(--color-surface)" : undefined,
      }}
    >
      {initialsOf(name)}
    </div>
  );
}
