type BrandLogoProps = {
  className?: string;
};

const BrandLogo = ({ className = "" }: BrandLogoProps) => (
  <svg
    viewBox="0 0 96 96"
    role="img"
    aria-label="Luxury Stay Hotel"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect x="8" y="8" width="80" height="80" rx="18" fill="#07162B" />
    <rect x="10.5" y="10.5" width="75" height="75" rx="15.5" stroke="#D4AF37" strokeWidth="3" />
    <path d="M48 18L67 31H29L48 18Z" fill="#D4AF37" />
    <path d="M31 34H65V69H31V34Z" fill="#0E2546" stroke="#D4AF37" strokeWidth="3" />
    <path d="M37 69V44M48 69V40M59 69V44" stroke="#F4D875" strokeWidth="4" strokeLinecap="round" />
    <path d="M24 69H72" stroke="#D4AF37" strokeWidth="4" strokeLinecap="round" />
    <path d="M38 29L48 22L58 29" stroke="#F8E7A1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M39 78H57" stroke="#F4D875" strokeWidth="3" strokeLinecap="round" />
    <circle cx="48" cy="31" r="3" fill="#F8E7A1" />
  </svg>
);

export default BrandLogo;
