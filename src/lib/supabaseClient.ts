import { createClient } from '@supabase/supabase-js';

// Vercel ayarlarıyla uğraşmamak için anahtarları buraya sabitliyoruz.
// Bu anahtarlar "anon" (public) olduğu için tarayıcıda görünmesinde teknik bir sakınca yoktur.
const supabaseUrl = "https://pfutcxhomkmuejpfhkza.supabase.co";
const supabaseKey = "sb_publishable_e1-3KXpEy_ey70qMcuALiA_uUpkEW2V"; // Sizin verdiğiniz key

export const supabase = createClient(supabaseUrl, supabaseKey);
