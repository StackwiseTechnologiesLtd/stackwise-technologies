export default function Mark({
  className,
  gradientId = "sw-mark",
}: {
  className?: string;
  gradientId?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="36" height="36" rx="8" fill={`url(#${gradientId})`} />
      <path
        d="M18.3086 6.34764C20.969 3.48405 25.2823 3.48405 27.9427 6.34764C28.0905 6.5067 28.0905 6.76464 27.9427 6.92376L17.7022 17.9463C16.1784 19.5865 13.7078 19.5865 12.184 17.9463L10.2527 15.8674C10.0349 15.6331 10.0349 15.2532 10.2527 15.0189L18.3086 6.34764Z"
        fill="white"
      />
      <path
        d="M17.6648 29.6514C15.0045 32.515 10.6911 32.515 8.0308 29.6514C7.88296 29.4923 7.88296 29.2344 8.0308 29.0753L18.2712 18.0526C19.7951 16.4125 22.2656 16.4125 23.7894 18.0526L25.7208 20.1316C25.9385 20.3659 25.9385 20.7458 25.7208 20.9801L17.6648 29.6514Z"
        fill="white"
      />
      <defs>
        <linearGradient
          id={gradientId}
          x1="37.07"
          y1="-17.69"
          x2="10.68"
          y2="34.47"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#D88F8F" />
          <stop offset="0.97" stopColor="#541011" />
        </linearGradient>
      </defs>
    </svg>
  );
}
