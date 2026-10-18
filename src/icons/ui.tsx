import type { ReactElement } from 'react';
import { Glyph, type GlyphProps } from './Glyph';

/* Interface + city-service glyphs, drawn in the same hand as the rest. */

const g = (name: string, body: ReactElement, strokeWidth?: number) =>
  function NamedGlyph(p: GlyphProps) {
    return (
      <Glyph name={name} strokeWidth={strokeWidth} {...p}>
        {body}
      </Glyph>
    );
  };

/* ---------- Navigation & actions ---------- */
export const BackGlyph = g('back', <path d="M15 6l-6 6 6 6" />, 2.2);
export const ChevronRightGlyph = g('chevron-right', <path d="M9.5 6l6 6-6 6" />, 2.1);
export const ChevronDownGlyph = g('chevron-down', <path d="M6 9.5l6 6 6-6" />, 2.2);
export const CloseGlyph = g('close', <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />, 2.1);
export const CheckGlyph = g('check', <path d="M5 12.5l4.5 4.5L19 7.5" />, 2.3);
export const MoreGlyph = g(
  'more',
  <>
    <circle cx="5.5" cy="12" r="1.4" className="g-fill" stroke="none" />
    <circle cx="12" cy="12" r="1.4" className="g-fill" stroke="none" />
    <circle cx="18.5" cy="12" r="1.4" className="g-fill" stroke="none" />
  </>,
);
export const SearchGlyph = g(
  'search',
  <>
    <circle cx="10.8" cy="10.8" r="6.5" />
    <path d="M20 20l-4.4-4.4" />
    <path className="search__glint" d="M8 8.6a3.2 3.2 0 0 1 2.6-1.4" strokeWidth="1.5" />
  </>,
  2.2,
);
export const ShareGlyph = g('share', <path d="M4 12v7h16v-7M12 3v12M7 8l5-5 5 5" />);
export const ReplyGlyph = g('reply', <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.9A8 8 0 1 1 21 12z" />);
export const SendGlyph = g(
  'send',
  <>
    <path className="g-tint" d="M4 4.5 20.5 12 4 19.5l2.2-7.5z" />
    <path d="M4 4.5 20.5 12 4 19.5l2.2-7.5z" />
    <path d="M6.2 12h6.3" />
  </>,
);
export const EditGlyph = g(
  'edit',
  <>
    <path d="M4 20h4.5L19.3 9.2a2.2 2.2 0 0 0 0-3.1l-1.4-1.4a2.2 2.2 0 0 0-3.1 0L4 15.5z" />
    <path d="M13.3 6.2l4.5 4.5" />
  </>,
);
export const FilterGlyph = g(
  'filter',
  <>
    <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
    <circle cx="16" cy="7" r="2.2" />
    <circle cx="8" cy="17" r="2.2" />
  </>,
);
export const SlidersGlyph = g(
  'sliders',
  <>
    <path d="M5 4v6M5 14v6M12 4v2.5M12 10.5V20M19 4v9M19 17v3" />
    <circle cx="5" cy="12" r="2" />
    <circle className="g-dot" cx="12" cy="8.5" r="2" />
    <circle cx="19" cy="15" r="2" />
  </>,
);
export const RefreshGlyph = g(
  'refresh',
  <>
    <path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3" />
    <path d="M19.5 4v4.3h-4.3" />
  </>,
);
export const ExternalGlyph = g('external', <path d="M14 4h6v6M20 4l-8.5 8.5M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />);
export const CopyGlyph = g(
  'copy',
  <>
    <rect x="8" y="8" width="12" height="12" rx="2.5" />
    <path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8" />
  </>,
);
export const TrashGlyph = g('trash', <path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13M10 11v5M14 11v5" />);
export const FlagGlyph = g('flag', <path d="M5 21V4M5 4h11l-2 4 2 4H5" />);
export const DownloadGlyph = g('download', <path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M4.5 19.5h15" />);
export const LogoutGlyph = g('logout', <path d="M14 4h4.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H14M10 8l-4 4 4 4M6 12h10" />);

/* ---------- Place, time, people ---------- */
export const PinGlyph = g(
  'pin',
  <>
    <path className="g-tint" d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" />
    <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" />
    <circle className="g-dot" cx="12" cy="9.5" r="2.4" />
  </>,
);
export const NavigateGlyph = g(
  'navigate',
  <>
    <path className="g-tint" d="M20 4 4 11l7 2 2 7z" />
    <path d="M20 4 4 11l7 2 2 7z" />
  </>,
);
export const MapGlyph = g(
  'map',
  <>
    <path className="g-tint" d="M9 4.5 15 6.5v13L9 17.5z" />
    <path d="M3.5 6.5 9 4.5l6 2 5.5-2v13l-5.5 2-6-2-5.5 2z" />
    <path d="M9 4.5v13M15 6.5v13" />
  </>,
);
export const ClockGlyph = g(
  'clock',
  <>
    <circle cx="12" cy="12" r="8.5" />
    <path className="clock__hand" d="M12 7.5V12l3 2" />
  </>,
);
export const CalendarGlyph = g(
  'calendar',
  <>
    <rect className="g-tint" x="3.5" y="5" width="17" height="15.5" rx="3" />
    <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
    <circle className="g-dot" cx="15.5" cy="15" r="1.4" />
  </>,
);
export const UserGlyph = g(
  'user',
  <>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
  </>,
);
export const UsersGlyph = g(
  'users',
  <>
    <circle cx="9" cy="8.5" r="3.4" />
    <path d="M2.8 19.5c1-3.3 3.4-5 6.2-5s5.2 1.7 6.2 5" />
    <path d="M15.5 5.3a3.4 3.4 0 0 1 0 6.4M18 14.8c1.6.7 2.7 2.3 3.2 4.7" />
  </>,
);
export const HomePinGlyph = g(
  'home-pin',
  <>
    <path className="g-tint" d="M5 10 12 4.5l7 5.5v10H5z" />
    <path d="M3.5 11.2 12 4.5l8.5 6.7M5 10v10h14V10" />
    <circle className="g-dot" cx="12" cy="14.6" r="1.6" />
  </>,
);
export const WorkGlyph = g(
  'work',
  <>
    <rect className="g-tint" x="3.5" y="7.5" width="17" height="12" rx="2.5" />
    <rect x="3.5" y="7.5" width="17" height="12" rx="2.5" />
    <path d="M9 7.5V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5v2M3.5 12.5h17" />
  </>,
);
export const StarGlyph = g(
  'star',
  <path
    className="g-fill"
    d="M12 3.6l2.5 5.1 5.6.8-4 3.9 1 5.6-5.1-2.6-5.1 2.6 1-5.6-4-3.9 5.6-.8z"
  />,
);
export const RupeeGlyph = g('rupee', <path d="M7 4.5h10M7 9h10M7 4.5h3.5a4.5 4.5 0 0 1 0 9H7l7.5 6.5" />);
export const PhoneGlyph = g(
  'phone',
  <path d="M5 4h3.5l1.7 4.3-2.2 1.4a11 11 0 0 0 6.3 6.3l1.4-2.2L20 15.5V19a1.5 1.5 0 0 1-1.6 1.5C10.8 20 4 13.2 3.5 5.6A1.5 1.5 0 0 1 5 4z" />,
);
export const MailGlyph = g(
  'mail',
  <>
    <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
    <path d="M3.8 7 12 13l8.2-6" />
  </>,
);
export const CameraGlyph = g(
  'camera',
  <>
    <path className="g-tint" d="M3.5 8.5A1.5 1.5 0 0 1 5 7h2.5l1.5-2.5h6L16.5 7H19a1.5 1.5 0 0 1 1.5 1.5v10A1.5 1.5 0 0 1 19 20H5a1.5 1.5 0 0 1-1.5-1.5z" />
    <path d="M3.5 8.5A1.5 1.5 0 0 1 5 7h2.5l1.5-2.5h6L16.5 7H19a1.5 1.5 0 0 1 1.5 1.5v10A1.5 1.5 0 0 1 19 20H5a1.5 1.5 0 0 1-1.5-1.5z" />
    <circle cx="12" cy="13.2" r="3.6" />
    <circle className="g-dot" cx="17.6" cy="10" r=".9" />
  </>,
);
export const ImageGlyph = g(
  'image',
  <>
    <rect x="3.5" y="4.5" width="17" height="15" rx="3" />
    <path d="M3.5 16.5l5-5 4 4 2.5-2.5 5.5 5.5" />
    <circle className="g-dot" cx="15.5" cy="9" r="1.6" />
  </>,
);
export const MicLineGlyph = g(
  'mic-line',
  <>
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
  </>,
);
export const LinkGlyph = g('link', <path d="M10 14a4 4 0 0 0 5.7 0l3.5-3.5a4 4 0 0 0-5.7-5.7L12 6.3M14 10a4 4 0 0 0-5.7 0l-3.5 3.5a4 4 0 0 0 5.7 5.7l1.5-1.5" />);
export const InfoGlyph = g(
  'info',
  <>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 11v5.5" />
    <circle className="g-fill" cx="12" cy="7.8" r="1.1" stroke="none" />
  </>,
);
export const HelpGlyph = g(
  'help',
  <>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M9.6 9.6a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .8-1 1.5v.6" />
    <circle className="g-fill" cx="12" cy="16.9" r="1.1" stroke="none" />
  </>,
);

/* ---------- Settings ---------- */
export const PaletteGlyph = g(
  'palette',
  <>
    <path d="M12 3.5a8.5 8.5 0 0 0 0 17c1.4 0 2-1 1.5-2.2-.6-1.5.3-2.8 1.9-2.8h1.8a3.3 3.3 0 0 0 3.3-3.3A8.6 8.6 0 0 0 12 3.5z" />
    <circle className="g-fill" cx="7.8" cy="11" r="1.2" stroke="none" />
    <circle className="g-fill" cx="10.5" cy="7.4" r="1.2" stroke="none" />
    <circle className="g-dot" cx="15" cy="7.8" r="1.4" />
  </>,
);
export const GlobeGlyph = g(
  'globe',
  <>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M3.5 12h17M12 3.5c2.3 2.4 3.4 5.2 3.4 8.5s-1.1 6.1-3.4 8.5c-2.3-2.4-3.4-5.2-3.4-8.5S9.7 5.9 12 3.5z" />
  </>,
);
export const ShieldGlyph = g(
  'shield',
  <>
    <path className="g-tint" d="M12 3l7.5 3v5.5c0 4.6-3.2 8.3-7.5 9.5-4.3-1.2-7.5-4.9-7.5-9.5V6z" />
    <path d="M12 3l7.5 3v5.5c0 4.6-3.2 8.3-7.5 9.5-4.3-1.2-7.5-4.9-7.5-9.5V6z" />
    <path d="M8.8 12.2l2.2 2.2 4.3-4.4" />
  </>,
);
export const LockGlyph = g(
  'lock',
  <>
    <rect x="5" y="10.5" width="14" height="10" rx="2.5" />
    <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
    <circle className="g-dot" cx="12" cy="15.5" r="1.4" />
  </>,
);
export const EyeGlyph = g(
  'eye',
  <>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
    <circle cx="12" cy="12" r="3" />
  </>,
);
export const BellOffGlyph = g(
  'bell-off',
  <>
    <path d="M8.3 4.7A6 6 0 0 1 18 9.5c0 3.2.8 5 1.5 6M17 16.5H3.7S6 15 6 9.5M10 19.6a2 2 0 0 0 4 0M3.5 3.5l17 17" />
  </>,
);
export const MoonGlyph = g('moon', <path d="M19.5 14.5A8 8 0 1 1 9.5 4.5a6.5 6.5 0 0 0 10 10z" />);
export const SunGlyph = g(
  'sun',
  <>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.8v2M12 19.2v2M2.8 12h2M19.2 12h2M5.5 5.5l1.4 1.4M17.1 17.1l1.4 1.4M5.5 18.5l1.4-1.4M17.1 6.9l1.4-1.4" />
  </>,
);
export const TextSizeGlyph = g('text-size', <path d="M3.5 18.5 8.5 6l5 12.5M5.3 14h6.4M14.5 18.5l3-7.5 3 7.5M15.6 16h3.8" />);
export const AccessibilityGlyph = g(
  'accessibility',
  <>
    <circle cx="12" cy="12" r="8.5" />
    <circle className="g-fill" cx="12" cy="7.6" r="1.4" stroke="none" />
    <path d="M7.5 10.2 12 11l4.5-.8M12 11v3.2l-2.2 3.8M12 14.2l2.2 3.8" />
  </>,
);
export const LayersGlyph = g(
  'layers',
  <>
    <path className="g-tint" d="M12 3.5 21 8.5l-9 5-9-5z" />
    <path d="M12 3.5 21 8.5l-9 5-9-5z" />
    <path d="M3 12.5l9 5 9-5M3 16.5l9 5 9-5" />
  </>,
);
export const WifiGlyph = g(
  'wifi',
  <>
    <path d="M2.5 9a14 14 0 0 1 19 0M5.5 12.5a9.5 9.5 0 0 1 13 0M8.6 15.9a5 5 0 0 1 6.8 0" />
    <circle className="g-dot" cx="12" cy="19.2" r="1.4" />
  </>,
);
export const KeyGlyph = g(
  'key',
  <>
    <circle cx="8" cy="15" r="4.5" />
    <path d="M11.3 11.7 20 3M16.5 6.5l2.5 2.5M14 9l2 2" />
  </>,
);
export const DataGlyph = g(
  'data',
  <>
    <ellipse cx="12" cy="6" rx="7.5" ry="2.8" />
    <path d="M4.5 6v12c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8V6M4.5 12c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8" />
  </>,
);

/* ---------- Getting around ---------- */
export const BusGlyph = g(
  'bus',
  <>
    <path className="g-tint" d="M5 6.5h14v6H5z" />
    <rect x="4" y="3.5" width="16" height="15" rx="3" />
    <path d="M4 12.5h16M4 7h16M7 18.5v2M17 18.5v2" />
    <circle className="g-fill" cx="7.8" cy="15.4" r="1" stroke="none" />
    <circle className="g-fill" cx="16.2" cy="15.4" r="1" stroke="none" />
  </>,
);
export const CarGlyph = g(
  'car',
  <>
    <path className="g-tint" d="M5 11.5 6.8 6.8A2 2 0 0 1 8.7 5.5h6.6a2 2 0 0 1 1.9 1.3l1.8 4.7z" />
    <path d="M3.5 17.5v-4a2 2 0 0 1 1.5-2l1.8-4.7A2 2 0 0 1 8.7 5.5h6.6a2 2 0 0 1 1.9 1.3l1.8 4.7a2 2 0 0 1 1.5 2v4z" />
    <path d="M5 11.5h14M5.5 17.5v2M18.5 17.5v2" />
    <circle className="g-fill" cx="7.5" cy="14.5" r="1" stroke="none" />
    <circle className="g-fill" cx="16.5" cy="14.5" r="1" stroke="none" />
  </>,
);
/** The Ahmedabad auto-rickshaw: canopy, single front wheel, two at the back. */
export const AutoGlyph = g(
  'auto',
  <>
    <path className="g-tint" d="M5 7.5c0-1.7 1.3-3 3-3h7c2.6 0 4.6 2 5 4.6l.5 3.4H5z" />
    <path d="M5 16.5v-9c0-1.7 1.3-3 3-3h7c2.6 0 4.6 2 5 4.6l.5 3.4v4h-1.5" />
    <path d="M5 12.5h15.5M12.5 4.5v8M8.6 16.5h7" />
    <circle cx="6.6" cy="17.4" r="2" />
    <circle cx="17.4" cy="17.4" r="2" />
  </>,
);
export const BikeGlyph = g(
  'bike',
  <>
    <circle cx="5.5" cy="16.5" r="3.3" />
    <circle cx="18.5" cy="16.5" r="3.3" />
    <path d="M5.5 16.5 9 9.5h6l3.5 7M9 9.5l3.5 7H15M14 6.5h2.5l-1.5 3" />
  </>,
);
export const WalkGlyph = g(
  'walk',
  <>
    <circle cx="13" cy="4.6" r="1.8" />
    <path d="M10.5 21l2-6-2.5-2.5 1-5 3 2.5 2.5 1M11 7.5 7.5 9.5 7 13M12.5 15l2.5 6" />
  </>,
);
export const ParkingGlyph = g(
  'parking',
  <>
    <rect className="g-tint" x="3.5" y="3.5" width="17" height="17" rx="4" />
    <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
    <path d="M9.5 17V7.5h3.3a3 3 0 0 1 0 6H9.5" />
  </>,
);
export const RouteGlyph = g(
  'route',
  <>
    <circle cx="6" cy="18" r="2.4" />
    <circle className="g-dot" cx="18" cy="6" r="2.4" />
    <path d="M8.4 18H16a3.3 3.3 0 0 0 0-6.6H8a3.3 3.3 0 0 1 0-6.6h7.6" strokeDasharray="2.6 2.4" />
  </>,
);

/* ---------- Emergency & health ---------- */
export const HospitalGlyph = g(
  'hospital',
  <>
    <rect className="g-tint" x="3.5" y="3.5" width="17" height="17" rx="4" />
    <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
    <path d="M12 8v8M8 12h8" strokeWidth="2.4" />
  </>,
);
export const PoliceGlyph = g(
  'police',
  <>
    <path className="g-tint" d="M12 3l7.5 3v5.5c0 4.6-3.2 8.3-7.5 9.5-4.3-1.2-7.5-4.9-7.5-9.5V6z" />
    <path d="M12 3l7.5 3v5.5c0 4.6-3.2 8.3-7.5 9.5-4.3-1.2-7.5-4.9-7.5-9.5V6z" />
    <path className="g-fill" d="M12 7.6l1.2 2.5 2.7.4-2 1.9.5 2.7-2.4-1.3-2.4 1.3.5-2.7-2-1.9 2.7-.4z" stroke="none" />
  </>,
);
export const FireGlyph = g(
  'fire',
  <>
    <path className="g-tint fire__flame" d="M12 21c3.6 0 6-2.5 6-6 0-4.3-3.5-6.2-4.4-11-2.4 1.6-3.8 4-3.6 6.6-1-.6-1.8-1.6-2-2.8C6.6 9.5 6 11.4 6 15c0 3.5 2.4 6 6 6z" />
    <path className="fire__flame" d="M12 21c3.6 0 6-2.5 6-6 0-4.3-3.5-6.2-4.4-11-2.4 1.6-3.8 4-3.6 6.6-1-.6-1.8-1.6-2-2.8C6.6 9.5 6 11.4 6 15c0 3.5 2.4 6 6 6z" />
    <path d="M12 21c-1.6 0-2.7-1.2-2.7-2.8 0-1.8 1.6-2.6 2.7-4.4 1.1 1.8 2.7 2.6 2.7 4.4 0 1.6-1.1 2.8-2.7 2.8z" strokeWidth="1.5" />
  </>,
);
export const AmbulanceGlyph = g(
  'ambulance',
  <>
    <path className="g-tint" d="M2.5 7h11v10h-11z" />
    <path d="M2.5 17V7h11v10M13.5 10h4l3.5 3.5V17h-1.5M6 17h6" />
    <path d="M8 9.4v5.2M5.4 12h5.2" strokeWidth="1.8" />
    <circle cx="7.4" cy="17.8" r="1.8" />
    <circle cx="17.8" cy="17.8" r="1.8" />
    <path className="ambulance__siren" d="M7 3.6h2" strokeWidth="2.4" stroke="var(--red, #d6383f)" />
  </>,
);
export const WomanGlyph = g(
  'woman',
  <>
    <circle cx="12" cy="7" r="3.6" />
    <path d="M8 6.5c-1 4-2.5 5.5-3.5 6.5 2 .3 3.7-.3 5-1.4M16 6.5c1 4 2.5 5.5 3.5 6.5-2 .3-3.7-.3-5-1.4M5.5 21c1-3.8 3.6-5.8 6.5-5.8s5.5 2 6.5 5.8" />
  </>,
);
export const ChildGlyph = g(
  'child',
  <>
    <circle cx="12" cy="6.5" r="3" />
    <path d="M7 11.5l5 1.5 5-1.5M12 13v3.5M12 16.5 9.5 21M12 16.5l2.5 4.5" />
  </>,
);
export const SosGlyph = g(
  'sos',
  <>
    <circle className="g-tint" cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="8.5" />
    <circle className="sos__ring" cx="12" cy="12" r="11" strokeWidth="1.2" />
    <path d="M12 7.5v5" strokeWidth="2.4" />
    <circle className="g-fill" cx="12" cy="16" r="1.3" stroke="none" />
  </>,
);

/* ---------- Civic issue types ---------- */
export const PotholeGlyph = g(
  'pothole',
  <>
    <path className="g-tint" d="M8.2 3.5h7.6L21 20.5H3z" />
    <path d="M8.2 3.5 3 20.5M15.8 3.5l5.2 17" />
    <path d="M12 4v2.4M12 17.6v2.4" strokeWidth="1.6" />
    <path d="M7.6 12.4c.5-1.2 2.2-1.9 4.4-1.9s3.9.7 4.4 1.9c.4 1.1-.7 2.5-2.2 2.7-1.1.1-1.5-.5-2.4-.4-1.1.1-1.8.7-2.8.3-1.1-.4-1.8-1.5-1.4-2.6z" />
    <circle className="g-dot" cx="17.6" cy="16.4" r="1.1" />
  </>,
);
export const BinGlyph = g(
  'bin',
  <>
    <path className="g-tint" d="M6 8h12l-1.1 12.5H7.1z" />
    <path d="M6 8h12l-1.1 12.5H7.1zM4.5 8h15M9.5 8V5.5h5V8" />
    <path d="M10 11.5v5.5M14 11.5v5.5" strokeWidth="1.5" />
  </>,
);
export const StreetlightGlyph = g(
  'streetlight',
  <>
    <path d="M8 21V7a3 3 0 0 1 3-3h5.5M5 21h6" />
    <path className="g-tint" d="M14 4h6l-1 2.5h-4z" />
    <path d="M14 4h6l-1 2.5h-4z" />
    <path className="streetlight__beam" d="M14.5 9l-1 2.5M17 9v2.8M19.5 9l1 2.5" strokeWidth="1.5" stroke="var(--g-sun, #e8a628)" />
  </>,
);
export const DrainGlyph = g(
  'drain',
  <>
    <rect className="g-tint" x="4" y="9" width="16" height="9" rx="2" />
    <rect x="4" y="9" width="16" height="9" rx="2" />
    <path d="M8 9v9M12 9v9M16 9v9" strokeWidth="1.5" />
    <path className="drain__drip" d="M7 4.5c0 1 1 1.2 1 2.2M12 3.5c0 1 1 1.2 1 2.2M17 4.5c0 1 1 1.2 1 2.2" strokeWidth="1.5" stroke="var(--g-rain, #4a8fe0)" />
  </>,
);
/** Stray cattle on the road: a cow's face. */
export const CattleGlyph = g(
  'cattle',
  <>
    <path className="g-tint" d="M8 9.5h8l-.6 7.5a3 3 0 0 1-3 2.8h-.8a3 3 0 0 1-3-2.8z" />
    <path d="M8 9.5h8l-.6 7.5a3 3 0 0 1-3 2.8h-.8a3 3 0 0 1-3-2.8z" />
    <path d="M8 9.5C6 9.5 4 8.2 3.5 6.5 5.3 6.3 7 7 8 8M16 9.5c2 0 4-1.3 4.5-3-1.8-.2-3.5.5-4.5 1.5M9 7c-.6-1.4-.3-2.8.6-3.6M15 7c.6-1.4.3-2.8-.6-3.6" />
    <path d="M10.6 16.5h.1M13.3 16.5h.1" strokeWidth="2" />
    <circle className="g-fill" cx="10.2" cy="12.2" r=".8" stroke="none" />
    <circle className="g-fill" cx="13.8" cy="12.2" r=".8" stroke="none" />
  </>,
);
export const TreeGlyph = g(
  'tree',
  <>
    <path className="g-tint" d="M12 3a5.5 5.5 0 0 1 5.3 7 4.5 4.5 0 0 1-2.3 8.5H9a4.5 4.5 0 0 1-2.3-8.5A5.5 5.5 0 0 1 12 3z" />
    <path d="M12 3a5.5 5.5 0 0 1 5.3 7 4.5 4.5 0 0 1-2.3 8.5H9a4.5 4.5 0 0 1-2.3-8.5A5.5 5.5 0 0 1 12 3z" />
    <path d="M12 21v-9M12 15l-2.5-2" />
  </>,
);
export const NoiseGlyph = g(
  'noise',
  <>
    <path className="g-tint" d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
    <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
    <path className="noise__wave" d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />
  </>,
);
export const FootpathGlyph = g(
  'footpath',
  <>
    <path d="M3 20.5 7 3.5M21 20.5 17 3.5" />
    <path className="g-tint" d="M9.2 7h5.6l.9 4H8.3zM7.8 13h8.4l1.1 5H6.7z" />
    <path d="M9.2 7h5.6l.9 4H8.3zM7.8 13h8.4l1.1 5H6.7z" strokeWidth="1.5" />
  </>,
);

/* ---------- Bills & documents ---------- */
export const BillGlyph = g(
  'bill',
  <>
    <path className="g-tint" d="M5.5 3.5h13v17l-2.2-1.5-2.1 1.5-2.2-1.5-2.2 1.5L7.7 19l-2.2 1.5z" />
    <path d="M5.5 3.5h13v17l-2.2-1.5-2.1 1.5-2.2-1.5-2.2 1.5L7.7 19l-2.2 1.5z" />
    <path d="M9 8h6M9 11.5h6M9 15h3.5" strokeWidth="1.6" />
  </>,
);
export const GasGlyph = g(
  'gas',
  <>
    <path className="g-tint" d="M7 9a5 5 0 0 1 10 0v10a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 7 19z" />
    <path d="M7 9a5 5 0 0 1 10 0v10a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 7 19zM10 4V2.8h4V4M7 13h10" />
    <circle className="g-dot" cx="12" cy="16.6" r="1.2" />
  </>,
);
export const PropertyGlyph = g(
  'property',
  <>
    <path className="g-tint" d="M5 10 12 4.5l7 5.5v10H5z" />
    <path d="M3.5 11.2 12 4.5l8.5 6.7M5 10v10h14V10" />
    <path d="M9.6 12.2h4.8M9.6 14.4h4.8M9.6 12.2h1.6a2 2 0 0 1 0 4.2h-1.6l3.6 2.4" strokeWidth="1.4" />
  </>,
);
export const CertificateGlyph = g(
  'certificate',
  <>
    <path className="g-tint" d="M5 3.5h10l4 4v13H5z" />
    <path d="M5 3.5h10l4 4v13H5zM15 3.5v4h4" />
    <path d="M8.5 10.5h7M8.5 13.5h4" strokeWidth="1.6" />
    <circle className="g-dot" cx="15" cy="16.8" r="1.8" />
  </>,
);
export const WaterTapGlyph = g(
  'water-tap',
  <>
    <path d="M4 9.5h9a3 3 0 0 1 3 3V14M4 6.5v6M7.5 6.5v-2h3v2" />
    <path className="water-tap__drop" d="M16 17.5s-1.6 1.8-1.6 2.9a1.6 1.6 0 0 0 3.2 0c0-1.1-1.6-2.9-1.6-2.9z" fill="var(--g-rain, #4a8fe0)" stroke="var(--g-rain, #4a8fe0)" />
  </>,
);
export const BoltGlyph = g(
  'bolt',
  <>
    <path className="g-tint" d="M13 2.5 5.5 13.5H11l-1 8 7.5-11H12z" />
    <path d="M13 2.5 5.5 13.5H11l-1 8 7.5-11H12z" />
  </>,
);
export const LibraryGlyph = g(
  'library',
  <>
    <path className="g-tint" d="M5 4.5h4v15H5z" />
    <path d="M5 4.5h4v15H5zM9 6.5h4v13H9zM14.2 7.2l3.8-1 3.4 12.6-3.8 1z" />
  </>,
);
export const VaccineGlyph = g(
  'health',
  <>
    <path className="g-tint" d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z" />
    <path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z" />
    <path d="M7.5 12.5h2.4l1.3-2.3 1.8 4.3 1.3-2h2.2" strokeWidth="1.6" />
  </>,
);

/* ---------- Source marks (where information came from) ---------- */
export const ReelGlyph = g(
  'reel',
  <>
    <rect className="g-tint" x="3.5" y="3.5" width="17" height="17" rx="5" />
    <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
    <path className="g-fill" d="M10 9v6l5-3z" stroke="none" />
  </>,
);
export const NewsGlyph = g(
  'news',
  <>
    <path className="g-tint" d="M4 5.5h12.5v13a1.5 1.5 0 0 0 1.5 1.5H6a2 2 0 0 1-2-2z" />
    <path d="M4 5.5h12.5v13a1.5 1.5 0 0 0 1.5 1.5H6a2 2 0 0 1-2-2zM16.5 9.5H20v9a1.5 1.5 0 0 1-3 0" />
    <path d="M7.5 9h5.5M7.5 12.5h5.5M7.5 16h3.5" strokeWidth="1.5" />
  </>,
);
export const CloudGlyph = g(
  'cloud',
  <>
    <path className="g-tint" d="M7 19h10.5a3.5 3.5 0 0 0 .3-7 5 5 0 0 0-9.6-1.2A4.1 4.1 0 0 0 7 19z" />
    <path d="M7 19h10.5a3.5 3.5 0 0 0 .3-7 5 5 0 0 0-9.6-1.2A4.1 4.1 0 0 0 7 19z" />
  </>,
);
export const AirGlyph = g(
  'air',
  <>
    <path d="M3 9h11a3 3 0 1 0-3-3M3 13h15a3 3 0 1 1-3 3M3 17h7" />
  </>,
);

/* ---------- v2 additions ---------- */
export const ArrowRightGlyph = g('arrow-right', <path d="M5 12h14M13 6l6 6-6 6" />, 2.3);
export const KebabGlyph = g(
  'kebab',
  <>
    <circle cx="12" cy="5.5" r="1.5" className="g-fill" stroke="none" />
    <circle cx="12" cy="12" r="1.5" className="g-fill" stroke="none" />
    <circle cx="12" cy="18.5" r="1.5" className="g-fill" stroke="none" />
  </>,
);
export const MenuGlyph = g('menu', <path d="M4 7h16M4 12h16M4 17h10" />);
export const LocateGlyph = g(
  'locate',
  <>
    <circle cx="12" cy="12" r="6.5" />
    <circle className="g-fill" cx="12" cy="12" r="2.4" stroke="none" />
    <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3" />
  </>,
);

/** The lime four-point sparkle that punctuates headlines. */
export function SparkleMark({ size = 22, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={`sparkle-mark ${className ?? ''}`} aria-hidden="true">
      <path d="M12 1.5c.9 5.6 4.9 9.6 10.5 10.5-5.6.9-9.6 4.9-10.5 10.5C11.1 16.9 7.1 12.9 1.5 12 7.1 11.1 11.1 7.1 12 1.5z" fill="var(--lime-strong)" />
    </svg>
  );
}

/** The lime squiggle under "favourite". */
export function SquiggleMark({ width = 34, className }: { width?: number; className?: string }) {
  return (
    <svg width={width} height={(width * 14) / 40} viewBox="0 0 40 14" className={`squiggle-mark ${className ?? ''}`} aria-hidden="true">
      <path d="M2 9c4-6 8-6 10 0s6 6 9 0 7-6 10 0 5 4 7 1" fill="none" stroke="var(--lime-strong)" strokeWidth="3.6" strokeLinecap="round" />
    </svg>
  );
}
export const PushPinGlyph = g('pushpin', <path d="M9 3h6l-1 6 3 3v2H7v-2l3-3-1-6zM12 14v7" />);
/** A shop front: marks a business page. */
export const StoreGlyph = g('store', <path d="M4.5 10v10h15V10M3.5 4.5h17l-1 4a2.6 2.6 0 0 1-5 .3 2.6 2.6 0 0 1-5 0 2.6 2.6 0 0 1-5-.3zM10 20v-5h4v5" />);
