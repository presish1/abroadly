export function BrandWordmark({ size = "compact" }: { size?: "compact" | "large" }) {
  return (
    <span className={`brand-wordmark ${size === "large" ? "brand-wordmark-large" : ""}`} role="img" aria-label="Abroadly">
      <img src="/images/Abroadly_logo.svg" alt="" aria-hidden width={512} height={512} />
    </span>
  );
}
