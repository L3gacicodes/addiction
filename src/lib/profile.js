export async function ensureProfile(supabase, userId, initial = {}) {
  if (!supabase || !userId) return null
  const { data: existing } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (existing) return existing
  const { data: created } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      onboarding_complete: false,
      ...initial,
    })
    .select()
    .single()
  return created
}
