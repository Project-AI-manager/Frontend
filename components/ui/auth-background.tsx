import { useId } from "react";

export function AuthBackground() {
  const id = useId().replaceAll(":", "");
  const patternId = `${id}-auth-doodle-pattern`;
  const waveId = `${id}-auth-wave`;

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 size-full"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <pattern id={patternId} width="360" height="320" patternUnits="userSpaceOnUse">
          <g fill="none" stroke="#c2d3e9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <g transform="translate(120 87) rotate(6) scale(2.09)" strokeWidth="0.72"><path d="M3 10a13 13 0 0 1 18 0" /><path d="M6.5 13.5a8 8 0 0 1 11 0" /><circle cx="12" cy="18" r="1.4" fill="#c2d3e9" stroke="none" /></g>
            <g transform="translate(4 5) scale(1.77)" strokeWidth="0.85"><path d="M13.8 2.6 5 13.8h5.2l-1.6 7.8 8.8-11.2h-5z" /></g>
            <g transform="translate(364 5) scale(1.77)" strokeWidth="0.85"><path d="M13.8 2.6 5 13.8h5.2l-1.6 7.8 8.8-11.2h-5z" /></g>
            <g transform="translate(215 203) scale(1.84)" strokeWidth="0.82"><path d="M3 10a13 13 0 0 1 18 0" /><path d="M6.5 13.5a8 8 0 0 1 11 0" /><circle cx="12" cy="18" r="1.4" fill="#c2d3e9" stroke="none" /></g>
            <Network transform="translate(262 291) scale(1.84)" />
            <Network transform="translate(262 -29) scale(1.84)" />
            <Network transform="translate(327 222) rotate(-20) scale(1.85)" />
            <Network transform="translate(-33 222) rotate(-20) scale(1.85)" />
            <Compass transform="translate(108 -9) scale(2.09)" />
            <Compass transform="translate(108 311) scale(2.09)" />
            <Spark transform="translate(-5 95) scale(1.79)" />
            <Spark transform="translate(355 95) scale(1.79)" />
            <Envelope transform="translate(38 46) scale(1.99)" />
            <Network transform="translate(102 211) scale(2.02)" />
            <Headphones transform="translate(279 25) scale(2.01)" />
            <Compass transform="translate(258 106) scale(1.68)" />
            <Compass transform="translate(34 269) scale(1.67)" />
            <Document transform="translate(200 14) rotate(-9) scale(1.92)" />
            <Pin transform="translate(326 140) scale(1.86)" />
            <Pin transform="translate(-34 140) scale(1.86)" />
            <Chat transform="translate(115 164) scale(1.57)" />
            <Pin transform="translate(52 217) scale(1.76)" />
            <Pin transform="translate(155 35) rotate(1) scale(1.52)" />
            <Bolt transform="translate(74 106) rotate(21) scale(1.67)" />
            <Wifi transform="translate(134 265) scale(1.59)" />
            <Document transform="translate(-12 277) rotate(8) scale(1.57)" />
            <Document transform="translate(348 277) rotate(8) scale(1.57)" />
            <Plane transform="translate(165 142) rotate(-49) scale(1.44)" />
            <Envelope transform="translate(223 63) scale(1.51)" />
            <Cloud transform="translate(27 184) scale(1.59)" />
            <Cloud transform="translate(258 162) scale(1.58)" />
            <Document transform="translate(284 214) rotate(-8) scale(1.5)" />
            <Spark transform="translate(303 260) rotate(-6) scale(1.31)" />
            <Propeller transform="translate(169 -6) scale(1.27)" />
            <Propeller transform="translate(169 314) scale(1.27)" />
            <Headphones transform="translate(66 4) scale(1.47)" />
            <Plane transform="translate(311 88) rotate(13) scale(1.35)" />
            <Chat transform="translate(183 272) scale(1.28)" />
            <Envelope transform="translate(163 179) scale(1.41)" />
            <Cloud transform="translate(341 54) scale(1.47)" />
            <Cloud transform="translate(-19 54) scale(1.47)" />
            <Spark transform="translate(214 149) scale(1.43)" />
            <Chat transform="translate(31 142) scale(1.23)" />
            <Headphones transform="translate(261 245) scale(1.38)" />
            <Spark transform="translate(165 239) rotate(-17) scale(1.21)" />
            <Propeller transform="translate(109 56) scale(1.17)" />
            <Bolt transform="translate(89 271) scale(1.34)" />
            <Propeller transform="translate(72 182) scale(1.15)" />
            <Chat transform="translate(176 82) scale(1.17)" />
            <Pin transform="translate(213 107) scale(1.34)" />
            <Plane transform="translate(338 -6) rotate(69) scale(1.22)" />
            <Plane transform="translate(338 314) rotate(69) scale(1.22)" />
            <Cloud transform="translate(225 262) scale(1.37)" />
            <Bolt transform="translate(306 173) rotate(20) scale(1.13)" />
          </g>
        </pattern>
        <path id={waveId} d="M-120-700q20.2 21.8 50 21.67t50 21.67 50 21.67 50 21.67 50 21.67 50 21.67 50 21.67 50 21.67 50 21.67 50 21.67 50 21.67 50 21.67 50 21.67 50 21.67 50 21.67 50 21.67 50 21.67 50 21.67 50 21.67 50 21.67 50 21.67 50 21.67 50 21.67 50 21.67 50 21.67 50 21.67 50 21.67 50 21.67 50 21.67 50 21.67 50 21.67" />
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      <g fill="none" stroke="#c6d5e9" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="5 8">
        {Array.from({ length: 14 }, (_, index) => <use key={index} href={`#${waveId}`} y={index * 160} />)}
      </g>
    </svg>
  );
}

