"use client"

import { useState, useEffect } from "react"
import L from "leaflet"
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet"
import { supabase } from "../lib/supabase"

// 🎯 ICON GENERATOR
const createIcon = (report) =>
  L.divIcon({
    html: `
    <div style="width:75px;height:75px;display:flex;align-items:center;justify-content:center;">
      <svg width="75" height="75" viewBox="0 0 75 75">

        ${
          !report.cleaned
            ? `
        <!-- White base -->
        <circle cx="37" cy="37" r="20" fill="white" opacity="0.9"/>

        <!-- Aura -->
        <circle cx="37" cy="37" r="22"
          fill="${report.severity}"
          opacity="0.25"/>
        <circle cx="37" cy="37" r="16"
          fill="${report.severity}"
          opacity="0.45"/>
        `
            : ""
        }

        <!-- Cigarette -->
        <g transform="rotate(20 37 37)">
          <rect x="34" y="8" width="6" height="10"
            fill="#f4a261" stroke="black" stroke-width="2"/>
          <rect x="34" y="18" width="6" height="2.5"
            fill="#d4af37" stroke="black" stroke-width="1.5"/>
          <rect x="34" y="20.5" width="6" height="20"
            fill="white" stroke="black" stroke-width="2"/>
          <rect x="34" y="40.5" width="6" height="7"
            fill="#1a1a1a" stroke="black" stroke-width="2"/>
        </g>

        ${
          !report.cleaned
            ? `
        <!-- Smoke -->
        <path d="M38 43 Q41 40 38 37 Q35 34 38 31"
          stroke="#ddd" stroke-width="2" fill="none"
          stroke-linecap="round"/>
        `
            : ""
        }

        ${
          report.cleaned
            ? `
        <!-- Clean badge -->
        <g transform="translate(48,8)">
          <rect width="14" height="14" rx="3"
            fill="#22c55e" stroke="black" stroke-width="1.5"/>
          <path d="M3 7 L6 10 L11 4"
            stroke="white" stroke-width="2"
            fill="none" stroke-linecap="round"/>
        </g>
        `
            : ""
        }

      </svg>
    </div>
    `,
    iconSize: [75, 75],
    iconAnchor: [37, 49],
    className: "",
  })

