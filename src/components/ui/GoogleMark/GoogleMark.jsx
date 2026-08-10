/** The four-colour Google mark used on the sign-in button. */
export default function GoogleMark({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path
        fill="#4285F4"
        d="M45.1 24.5c0-1.6-.1-2.8-.4-4H24v7.3h12.1c-.2 2-1.6 5-4.5 7l6.9 5.3c4.1-3.8 6.6-9.4 6.6-15.6z"
      />
      <path
        fill="#34A853"
        d="M24 46c5.9 0 10.9-2 14.5-5.3l-6.9-5.3c-1.8 1.3-4.3 2.2-7.6 2.2-5.8 0-10.8-3.8-12.5-9.1l-7.2 5.5C7.9 41.2 15.4 46 24 46z"
      />
      <path
        fill="#FBBC05"
        d="M11.5 28.5c-.5-1.3-.7-2.7-.7-4.1s.3-2.8.7-4.1l-7.2-5.6C2.8 17.6 2 20.7 2 24s.8 6.4 2.3 9.2l7.2-4.7z"
      />
      <path
        fill="#EA4335"
        d="M24 10.6c3.2 0 5.4 1.4 6.7 2.6l6.1-6C33 3.9 29 2 24 2 15.4 2 7.9 6.8 4.3 14.8l7.2 5.6c1.7-5.3 6.7-9.8 12.5-9.8z"
      />
    </svg>
  );
}
