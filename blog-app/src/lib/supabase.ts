import { createClient } from '@supabase/supabase-js'

// 클라우드플레어 빌드 시 환경 변수 인식 문제를 해결하기 위해 공개 키를 직접 기입합니다.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uppnpaeboxzcqwhpcyvk.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwcG5wYWVib3h6Y3F3aHBjeXZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5MjQ3OTgsImV4cCI6MjA5MjUwMDc5OH0.AWO3ldOTb4aE-ktZpdpIM_UuOPNxIo_1nHTd9Zd55ss'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
