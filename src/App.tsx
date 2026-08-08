import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { Explore } from './pages/Explore'
import { Communities } from './pages/Communities'
import { CreateCommunity } from './pages/CreateCommunity'
import { Community } from './pages/Community'
import { PostDetail } from './pages/PostDetail'
import { Profile } from './pages/Profile'
import { SearchPage } from './pages/Search'
import { SignIn } from './pages/SignIn'
import { SignUp } from './pages/SignUp'
import { Messages } from './pages/Messages'
import { Settings } from './pages/Settings'
import { ForgotPassword } from './pages/ForgotPassword'

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="explore" element={<Explore />} />
            <Route path="communities" element={<Communities />} />
            <Route path="communities/new" element={<CreateCommunity />} />
            <Route path="c/:slug" element={<Community />} />
            <Route path="post/:id" element={<PostDetail />} />
            <Route path="u/:username" element={<Profile />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="messages" element={<Messages />} />
            <Route path="messages/:conversationId" element={<Messages />} />
            <Route path="settings" element={<Settings />} />
            <Route path="signin" element={<SignIn />} />
            <Route path="login" element={<Navigate to="/signin" replace />} />
            <Route path="signup" element={<SignUp />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="auth" element={<Navigate to="/signin" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  )
}
