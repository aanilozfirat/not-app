import { createClient } from '@supabase/supabase-js';

// Bu değerleri .env.local dosyasından çekeceğiz
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);
