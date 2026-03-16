/**
 * NightshadeIvy — SVG vines anchored to the header bottom and footer top,
 * with a slow draw-in animation followed by a gentle sway.
 * Only visible when mood === 'nightshade'.
 */

import { useMood } from '@/contexts/MoodContext';
import { createPortal } from 'react-dom';

/** A single vine tendril rendered as an SVG path */
const Tendril = ({ d, delay, length }: { d: string; delay: string; length: number }) => (
  <path
    d={d}
    stroke="currentColor"
    strokeWidth="1"
    fill="none"
    strokeLinecap="round"
    strokeDasharray={length}
    strokeDashoffset={length}
    style={{ animationDelay: delay }}
    className="nightshade-ivy__tendril"
  />
);

/** Header ivy — vines hang down from a horizontal anchor */
const HeaderIvy = () => (
  <svg
    className="nightshade-ivy nightshade-ivy--header"
    viewBox="0 0 1200 80"
    preserveAspectRatio="none"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Main long stem */}
    <Tendril
      d="M0,0 Q150,30 300,10 Q450,0 600,20 Q750,40 900,15 Q1050,0 1200,25"
      delay="0s"
      length={1400}
    />
    {/* Hanging tendrils at various intervals */}
    <Tendril d="M60,8 Q55,30 58,55 Q61,68 56,75" delay="0.4s" length={80} />
    <Tendril d="M60,8 Q48,35 50,60" delay="0.5s" length={60} />
    <Tendril d="M180,6 Q178,28 180,50 Q182,65 178,72" delay="0.6s" length={75} />
    <Tendril d="M320,9 Q316,35 318,60 Q320,70 316,78" delay="0.8s" length={80} />
    <Tendril d="M320,9 Q330,40 328,62" delay="0.9s" length={60} />
    <Tendril d="M480,14 Q476,38 478,58 Q480,68 476,76" delay="1.0s" length={72} />
    <Tendril d="M600,18 Q598,40 600,62 Q602,72 598,79" delay="1.2s" length={72} />
    <Tendril d="M720,12 Q716,36 718,56 Q720,66 716,74" delay="1.4s" length={72} />
    <Tendril d="M720,12 Q730,38 728,60" delay="1.5s" length={56} />
    <Tendril d="M860,10 Q856,34 858,54 Q860,64 856,72" delay="1.6s" length={72} />
    <Tendril d="M1000,8 Q996,32 998,52 Q1000,62 996,70" delay="1.8s" length={72} />
    <Tendril d="M1140,12 Q1136,36 1138,56 Q1140,66 1136,74" delay="2.0s" length={72} />
    {/* Small leaf blobs */}
    <circle
      cx="58"
      cy="75"
      r="3"
      fill="currentColor"
      opacity="0.5"
      className="nightshade-ivy__leaf"
      style={{ animationDelay: '1.2s' }}
    />
    <circle
      cx="180"
      cy="72"
      r="2.5"
      fill="currentColor"
      opacity="0.45"
      className="nightshade-ivy__leaf"
      style={{ animationDelay: '1.4s' }}
    />
    <circle
      cx="318"
      cy="78"
      r="3"
      fill="currentColor"
      opacity="0.5"
      className="nightshade-ivy__leaf"
      style={{ animationDelay: '1.6s' }}
    />
    <circle
      cx="478"
      cy="76"
      r="2.5"
      fill="currentColor"
      opacity="0.45"
      className="nightshade-ivy__leaf"
      style={{ animationDelay: '1.8s' }}
    />
    <circle
      cx="598"
      cy="79"
      r="3"
      fill="currentColor"
      opacity="0.5"
      className="nightshade-ivy__leaf"
      style={{ animationDelay: '2.0s' }}
    />
    <circle
      cx="716"
      cy="74"
      r="2.5"
      fill="currentColor"
      opacity="0.45"
      className="nightshade-ivy__leaf"
      style={{ animationDelay: '2.2s' }}
    />
    <circle
      cx="856"
      cy="72"
      r="3"
      fill="currentColor"
      opacity="0.5"
      className="nightshade-ivy__leaf"
      style={{ animationDelay: '2.4s' }}
    />
    <circle
      cx="996"
      cy="70"
      r="2.5"
      fill="currentColor"
      opacity="0.45"
      className="nightshade-ivy__leaf"
      style={{ animationDelay: '2.6s' }}
    />
    <circle
      cx="1136"
      cy="74"
      r="3"
      fill="currentColor"
      opacity="0.5"
      className="nightshade-ivy__leaf"
      style={{ animationDelay: '2.8s' }}
    />
  </svg>
);

const NightshadeIvy = () => {
  const { mood } = useMood();
  if (mood !== 'nightshade') return null;

  return createPortal(
    <>
      <HeaderIvy />
      {/* <FooterIvy /> — disabled due to positioning complexity */}
    </>,
    document.getElementById('ambient-root') || document.body
  );
};

export default NightshadeIvy;