function Network({ transform }: { transform: string }) { return <g transform={transform} strokeWidth="0.82"><circle cx="4.5" cy="5.5" r="2" /><circle cx="19" cy="8" r="2" /><circle cx="7" cy="19" r="2" /><circle cx="18.5" cy="18" r="2" /><path d="M6.4 6 17.1 7.5M5 7.5 6.4 17M9 18.9 16.5 18.2M19 10 18.7 16M6.5 7 17.3 16.7" /></g>; }
function Compass({ transform }: { transform: string }) { return <g transform={transform}><circle cx="12" cy="12" r="9.5" /><path d="M15.5 8.5 13.5 13.5 8.5 15.5 10.5 10.5z" /></g>; }
function Spark({ transform }: { transform: string }) { return <g transform={transform}><path d="M12 2.5c.8 6.4 2.6 8.2 9 9-6.4.8-8.2 2.6-9 9-.8-6.4-2.6-8.2-9-9 6.4-.8 8.2-2.6 9-9z" /></g>; }
function Envelope({ transform }: { transform: string }) { return <g transform={transform}><path d="M2.5 5.5h19v13h-19zM2.5 6.5 12 13.5 21.5 6.5" /></g>; }
function Headphones({ transform }: { transform: string }) { return <g transform={transform}><path d="M4.5 14.5a7.5 7.5 0 0 1 15 0M3 15.5h3.2v5H4.5A1.5 1.5 0 0 1 3 19zM17.8 15.5H21V19a1.5 1.5 0 0 1-1.5 1.5h-1.7z" /></g>; }
function Document({ transform }: { transform: string }) { return <g transform={transform}><path d="M6 2.5h8l4 4v15H6zM14 2.5v4h4M9 12h6M9 15.5h6" /></g>; }
function Pin({ transform }: { transform: string }) { return <g transform={transform}><path d="M12 21.2s6.8-6.1 6.8-10.7a6.8 6.8 0 1 0-13.6 0c0 4.6 6.8 10.7 6.8 10.7z" /><circle cx="12" cy="10.4" r="2.4" /></g>; }
function Chat({ transform }: { transform: string }) { return <g transform={transform}><path d="M4 4h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-8l-5 4v-4H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" /><circle cx="8" cy="10" r="1" fill="#c2d3e9" stroke="none" /><circle cx="12" cy="10" r="1" fill="#c2d3e9" stroke="none" /><circle cx="16" cy="10" r="1" fill="#c2d3e9" stroke="none" /></g>; }
function Bolt({ transform }: { transform: string }) { return <g transform={transform}><path d="M13.8 2.6 5 13.8h5.2l-1.6 7.8 8.8-11.2h-5z" /></g>; }
function Wifi({ transform }: { transform: string }) { return <g transform={transform}><path d="M3 10a13 13 0 0 1 18 0M6.5 13.5a8 8 0 0 1 11 0" /><circle cx="12" cy="18" r="1.4" fill="#c2d3e9" stroke="none" /></g>; }
function Plane({ transform }: { transform: string }) { return <g transform={transform}><path d="M21 3 3 9.75 9.4 13.1 11.6 19.5zM21 3 9.4 13.1" /></g>; }
function Cloud({ transform }: { transform: string }) { return <g transform={transform}><path d="M5.5 17.5a4 4 0 0 1 .4-8 5.5 5.5 0 0 1 10.6-1.6A4.5 4.5 0 1 1 17.5 17.5z" /></g>; }
function Propeller({ transform }: { transform: string }) { return <g transform={transform}>{[0, 120, 240].map((angle) => <g key={angle} transform={`rotate(${angle} 12 12)`}><path d="M12 10.2C11 6.4 11.4 3 12 2.4c.6.6 1 4 0 7.8z" /></g>)}<circle cx="12" cy="12" r="1.8" /></g>; }
