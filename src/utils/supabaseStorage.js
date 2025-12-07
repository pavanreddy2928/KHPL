// Supabase Configuration for KHPL
// Free tier: 500MB database, 50k monthly active users

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://your-project.supabase.co';
const supabaseKey = 'your-anon-key'; // Public anon key
const supabase = createClient(supabaseUrl, supabaseKey);

export const saveRegistrationToSupabase = async (registrationData) => {
  try {
    const { data, error } = await supabase
      .from('registrations')
      .insert([
        {
          name: registrationData.name,
          email: registrationData.email,
          phone_number: registrationData.phoneNumber,
          image_url: registrationData.imageUrl || null,
          registration_fee: registrationData.registrationFee || 500,
          payment_status: registrationData.paymentStatus || 'pending',
          created_at: new Date().toISOString()
        }
      ])
      .select();

    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('Supabase save error:', error);
    throw error;
  }
};

export const getRegistrationsFromSupabase = async () => {
  try {
    const { data, error } = await supabase
      .from('registrations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Supabase fetch error:', error);
    return [];
  }
};

export const updatePaymentStatus = async (id, status) => {
  try {
    const { data, error } = await supabase
      .from('registrations')
      .update({ payment_status: status })
      .eq('id', id)
      .select();

    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('Supabase update error:', error);
    throw error;
  }
};

// Real-time subscriptions
export const subscribeToRegistrations = (callback) => {
  return supabase
    .channel('registrations')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'registrations' }, 
      callback
    )
    .subscribe();
};

// Install: npm install @supabase/supabase-js
// SQL to create table in Supabase:
/*
CREATE TABLE registrations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  image_url TEXT,
  registration_fee INTEGER DEFAULT 500,
  payment_status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
*/