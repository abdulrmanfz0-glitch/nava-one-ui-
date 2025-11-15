import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://your-project-ref.supabase.co';  // غيرها بـ URL بتاع مشروعك في Supabase
const supabaseAnonKey = 'your-anon-key';  // غيرها بـ anon key بتاعك من Supabase

export const supabase = createClient(supabaseUrl, supabaseAnonKey);