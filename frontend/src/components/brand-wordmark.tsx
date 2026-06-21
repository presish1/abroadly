export function BrandWordmark({ size = "compact" }: { size?: "compact" | "large" }) {
  return (
    <span className={`brand-wordmark ${size === "large" ? "brand-wordmark-large" : ""}`} aria-label="Abroadly">
      <img src="/images/abroadly-wordmark.png" alt="" aria-hidden />
    </span>
  );
}
