"use client"

import { useState } from "react"
import { supabase } from "../lib/supabase"

export default function Auth() {
  const [show, setShow] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const signUp = async () => {
  const { error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    alert(error.message)
  } else {
    alert("이메일 확인 후 로그인해주세요 📩")
  }
}

  const signIn = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) alert(error.message)
    else alert("로그인 성공!")
  }

  return (
    <div style={{ position: "absolute", top: 10, right: 10, zIndex: 1000 }}>
      
      {/* Toggle Button */}
      <button onClick={() => setShow(!show)}>
        {show ? "닫기" : "로그인"}
      </button>

      {/* Dropdown */}
      {show && (
        <div style={{
          background: "white",
          padding: "15px",
          marginTop: "10px",
          borderRadius: "10px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.2)"
        }}>
          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ display: "block", marginBottom: "10px" }}
          />

          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ display: "block", marginBottom: "10px" }}
          />

          <button onClick={signUp}>회원가입</button>
          <button onClick={signIn} style={{ marginLeft: "10px" }}>
            로그인
          </button>
        </div>
      )}
    </div>
  )
}