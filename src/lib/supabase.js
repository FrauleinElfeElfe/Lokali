import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export async function createPost(userId, text, lat, lng) {
  const { data, error } = await supabase
    .from('posts')
    .insert({ user_id: userId, text, lat, lng })
    .select().single()
  if (error) throw error
  return data
}

export async function fetchComments(postId) {
  const { data, error } = await supabase
    .from('comments')
    .select('*, profiles(username, avatar)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function addComment(postId, userId, text) {
  const { data, error } = await supabase
    .from('comments')
    .insert({ post_id: postId, user_id: userId, text })
    .select().single()
  if (error) throw error
  return data
}

export async function fetchMessages(userA, userB) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(`and(sender_id.eq.${userA},recipient_id.eq.${userB}),and(sender_id.eq.${userB},recipient_id.eq.${userA})`)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function sendMessage(senderId, recipientId, text) {
  const { data, error } = await supabase
    .from('messages')
    .insert({ sender_id: senderId, recipient_id: recipientId, text })
    .select().single()
  if (error) throw error
  return data
}

export async function reportPost(postId, reporterId) {
  const { error } = await supabase
    .from('reports')
    .insert({ post_id: postId, reporter_id: reporterId })
  if (error) throw error
}

export async function upsertProfile(userId, profile) {
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: userId, ...profile })
    .select().single()
  if (error) throw error
  return data
}
