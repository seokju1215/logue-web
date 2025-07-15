import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase 환경 변수가 설정되지 않았습니다. .env 파일을 확인해주세요.')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// 프로필 정보 가져오기 (팔로워/팔로잉 카운트 포함)
export const getProfileByUsername = async (username) => {
  try {
    // 프로필 정보 가져오기
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single()

    if (profileError) throw profileError

    // 팔로워 수 가져오기
    const { data: followers, error: followersError } = await supabase
      .from('follows')
      .select('*')
      .eq('following_id', profile.id)

    if (followersError) throw followersError

    // 팔로잉 수 가져오기
    const { data: following, error: followingError } = await supabase
      .from('follows')
      .select('*')
      .eq('follower_id', profile.id)

    if (followingError) throw followingError

    return {
      ...profile,
      followers: followers.length,
      following: following.length
    }
  } catch (error) {
    console.error('프로필 가져오기 실패:', error)
    throw new Error('프로필을 찾을 수 없습니다.')
  }
}

// 사용자의 책들 가져오기 (order_index로 정렬)
export const getUserBooks = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_books')
      .select(`
        *,
        books (*)
      `)
      .eq('user_id', userId)
      .order('order_index', { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('사용자 책 가져오기 실패:', error)
    throw new Error('책 정보를 가져올 수 없습니다.')
  }
}

// 사용자의 모든 책 리뷰 가져오기 (Flutter의 get_user_books_with_profiles와 동일)
export const getUserBooksWithProfiles = async (userId) => {
  try {
    const { data, error } = await supabase
      .rpc('get_user_books_with_profiles', {
        target_user_id: userId
      })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('사용자 책 리뷰 가져오기 실패:', error)
    throw new Error('책 리뷰를 가져올 수 없습니다.')
  }
}

// 특정 책의 리뷰 가져오기
export const getBookPost = async (userId, bookId) => {
  try {
    const { data, error } = await supabase
      .from('user_books')
      .select(`
        *,
        books (*)
      `)
      .eq('user_id', userId)
      .eq('book_id', bookId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('책 리뷰 가져오기 실패:', error)
    throw new Error('책 리뷰를 찾을 수 없습니다.')
  }
} 