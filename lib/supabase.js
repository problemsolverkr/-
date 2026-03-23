import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://rrozppugscqopztdszst.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJyb3pwcHVnc2Nxb3B6dGRzenN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxOTc4NzgsImV4cCI6MjA4OTc3Mzg3OH0.V_WPuFjdHprdmIXa7fvjPDpPBd6YBSfekmusXgbETcg"

export const supabase = createClient(supabaseUrl, supabaseKey)