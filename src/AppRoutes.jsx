import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import privacySource from '../PRIVACY.md?raw'
import termsSource from '../TERMS.md?raw'
import App from './App.jsx'
import LegalPage from './pages/LegalPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import PricingPage from './pages/PricingPage.jsx'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function AppRoutes() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<App />} />
        <Route
          path="/privacy"
          element={
            <LegalPage
              source={privacySource}
              title="Privacy note | AI File Renamer"
              description="How AI File Renamer handles your files, account data, and processors. Pattern renaming stays in your browser. AI suggest sends document content to Anthropic."
              path="/privacy"
            />
          }
        />
        <Route
          path="/terms"
          element={
            <LegalPage
              source={termsSource}
              title="Terms of Service | AI File Renamer"
              description="Terms of Service for AI File Renamer: eligibility, acceptable use, Free, Pro, and Business plans, payment, and California governing law."
              path="/terms"
            />
          }
        />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  )
}
