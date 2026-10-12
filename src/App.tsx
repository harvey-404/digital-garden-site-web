import { lazy, Suspense } from "react";
import Spinner from "./components/Spinner";
import { AccountProvider } from "./context/AccountContext";
import RequireAccount from "./components/RequireAccount";
import AccountPage, { AccountForm, LegacyAccountRedirect } from "./pages/account/AccountPage";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import { LedgerAuthProvider } from "./context/LedgerAuthContext";
import Layout from "./components/Layout";
import MapShellLayout from "./components/MapShellLayout";
import AdminLayout from "./components/AdminLayout";
import RequireAuth from "./components/RequireAuth";
import RequireLedgerAuth from "./components/RequireLedgerAuth";
import LedgerShell from "./components/ledger/LedgerShell";
import HomePage from "./pages/HomePage";
const PostListPage = lazy(() => import("./pages/PostListPage"));
const PostDetailPage = lazy(() => import("./pages/PostDetailPage"));
const ProjectListPage = lazy(() => import("./pages/ProjectListPage"));
const ProjectDetailPage = lazy(() => import("./pages/ProjectDetailPage"));
const TodoListPage = lazy(() => import("./pages/TodoListPage"));
const TodoDetailPage = lazy(() => import("./pages/TodoDetailPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const LoginPage = lazy(() => import("./pages/admin/LoginPage"));
const DashboardPage = lazy(() => import("./pages/admin/DashboardPage"));
const AdminPostListPage = lazy(() => import("./pages/admin/AdminPostListPage"));
const PostEditPage = lazy(() => import("./pages/admin/PostEditPage"));
const AdminProjectListPage = lazy(() => import("./pages/admin/AdminProjectListPage"));
const ProjectEditPage = lazy(() => import("./pages/admin/ProjectEditPage"));
const AdminTodoListPage = lazy(() => import("./pages/admin/AdminTodoListPage"));
const TodoEditPage = lazy(() => import("./pages/admin/TodoEditPage"));
const AdminAlbumListPage = lazy(() => import("./pages/admin/AdminAlbumListPage"));
const AlbumEditPage = lazy(() => import("./pages/admin/AlbumEditPage"));
const AdminSemanticGamePage = lazy(() => import("./pages/admin/AdminSemanticGamePage"));
const CommentModerationPage = lazy(() => import("./pages/admin/CommentModerationPage"));
const ProfileEditPage = lazy(() => import("./pages/admin/ProfileEditPage"));
const AdminLedgerUsersPage = lazy(() => import("./pages/admin/AdminLedgerUsersPage"));
const AlbumPage = lazy(() => import("./pages/AlbumPage"));
const GamesPage = lazy(() => import("./pages/GamesPage"));
const SemanticGamePage = lazy(() => import("./pages/SemanticGamePage"));
const LedgerOnboardingPage = lazy(() => import("./pages/ledger/LedgerOnboardingPage"));
const LedgerDashboardPage = lazy(() => import("./pages/ledger/LedgerDashboardPage"));
const LedgerExpensesPage = lazy(() => import("./pages/ledger/LedgerExpensesPage"));
const LedgerBudgetsPage = lazy(() => import("./pages/ledger/LedgerBudgetsPage"));
const LedgerCategoriesPage = lazy(() => import("./pages/ledger/LedgerCategoriesPage"));
const LedgerSettingsPage = lazy(() => import("./pages/ledger/LedgerSettingsPage"));
const LedgerChatPage = lazy(() => import("./pages/ledger/LedgerChatPage"));
const TrackerPage = lazy(() => import("./pages/tracker/TrackerPage"));

export default function App() {
  return (
    <AuthProvider>
      <AccountProvider>
        <BrowserRouter>
        <LedgerAuthProvider>
          <Toaster position="top-center" />
          <Suspense fallback={<Spinner />}>
          <Routes>
            <Route path="/tracker/login" element={<LegacyAccountRedirect next="/tracker" />} />
            <Route path="/tracker" element={<RequireAccount><TrackerPage /></RequireAccount>} />
            <Route element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="login" element={<AccountForm mode="login" />} />
              <Route path="register" element={<AccountForm mode="register" />} />
              <Route path="reset-password" element={<AccountForm mode="reset" />} />
              <Route path="account" element={<AccountPage />} />
              <Route path="posts" element={<PostListPage />} />
              <Route path="posts/:slug" element={<PostDetailPage />} />
              <Route path="projects" element={<ProjectListPage />} />
              <Route path="projects/:id" element={<ProjectDetailPage />} />
              <Route path="todos" element={<TodoListPage />} />
              <Route path="todos/:slug" element={<TodoDetailPage />} />
              <Route path="about" element={<AboutPage />} />
              <Route path="games" element={<GamesPage />} />
              <Route path="games/semantic" element={<SemanticGamePage />} />
              <Route path="ledger/login" element={<LegacyAccountRedirect next="/ledger" />} />
              <Route path="ledger/onboarding" element={<RequireAccount><LedgerOnboardingPage /></RequireAccount>} />
              <Route
                path="ledger"
                element={
                  <RequireAccount><RequireLedgerAuth>
                    <LedgerShell />
                  </RequireLedgerAuth></RequireAccount>
                }
              >
                <Route index element={<LedgerDashboardPage />} />
                <Route path="expenses" element={<LedgerExpensesPage />} />
                <Route path="chat" element={<LedgerChatPage />} />
                <Route path="budgets" element={<LedgerBudgetsPage />} />
                <Route path="categories" element={<LedgerCategoriesPage />} />
                <Route path="settings" element={<LedgerSettingsPage />} />
              </Route>
            </Route>
            <Route element={<MapShellLayout />}>
              <Route path="album" element={<AlbumPage />} />
            </Route>
            <Route path="/admin/login" element={<LoginPage />} />
            <Route
              path="/admin"
              element={
                <RequireAuth>
                  <AdminLayout />
                </RequireAuth>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="posts" element={<AdminPostListPage />} />
              <Route path="posts/new" element={<PostEditPage />} />
              <Route path="posts/:id/edit" element={<PostEditPage />} />
              <Route path="projects" element={<AdminProjectListPage />} />
              <Route path="projects/new" element={<ProjectEditPage />} />
              <Route path="projects/:id/edit" element={<ProjectEditPage />} />
              <Route path="todos" element={<AdminTodoListPage />} />
              <Route path="todos/new" element={<TodoEditPage />} />
              <Route path="todos/:id/edit" element={<TodoEditPage />} />
              <Route path="album" element={<AdminAlbumListPage />} />
              <Route path="album/new" element={<AlbumEditPage />} />
              <Route path="album/:id/edit" element={<AlbumEditPage />} />
              <Route path="games/semantic" element={<AdminSemanticGamePage />} />
              <Route path="ledger/users" element={<AdminLedgerUsersPage />} />
              <Route path="comments" element={<CommentModerationPage />} />
              <Route path="profile" element={<ProfileEditPage />} />
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
          </Suspense>
        </LedgerAuthProvider>
        </BrowserRouter>
      </AccountProvider>
    </AuthProvider>
  );
}
