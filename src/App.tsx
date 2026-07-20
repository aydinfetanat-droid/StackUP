import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./components/ui/Toast";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { TabShell } from "./components/TabShell";
import { SignUpPage } from "./pages/SignUpPage";
import { LoginPage } from "./pages/LoginPage";
import { HomePage } from "./pages/HomePage";
import { LearnPage } from "./pages/LearnPage";
import { LessonPage } from "./pages/LessonPage";
import { ReviewPage } from "./pages/ReviewPage";
import { PromotionExamPage } from "./pages/PromotionExamPage";
import { PlacementTestPage } from "./pages/PlacementTestPage";
import { AssessmentPage } from "./pages/AssessmentPage";
import { SimulatorPage } from "./pages/SimulatorPage";
import { NewsPage } from "./pages/NewsPage";
import { ProfilePage } from "./pages/ProfilePage";
import { AdminPage } from "./pages/AdminPage";
import { CompoundInterestTool } from "./pages/tools/CompoundInterestTool";
import { BudgetSplitTool } from "./pages/tools/BudgetSplitTool";
import { EngagedTimeTracker } from "./components/EngagedTimeTracker";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <EngagedTimeTracker />
          <Routes>
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin" element={<AdminPage />} />

            <Route
              element={
                <ProtectedRoute>
                  <TabShell />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<HomePage />} />
              <Route path="/learn" element={<LearnPage />} />
              <Route path="/market" element={<SimulatorPage />} />
              <Route path="/signals" element={<NewsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>

            <Route path="/news" element={<Navigate to="/signals" replace />} />

            <Route
              path="/lesson/:lessonId"
              element={
                <ProtectedRoute>
                  <LessonPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/review"
              element={
                <ProtectedRoute>
                  <ReviewPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/promotion-exam"
              element={
                <ProtectedRoute>
                  <PromotionExamPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/placement-test"
              element={
                <ProtectedRoute>
                  <PlacementTestPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assessment/:phase"
              element={
                <ProtectedRoute>
                  <AssessmentPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tools/compound-interest"
              element={
                <ProtectedRoute>
                  <CompoundInterestTool />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tools/budget-split"
              element={
                <ProtectedRoute>
                  <BudgetSplitTool />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
