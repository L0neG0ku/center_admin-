/**
 * Dependency-free icon set. Every glyph is a 24x24 stroked path that
 * inherits `currentColor`, so colour is controlled from CSS.
 *
 * Usage: <Icon name="calendar" size={18} />
 */
const paths = {
  sparkle: (
    <>
      <path d="M12 3.2l1.7 4.6 4.6 1.7-4.6 1.7L12 15.8l-1.7-4.6L5.7 9.5l4.6-1.7z" />
      <path d="M18.5 15.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" />
    </>
  ),
  building: (
    <>
      <path d="M4.5 21V5.5A2 2 0 0 1 6.5 3.5h6.5a2 2 0 0 1 2 2V21" />
      <path d="M15 10.5h2.5a2 2 0 0 1 2 2V21" />
      <path d="M2.5 21h19" />
      <path d="M8 8h3.5M8 12h3.5M8 16h3.5" />
    </>
  ),
  signIn: (
    <>
      <path d="M14 3.5h3.5a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H14" />
      <path d="M10 16l4-4-4-4" />
      <path d="M14 12H3.5" />
    </>
  ),
  arrowRight: (
    <>
      <path d="M4.5 12h14" />
      <path d="M13 6.5l6 5.5-6 5.5" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="16" rx="3" />
      <path d="M3.5 10h17M8.5 3v4M15.5 3v4" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.2V12l3.1 1.9" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8.5" r="3.6" />
      <path d="M4.5 20.5v-1a5 5 0 0 1 5-5h5a5 5 0 0 1 5 5v1" />
    </>
  ),
  users: (
    <>
      <circle cx="9.5" cy="8" r="3.3" />
      <path d="M3 20v-1a4.5 4.5 0 0 1 4.5-4.5h4A4.5 4.5 0 0 1 16 19v1" />
      <path d="M16.5 4.7a3.3 3.3 0 0 1 0 6.4" />
      <path d="M18 20v-1a4.5 4.5 0 0 0-2.2-3.9" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="M4 8l8 5.5L20 8" />
    </>
  ),
  phone: (
    <path d="M20.5 16.6v2.5a1.7 1.7 0 0 1-1.9 1.7 16.8 16.8 0 0 1-7.3-2.6 16.5 16.5 0 0 1-5.1-5.1A16.8 16.8 0 0 1 3.6 5.7 1.7 1.7 0 0 1 5.3 3.8h2.5a1.7 1.7 0 0 1 1.7 1.5c.1.8.3 1.6.6 2.4a1.7 1.7 0 0 1-.4 1.8l-1 1a13.5 13.5 0 0 0 5 5l1-1a1.7 1.7 0 0 1 1.8-.4c.8.3 1.6.5 2.4.6a1.7 1.7 0 0 1 1.6 1.9z" />
  ),
  mapPin: (
    <>
      <path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.6" />
    </>
  ),
  grid: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="2" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="2" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="2" />
    </>
  ),
  pencil: (
    <>
      <path d="M11 4.5H5.5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V13" />
      <path d="M17.5 3.4a2 2 0 0 1 2.8 2.8L12.6 14l-3.5.8.8-3.5z" />
    </>
  ),
  checkCircle: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.4 12.3l2.4 2.4 4.7-5" />
    </>
  ),
  shieldCheck: (
    <>
      <path d="M12 3l7.5 3v6c0 4.3-3 7.8-7.5 9-4.5-1.2-7.5-4.7-7.5-9V6L12 3z" />
      <path d="M9 12.2l2.1 2.1 4.1-4.3" />
    </>
  ),
  headset: (
    <>
      <path d="M4.5 13.5v-1.5a7.5 7.5 0 0 1 15 0v1.5" />
      <path d="M4.5 13.5h2a1.5 1.5 0 0 1 1.5 1.5v2.5A1.5 1.5 0 0 1 6.5 19h-.5a1.5 1.5 0 0 1-1.5-1.5z" />
      <path d="M19.5 13.5h-2a1.5 1.5 0 0 0-1.5 1.5v2.5a1.5 1.5 0 0 0 1.5 1.5h.5a1.5 1.5 0 0 0 1.5-1.5z" />
    </>
  ),
  helpCircle: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.6 9.6a2.5 2.5 0 0 1 4.8 1c0 1.7-2.3 2-2.3 3.4" />
      <path d="M12 17.4h.01" />
    </>
  ),
  lock: (
    <>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
      <path d="M12 14.5v2.5" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  eyeOff: (
    <>
      <path d="M9.9 5.2A9.6 9.6 0 0 1 12 5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-3.3 4.2" />
      <path d="M6.6 6.8A17 17 0 0 0 2.5 11.5S6 18 12 18a9.4 9.4 0 0 0 4.2-1" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
      <path d="M3.5 3.5l17 17" />
    </>
  ),
  cloudUpload: (
    <>
      <path d="M7 17.5a4.2 4.2 0 0 1 .5-8.4 5.6 5.6 0 0 1 10.7 1.6 3.7 3.7 0 0 1-.7 7.3" />
      <path d="M12 20.5v-8" />
      <path d="M9 15l3-3 3 3" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="4.5" width="18" height="15" rx="3" />
      <circle cx="8.6" cy="9.6" r="1.6" />
      <path d="M3.5 17l4.6-4.3a2 2 0 0 1 2.7 0L16 17.5" />
    </>
  ),
  fileCheck: (
    <>
      <path d="M14 3H7.5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V7.6z" />
      <path d="M13.8 3v4.6h4.6" />
      <path d="M9 14.4l2 2 3.6-3.9" />
    </>
  ),
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  chevronLeft: <path d="M14.5 5.5L8 12l6.5 6.5" />,
  trash: (
    <>
      <path d="M4 6.5h16" />
      <path d="M9 6.5V5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5v1.5" />
      <path d="M6 6.5l.9 12.1a2 2 0 0 0 2 1.9h6.2a2 2 0 0 0 2-1.9l.9-12.1" />
    </>
  ),
  bank: (
    <>
      <path d="M3.5 9.5L12 4l8.5 5.5" />
      <path d="M5.5 9.5v9M18.5 9.5v9M9.5 9.5v9M14.5 9.5v9" />
      <path d="M3 20.5h18" />
    </>
  ),
  rupee: (
    <>
      <path d="M7 4.5h10" />
      <path d="M7 9h10" />
      <path d="M7 4.5c4 0 6 1.5 6 4.5s-2 4.5-6 4.5h1.5l7 6" />
    </>
  ),
  clipboard: (
    <>
      <rect x="5" y="4.5" width="14" height="16" rx="2.5" />
      <path d="M9 4.5V3.6A1.6 1.6 0 0 1 10.6 2h2.8A1.6 1.6 0 0 1 15 3.6v.9" />
      <path d="M9 12l2 2 4-4.5" />
    </>
  ),
  shield: <path d="M12 3l7.5 3v6c0 4.3-3 7.8-7.5 9-4.5-1.2-7.5-4.7-7.5-9V6L12 3z" />,
  key: (
    <>
      <circle cx="8" cy="15.5" r="4" />
      <path d="M10.9 12.7L20 3.6" />
      <path d="M16.5 7l2.5 2.5" />
    </>
  ),
  message: (
    <path d="M21 11.5a7.7 7.7 0 0 1-10.3 7.3L4 21l1.9-6.3A7.7 7.7 0 1 1 21 11.5z" />
  ),
  barChart: (
    <>
      <path d="M3 21h18" />
      <path d="M6.5 21v-8" />
      <path d="M12 21V5" />
      <path d="M17.5 21v-5.5" />
    </>
  ),
  home: <path d="M4 10.5L12 4l8 6.5V19a2 2 0 0 1-2 2h-3v-6H9v6H6a2 2 0 0 1-2-2z" />,
  chevronDown: <path d="M6.5 9.5l5.5 5.5 5.5-5.5" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  alertCircle: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.8v5" />
      <path d="M12 16.4h.01" />
    </>
  ),
  // ---- dashboard glyphs ----
  bell: (<><path d="M18 9a6 6 0 1 0-12 0c0 5.2-2 6.5-2 6.5h16S18 14.2 18 9" /><path d="M13.7 19.5a2 2 0 0 1-3.4 0" /></>),
  search: (<><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4.2-4.2" /></>),
  plus: (<><path d="M12 5v14M5 12h14" /></>),
  filter: (<><path d="M3.5 5.5h17l-6.5 8v5.5l-4 2v-7.5z" /></>),
  download: (<><path d="M12 3.5v11" /><path d="M8 11l4 4 4-4" /><path d="M4.5 20.5h15" /></>),
  more: (<><circle cx="5.5" cy="12" r="1.3" /><circle cx="12" cy="12" r="1.3" /><circle cx="18.5" cy="12" r="1.3" /></>),
  chevronRight: (<><path d="M9.5 5.5l6.5 6.5-6.5 6.5" /></>),
  card: (<><rect x="2.5" y="5" width="19" height="14" rx="3" /><path d="M2.5 10h19" /><path d="M6.5 15h3" /></>),
  receipt: (<><path d="M5.5 21V4a1 1 0 0 1 1.5-.9l1.7 1 1.8-1 1.8 1 1.8-1 1.7 1A1 1 0 0 1 18.5 4v17l-2.2-1.3-1.8 1-1.8-1-1.8 1-1.7-1z" /><path d="M9 8.5h6M9 12.5h6" /></>),
  cake: (<><path d="M4 20.5h16" /><path d="M5 20.5v-6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v6" /><path d="M4.5 16.5c1.5 0 1.5 1.4 3 1.4s1.5-1.4 3-1.4 1.5 1.4 3 1.4 1.5-1.4 3-1.4 1.5 1.4 3 1.4" /><path d="M12 12.5V9" /><circle cx="12" cy="7" r="1.2" /></>),
  star: (<><path d="M12 3.6l2.5 5.2 5.6.8-4 4 .9 5.6-5-2.7-5 2.7.9-5.6-4-4 5.6-.8z" /></>),
  alertTriangle: (<><path d="M12 4.2l8.5 15H3.5z" /><path d="M12 10v4" /><path d="M12 16.8h.01" /></>),
  refresh: (<><path d="M20 12a8 8 0 1 1-2.6-5.9" /><path d="M20 4v4.5h-4.5" /></>),
  logOut: (<><path d="M10 3.5H6.5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2H10" /><path d="M15.5 16l4-4-4-4" /><path d="M19.5 12H9" /></>),
  xCircle: (<><circle cx="12" cy="12" r="9" /><path d="M9.2 9.2l5.6 5.6M14.8 9.2l-5.6 5.6" /></>),
  camera: (<><path d="M3.5 8.5h3l1.5-2.5h8L17.5 8.5h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-17a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1z" /><circle cx="12" cy="13.5" r="3.4" /></>),
  checkSquare: (<><rect x="3.5" y="3.5" width="17" height="17" rx="4" /><path d="M8 12.2l2.7 2.6L16.2 9" /></>),
  minusCircle: (<><circle cx="12" cy="12" r="9" /><path d="M8.4 12h7.2" /></>),
  arrowUp: (<><path d="M12 19.5V5" /><path d="M6.5 10.5L12 5l5.5 5.5" /></>),
  arrowDown: (<><path d="M12 4.5V19" /><path d="M6.5 13.5L12 19l5.5-5.5" /></>),
  send: (<><path d="M20.5 3.5L10.8 13.2" /><path d="M20.5 3.5l-6.3 17-3.4-7.3-7.3-3.4z" /></>),
  sun: (<><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2.2M12 19.3v2.2M4.2 4.2l1.6 1.6M18.2 18.2l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.2 19.8l1.6-1.6M18.2 5.8l1.6-1.6" /></>),
  moon: (<><path d="M20 14.2A8.2 8.2 0 0 1 9.8 4 8.4 8.4 0 1 0 20 14.2z" /></>),
  bookOpen: (<><path d="M3.5 5.5h6a3 3 0 0 1 2.5 1.4A3 3 0 0 1 14.5 5.5h6v12h-6a3 3 0 0 0-2.5 1.3A3 3 0 0 0 9.5 17.5h-6z" /><path d="M12 6.9v11.9" /></>),
  heart: (<><path d="M12 20s-7.3-4.5-7.3-9.4A4.1 4.1 0 0 1 12 8.2a4.1 4.1 0 0 1 7.3 2.4C19.3 15.5 12 20 12 20z" /></>),
  utensils: (<><path d="M7 3.5v7.2a2 2 0 0 0 4 0V3.5" /><path d="M9 10.7V20.5" /><path d="M17.5 3.5c-1.6 1-2.4 3-2.4 5.2 0 1.6.8 2.6 2.4 2.8V20.5" /></>),
  droplet: (<><path d="M12 3.5s5.7 5.6 5.7 9.4a5.7 5.7 0 1 1-11.4 0C6.3 9.1 12 3.5 12 3.5z" /></>),
  smile: (<><circle cx="12" cy="12" r="9" /><path d="M8.3 14.2a4.4 4.4 0 0 0 7.4 0" /><path d="M9.2 9.6h.01M14.8 9.6h.01" /></>),
  baby: (<><circle cx="12" cy="7.5" r="4" /><path d="M10.3 6.8h.01M13.7 6.8h.01" /><path d="M10.5 9.4a2.4 2.4 0 0 0 3 0" /><path d="M6 20.5c.8-3.3 3.1-5 6-5s5.2 1.7 6 5" /></>),
  megaphone: (<><path d="M4 10v3a2 2 0 0 0 2 2h1.5l9.5 4.5V5.5L7.5 10z" /><path d="M20 10.2v2.6" /><path d="M7.5 15v4.5h3" /></>),
  settings: (<><circle cx="12" cy="12" r="3.1" /><path d="M19.3 14.5a1.5 1.5 0 0 0 .3 1.7l.1.1a1.8 1.8 0 1 1-2.6 2.6l-.1-.1a1.5 1.5 0 0 0-2.6 1.1v.3a1.8 1.8 0 1 1-3.6 0v-.2a1.5 1.5 0 0 0-2.7-1 1.8 1.8 0 1 1-2.6-2.6l.1-.1a1.5 1.5 0 0 0-1.1-2.6h-.3a1.8 1.8 0 1 1 0-3.6h.2a1.5 1.5 0 0 0 1-2.7l-.1-.1A1.8 1.8 0 1 1 8 4.7l.1.1a1.5 1.5 0 0 0 2.6-1.1v-.3a1.8 1.8 0 1 1 3.6 0v.2a1.5 1.5 0 0 0 2.6 1.1l.2-.1a1.8 1.8 0 1 1 2.5 2.6l-.1.1a1.5 1.5 0 0 0 1.1 2.6h.3a1.8 1.8 0 1 1 0 3.6h-.2a1.5 1.5 0 0 0-1.4 1z" /></>),
  userPlus: (<><circle cx="9.5" cy="8" r="3.8" /><path d="M3 20.5c.7-3.6 3.2-5.6 6.5-5.6s5.8 2 6.5 5.6" /><path d="M18.5 8.5v5M16 11h5" /></>),
  fileText: (<><path d="M13.5 3.5H7a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9z" /><path d="M13.5 3.5V9H19" /><path d="M8.5 13h7M8.5 16.5h5" /></>),
  wallet: (<><path d="M3.5 7.5a2 2 0 0 1 2-2h11v3" /><rect x="3.5" y="7.5" width="17" height="12" rx="2.5" /><circle cx="16.5" cy="13.5" r="1.3" /></>),
  sliders: (<><path d="M5 20.5V14M5 10V3.5M12 20.5v-9M12 7.5V3.5M19 20.5v-4.5M19 11.5V3.5" /><path d="M2.5 14h5M9.5 11.5h5M16.5 16h5" /></>),
  palette: (<><path d="M12 3.5a8.5 8.5 0 0 0 0 17c1.2 0 2-.8 2-1.9 0-.5-.2-1-.6-1.3-.3-.4-.5-.8-.5-1.3 0-1 .9-1.9 2-1.9h1.4a4.2 4.2 0 0 0 4.2-4.2c0-3.5-3.8-6.4-8.5-6.4z" /><circle cx="7.8" cy="11.5" r="1.1" /><circle cx="10.5" cy="7.6" r="1.1" /><circle cx="15" cy="8.4" r="1.1" /></>),
  activity: (<><path d="M3.5 12.5h4l2.5-6.5 4 13 2.5-6.5h4" /></>),
  printer: (<><path d="M7 9V3.5h10V9" /><path d="M7 17H5a1.5 1.5 0 0 1-1.5-1.5v-4A2.5 2.5 0 0 1 6 9h12a2.5 2.5 0 0 1 2.5 2.5v4A1.5 1.5 0 0 1 19 17h-2" /><rect x="7" y="14" width="10" height="6.5" rx="1.5" /></>),
  zap: (<><path d="M13.2 2.5L4.5 13.6h6.3l-.9 7.9 9-11.1h-6.3z" /></>),
  ticket: (<><path d="M3.5 9.4V7a1.5 1.5 0 0 1 1.5-1.5h14A1.5 1.5 0 0 1 20.5 7v2.4a2.6 2.6 0 0 0 0 5.2V17a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 17v-2.4a2.6 2.6 0 0 0 0-5.2z" /><path d="M14 5.5v13" /></>),
  chart: (<><path d="M3.5 20.5h17" /><rect x="5" y="11" width="3.5" height="6" rx="1" /><rect x="10.2" y="6.5" width="3.5" height="10.5" rx="1" /><rect x="15.5" y="9" width="3.5" height="8" rx="1" /></>),
  bulb: (<><path d="M9.2 17.5h5.6" /><path d="M10 20.5h4" /><path d="M12 3.5a5.6 5.6 0 0 0-3.2 10.2c.6.4.9 1 .9 1.6h4.6c0-.6.3-1.2.9-1.6A5.6 5.6 0 0 0 12 3.5z" /></>),
  layers: (<><path d="M12 3.5l8.5 4.3L12 12 3.5 7.8z" /><path d="M3.5 12.2L12 16.5l8.5-4.3" /><path d="M3.5 16.4L12 20.7l8.5-4.3" /></>),
};

export default function Icon({ name, size = 20, strokeWidth = 1.7, className = "", ...rest }) {
  const glyph = paths[name];
  if (!glyph) return null;

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {glyph}
    </svg>
  );
}
