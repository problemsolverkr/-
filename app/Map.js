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

// 🎯 ICON
const createIcon = (report) =>
  L.divIcon({
    html: `
    <div style="font-size:30px; position:relative;">
      🚬
      ${
        report.cleaned
          ? `<span style="position:absolute; top:-5px; right:-5px; color:green;">✔</span>`
          : ""
      }
    </div>
    `,
    iconSize: [30, 30],
    className: "",
  })

export default function Map() {
  const [isMounted, setIsMounted] = useState(false)
  const [user, setUser] = useState(null)

  const [position, setPosition] = useState(null)
  const [image, setImage] = useState(null)
  const [severity, setSeverity] = useState("보통")
  const [description, setDescription] = useState("")
  const [reports, setReports] = useState([])
  const [cleanCount, setCleanCount] = useState(0)

  // 📍 GPS
  const getCurrentLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition([pos.coords.latitude, pos.coords.longitude])
      },
      () => alert("위치 권한을 허용해주세요 📍")
    )
  }

  // 🎨 severity color
  const getSeverityColor = (s) => {
    if (s === "적음") return "#16a34a"
    if (s === "보통") return "#f59e0b"
    if (s === "심각") return "#dc2626"
    return "#999"
  }

  useEffect(() => {
    setIsMounted(true)

    // 📥 fetch reports
    const fetchReports = async () => {
      const { data } = await supabase.from("reports").select("*")
      if (data) {
        setReports(
          data.map((r) => ({
            id: r.id,
            position: [r.lat, r.lng],
            severity: r.severity,
            description: r.description,
            image: r.image_url,
            afterImage: r.after_url,
            cleaned: r.cleaned,
            user_id: r.user_id,
          }))
        )
      }
    }

    fetchReports()

    // 🔐 initial user
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user || null)
    })

    // 🔥 auth listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user || null
      setUser(currentUser)

      if (currentUser) {
        const { count } = await supabase
          .from("reports")
          .select("*", { count: "exact", head: true })
          .eq("user_id", currentUser.id)
          .eq("cleaned", true)

        setCleanCount(count || 0)
      } else {
        setCleanCount(0)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  if (!isMounted) return null

  // 💾 SAVE REPORT
  const saveReport = async () => {
    if (!user) return alert("로그인 필요 🔐")
    if (!position || !image) return alert("사진 필요 📸")

    const fileName = `${Date.now()}-${image.name}`

    const { error: uploadError } = await supabase.storage
      .from("report-images")
      .upload(fileName, image)

    if (uploadError) return alert("이미지 업로드 실패")

    const imageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/report-images/${fileName}`

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

    if (error) return alert("저장 실패")

    alert("제보 완료 🎉")
    window.location.reload()
  }

  // 📍 click
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
      {/* GPS BUTTON */}
      <button
        onClick={getCurrentLocation}
        style={{
          position: "absolute",
          bottom: "20px",
          right: "20px",
          zIndex: 400,
          padding: "6px 10px",
          fontSize: "12px",
        }}
      >
        📍 내 위치
      </button>

      <MapContainer
        center={[37.5725, 126.979]}
        zoom={15}
        style={{ height: "100vh", width: "100%" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        <ClickHandler />

        {/* EXISTING */}
        {reports.map((r, i) => (
          <Marker key={r.id} position={r.position} icon={createIcon(r)}>
            <Popup>
              <p>{r.description}</p>

              {r.image && <img src={r.image} style={{ width: "100%" }} />}

              {!r.cleaned && (
                <>
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
                      const file = reports[i].afterImage
                      if (!file) return alert("사진 필요")

                      const fileName = `after-${Date.now()}-${file.name}`

                      await supabase.storage
                        .from("report-images")
                        .upload(fileName, file)

                      const afterUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/report-images/${fileName}`

                      await supabase
                        .from("reports")
                        .update({
                          cleaned: true,
                          after_url: afterUrl,
                        })
                        .eq("id", r.id)

                      window.location.reload()
                    }}
                  >
                    청소 완료
                  </button>
                </>
              )}
            </Popup>
          </Marker>
        ))}

        {/* NEW REPORT */}
        {position && (
          <Marker position={position} icon={createIcon({ cleaned: false })}>
            <Popup>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
              >
                <option value="적음">적음</option>
                <option value="보통">보통</option>
                <option value="심각">심각</option>
              </select>

              <textarea
                placeholder="설명"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />

              <input
                type="file"
                onChange={(e) => setImage(e.target.files[0])}
              />

              <button onClick={saveReport}>제보</button>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </>
  )
}