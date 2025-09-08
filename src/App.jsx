import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
import ProfilePage from './pages/ProfilePage'
import BookPostPage from './pages/BookPostPage'
import MyPostsPage from './pages/MyPostsPage'
import PostDetailPage from './pages/PostDetailPage'
import HomePage from './pages/HomePage'

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/u/:username" element={<ProfilePage />} />
          <Route path="/:username" element={<ProfilePage />} />
          <Route path="/u/:username/book/:bookId" element={<BookPostPage />} />
          <Route path="/:username/book/:bookId" element={<BookPostPage />} />
          <Route path="/:username/posts" element={<MyPostsPage />} />
          <Route path="/post/:postId" element={<PostDetailPage />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
