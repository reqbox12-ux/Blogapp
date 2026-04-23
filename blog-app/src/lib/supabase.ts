import { createClient } from '@supabase/supabase-js'

// 환경 변수 미인식 문제를 완전히 해결하기 위해 고정값으로 설정합니다.
const supabaseUrl = 'https://uppnpaeboxzcqwhpcyvk.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwcG5wYWVib3h6Y3F3aHBjeXZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5MjQ3OTgsImV4cCI6MjA5MjUwMDc5OH0.AWO3ldOTb4aE-ktZpdpIM_UuOPNxIo_1nHTd9Zd55ss'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
