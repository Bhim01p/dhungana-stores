interface BrandLogoProps {
  className?: string;
  alt?: string;
}

/** Store identity mark. The source image is served from Vite's public directory. */
export default function BrandLogo({ className = "", alt = "Bishnu & Dhungana Stores" }: BrandLogoProps) {
  return <img src="/logo.png" alt={alt} className={`object-contain ${className}`} />;
}
