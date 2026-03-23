"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../lib/supabase"

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (error) {
      alert("로그인 실패 ❌\n" + error.message)
      return
    }

    // ✅ SUCCESS
    alert("로그인 성공 🎉")

    // 👉 redirect to main map
    window.location.href = "/"
  }

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      <h2>로그인</h2>

      <input
        type="email"
        placeholder="이메일"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ padding: "8px", width: "250px" }}
      />

      <input
        type="password"
        placeholder="비밀번호"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ padding: "8px", width: "250px" }}
      />

      <button
        onClick={handleLogin}
        disabled={loading}
        style={{
          padding: "10px",
          width: "250px",
          background: loading ? "#ccc" : "#222",
          color: "white",
        }}
      >
        {loading ? "로그인 중..." : "로그인"}
      </button>
    </div>
  )
}