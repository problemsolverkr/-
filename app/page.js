"use client"

import Auth from "./Auth"
import dynamic from "next/dynamic"

const Map = dynamic(() => import("./Map"), {
  ssr: false,
})

export default function Home() {
  return (
    <main>
      <h1 style={{ padding: "10px" }}>여기꽁</h1>
	  
	  <Auth />
	  
      <Map key="map" />
    </main>
  )
}