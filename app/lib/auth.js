import { supabase } from './supabase'
import bcrypt from 'bcryptjs'

// Register new user
export async function registerUser(email, password, userInfo = {}) {
  try {
    // Hash password before storing
    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    const { data, error } = await supabase.auth.signUp({
      email,
      password
    })

    if (error) throw error

    // If user is created successfully, add additional info to users table
    if (data.user) {
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          uuid: data.user.id,
          email: email,
          password_hash: hashedPassword, // Store hashed password
          info: userInfo
        })

      if (insertError) {
        console.error('Error inserting user data:', insertError)
        // Don't throw here as the auth user is already created
      }
    }

    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// Login user
export async function loginUser(email, password) {
  try {
    // First get the user from our custom table to check password
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('password_hash')
      .eq('email', email)
      .single()

    if (fetchError) {
      // If no user found in custom table, try direct Supabase auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      if (error) throw error
      return { data, error: null }
    }

    // Verify password with stored hash
    const isValidPassword = await bcrypt.compare(password, userData.password_hash)
    if (!isValidPassword) {
      throw new Error('Invalid email or password')
    }

    // If password is valid, sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// Logout user
export async function logoutUser() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return { error: null }
  } catch (error) {
    return { error }
  }
}

// Get current user
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return { user, error: null }
  } catch (error) {
    return { user: null, error }
  }
}

// Update user info
export async function updateUserInfo(userId, info) {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({ info })
      .eq('uuid', userId)
      .select()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}
