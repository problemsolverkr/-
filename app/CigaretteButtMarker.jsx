import { DivIcon } from "leaflet"
import { Marker } from "react-leaflet"

const generateCigaretteSVG = (severity = "green", cleaned = false) => {
  const checkmark = cleaned
    ? `
      <circle cx="20" cy="6" r="5" fill="white" stroke="green" stroke-width="2"/>
      <path d="M17 6l2 2 3-3" stroke="green" stroke-width="2" fill="none"/>
    `
    : ""

  return `
    <svg width="40" height="40" viewBox="0 0 40 40">
      <g transform="rotate(-20 20 20)">
        <rect x="8" y="18" width="20" height="6" rx="3" fill="#d2b48c"/>
        <rect x="26" y="18" width="4" height="6" rx="2" fill="#444"/>
        <circle cx="30" cy="21" r="2" fill="#888"/>
      </g>

      <circle cx="8" cy="32" r="5" fill="${severity}" />

      ${checkmark}
    </svg>
  `
}

export default function CigaretteButtMarker({ position, report, children }) {
 const icon = new L.DivIcon({
  html: `<div style="
    width:30px;
    height:30px;
    display:flex;
    align-items:center;
    justify-content:center;
    font-size:24px;
  ">🚬</div>`,
  className: "custom-div-icon", // ✅ important
  iconSize: [30, 30],
  iconAnchor: [15, 15],
})

return (
  <Marker position={position} icon={icon}>
    {children}
  </Marker>
)
}