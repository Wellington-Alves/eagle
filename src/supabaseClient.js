// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

// Substitua pelos dados do seu projeto no Supabase
const supabaseUrl = 'https://qhyfqufpfbfkamjzcgjr.supabase.co';  // O URL do seu projeto
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoeWZxdWZwZmJma2FtanpjZ2pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgxOTY0OTgsImV4cCI6MjA1Mzc3MjQ5OH0.pT90Pj49j51d_MdE7tQelnjM2kimB9-saWfzgK-jOtw';  // A chave pública da sua API do Supabase

// Criar o cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseKey);