export default function Map() {
  // ✅ Prevent Leaflet crash
  const [isMounted, setIsMounted] = useState(false)

  // 🔐 User state
  const [user, setUser] = useState(null)
  
  // 📍 GPS: get current location
const getCurrentLocation = () => {
  if (!navigator.geolocation) {
    alert("GPS를 지원하지 않는 기기입니다")
    return
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const lat = pos.coords.latitude
      const lng = pos.coords.longitude

      setPosition([lat, lng])
    },
    () => {
      alert("위치 권한을 허용해주세요 📍")
    }
  )
}

  // 📍 Map/report state
  const [position, setPosition] = useState(null)
  const [image, setImage] = useState(null)
  const [severity, setSeverity] = useState("보통")
  const [description, setDescription] = useState("")
  const [reports, setReports] = useState([])
  const [cleanCount, setCleanCount] = useState(0)

  useEffect(() => {
  setIsMounted(true)

  // 🔐 Get user
  supabase.auth.getUser().then(({ data }) => {
  if (data.user && data.user.email_confirmed_at) {
    setUser(data.user)
  } else {
    setUser(null)
  }
})

  // 📥 Load reports
  const fetchReports = async () => {
    const { data, error } = await supabase
      .from("reports")
      .select("*")

    if (!error && data) {
      const formatted = data.map((r) => ({
  id: r.id, // ✅ ADD
  position: [r.lat, r.lng],
  severity: r.severity,
  description: r.description,
  image: r.image_url,
  afterImage: r.after_url,
  cleaned: r.cleaned,
  created_at: r.created_at,
  user_id: r.user_id, // ✅ ADD (for later)
}))

      setReports(formatted)
    }
  }

  fetchReports()
}, [])

  if (!isMounted) return null

  // 🎨 Severity colors
  const getSeverityColor = (severity) => {
    if (severity === "적음") return "#16a34a"
    if (severity === "보통") return "#f59e0b"
    if (severity === "심각") return "#dc2626"
    return "#999"
  }

  // 💾 Save report
  const saveReport = async () => {
  if (!user) {
    alert("로그인 후 제보해주세요 🔐")
    return
  }

  if (!position) return

  if (!image) {
    alert("사진을 꼭 첨부해주세요 📸")
    return
  }

  // 📅 Get today's date range
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)

  // 🔍 Count today's reports
  const { data: todayReports, error: countError } = await supabase
    .from("reports")
    .select("id")
    .eq("user_id", user.id)
    .gte("created_at", todayStart.toISOString())
    .lte("created_at", todayEnd.toISOString())

  if (countError) {
    alert("확인 실패")
    return
  }

  if (todayReports.length >= 3) {
    alert("하루 최대 3개의 제보만 가능합니다 🚫")
    return
  }

  // 📸 Upload image
  const fileName = `${Date.now()}-${image.name}`

  const { error: uploadError } = await supabase.storage
    .from("report-images")
    .upload(fileName, image)

  if (uploadError) {
    alert("이미지 업로드 실패")
    return
  }

  const imageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/report-images/${fileName}`

  // 💾 Save to DB
  const { error } = await supabase.from("reports").insert([
    {
      lat: position[0],
      lng: position[1],
      severity,
      description,
      image_url: imageUrl,
      cleaned: false,
      user_id: user.id,
    },
  ])

  if (error) {
    alert("저장 실패")
    return
  }

  alert("제보 완료 🎉")

  setPosition(null)
  setImage(null)
  setSeverity("보통")
  setDescription("")
}

  // 📍 Click handler
  function ClickHandler() {
    useMapEvents({
      click(e) {
        setPosition([e.latlng.lat, e.latlng.lng])
      },
    })
    return null
  }

 return (
  <>
    <button
      onClick={getCurrentLocation}
      style={{
  position: "absolute",
  bottom: "20px",          // 🔽 move to bottom
  right: "20px",
  zIndex: 500,             // 🔽 lower so it doesn't block UI
  background: "#222",
  color: "white",
  padding: "6px 10px",     // 🔽 smaller
  borderRadius: "20px",    // 🔽 pill style
  fontSize: "12px",        // 🔽 smaller text
  opacity: 0.9,
}}
    >
      📍 내 위치로 제보
    </button>

    <MapContainer
      key="map"
      center={[37.5725, 126.979]}
      zoom={15}
      style={{ height: "100vh", width: "100%" }}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <ClickHandler />

      {/* Existing reports */}
      {reports.map((r, i) => (
        <Marker
          key={i}
          position={r.position}
          icon={createIcon({
            ...r,
            severity: getSeverityColor(r.severity),
          })}
        >
          <Popup>
            <div style={{ width: "200px" }}>
              <h3>신고된 꽁초 🚬</h3>
              <p>심각도: {r.severity}</p>
              <p>{r.description}</p>

              {r.image && (
                <img
                  src={typeof r.image === "string" ? r.image : URL.createObjectURL(r.image)}
                  style={{ width: "100%", marginTop: "10px" }}
                />
              )}

              {r.cleaned && r.afterImage && (
                <>
                  <p>✅ 청소 완료</p>
                  <img
                    src={typeof r.afterImage === "string" ? r.afterImage : URL.createObjectURL(r.afterImage)}
                    style={{ width: "100%" }}
                  />
                </>
              )}

              {!r.cleaned && (
                <>
                  <p>📸 청소 후 사진</p>
                  <input
                    type="file"
                    onChange={(e) => {
                      const updated = [...reports]
                      updated[i].afterImage = e.target.files[0]
                      setReports(updated)
                    }}
                  />

                  <button
                    onClick={async () => {
  if (!reports[i].afterImage) {
    alert("청소 후 사진을 첨부해주세요 📸")
    return
  }

  const file = reports[i].afterImage
  const fileName = `after-${Date.now()}-${file.name}`

  // 📸 Upload AFTER image
  const { error: uploadError } = await supabase.storage
    .from("report-images")
    .upload(fileName, file)

  if (uploadError) {
    alert("이미지 업로드 실패")
    return
  }

  const afterUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/report-images/${fileName}`

  // 💾 Update DB
  const { error: updateError } = await supabase
    .from("reports")
    .update({
      cleaned: true,
      after_url: afterUrl,
    })
    .eq("id", reports[i].id)

  if (updateError) {
    alert("저장 실패")
    return
  }

  alert("청소 완료 저장됨 ✅")

  // 🔄 Update UI
  const updated = [...reports]
  updated[i].cleaned = true
  updated[i].afterImage = afterUrl
  setReports(updated)
}}
                  >
                    청소 완료 인증
                  </button>
                </>
              )}
            </div>
          </Popup>
        </Marker>
      ))}

      {/* New report */}
      {position && (
        <Marker
          position={position}
          icon={createIcon({
            severity: getSeverityColor(severity),
            cleaned: false,
          })}
        >
          <Popup>
            <div style={{ width: "200px" }}>
              <h3>여기 꽁초 있음 🚬</h3>

              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
              >
                <option value="적음">🟢 적음</option>
                <option value="보통">🟡 보통</option>
                <option value="심각">🔴 심각</option>
              </select>

              <textarea
                placeholder="설명 추가..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ width: "100%", marginTop: "10px" }}
              />

              <p>📸 현장 사진</p>
              <input
                type="file"
                onChange={(e) => setImage(e.target.files[0])}
              />

              {image && (
                <img
                  src={URL.createObjectURL(image)}
                  style={{ width: "100%", marginTop: "10px" }}
                />
              )}

              <button
                onClick={saveReport}
                disabled={!image}
                style={{
                  marginTop: "10px",
                  width: "100%",
                  backgroundColor: image ? "#222" : "#ccc",
                  color: "white",
                }}
              >
                제보하기
              </button>
            </div>
          </Popup>
        </Marker>
      )}
        </MapContainer>
  </>
)
}