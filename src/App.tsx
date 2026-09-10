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
import PostListPage from "./pages/PostListPage";
import PostDetailPage from "./pages/PostDetailPage";
import ProjectListPage from "./pages/ProjectListPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import TodoListPage from "./pages/TodoListPage";
import TodoDetailPage from "./pages/TodoDetailPage";
import AboutPage from "./pages/AboutPage";
import NotFoundPage from "./pages/NotFoundPage";
import LoginPage from "./pages/admin/LoginPage";
import DashboardPage from "./pages/admin/DashboardPage";
import AdminPostListPage from "./pages/admin/AdminPostListPage";
import PostEditPage from "./pages/admin/PostEditPage";
import AdminProjectListPage from "./pages/admin/AdminProjectListPage";
import ProjectEditPage from "./pages/admin/ProjectEditPage";
import AdminTodoListPage from "./pages/admin/AdminTodoListPage";
import TodoEditPage from "./pages/admin/TodoEditPage";
import AdminAlbumListPage from "./pages/admin/AdminAlbumListPage";
import AlbumEditPage from "./pages/admin/AlbumEditPage";
import AdminSemanticGamePage from "./pages/admin/AdminSemanticGamePage";
import CommentModerationPage from "./pages/admin/CommentModerationPage";
import ProfileEditPage from "./pages/admin/ProfileEditPage";
import AdminLedgerUsersPage from "./pages/admin/AdminLedgerUsersPage";
import AlbumPage from "./pages/AlbumPage";
import GamesPage from "./pages/GamesPage";
import SemanticGamePage from "./pages/SemanticGamePage";
import LedgerLoginPage from "./pages/ledger/LedgerLoginPage";
import LedgerOnboardingPage from "./pages/ledger/LedgerOnboardingPage";
import LedgerDashboardPage from "./pages/ledger/LedgerDashboardPage";
import LedgerExpensesPage from "./pages/ledger/LedgerExpensesPage";
import LedgerBudgetsPage from "./pages/ledger/LedgerBudgetsPage";
import LedgerCategoriesPage from "./pages/ledger/LedgerCategoriesPage";
import LedgerSettingsPage from "./pages/ledger/LedgerSettingsPage";

export default function App() {
  return (
    <AuthProvider>
      <LedgerAuthProvider>
        <BrowserRouter>
          <Toaster position="top-center" />
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="posts" element={<PostListPage />} />
              <Route path="posts/:slug" element={<PostDetailPage />} />
              <Route path="projects" element={<ProjectListPage />} />
              <Route path="projects/:id" element={<ProjectDetailPage />} />
              <Route path="todos" element={<TodoListPage />} />
              <Route path="todos/:slug" element={<TodoDetailPage />} />
              <Route path="about" element={<AboutPage />} />
              <Route path="games" element={<GamesPage />} />
              <Route path="games/semantic" element={<SemanticGamePage />} />
              <Route path="ledger/login" element={<LedgerLoginPage />} />
              <Route path="ledger/onboarding" element={<LedgerOnboardingPage />} />
              <Route
                path="ledger"
                element={
                  <RequireLedgerAuth>
                    <LedgerShell />
                  </RequireLedgerAuth>
                }
              >
                <Route index element={<LedgerDashboardPage />} />
                <Route path="expenses" element={<LedgerExpensesPage />} />
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
        </BrowserRouter>
      </LedgerAuthProvider>
    </AuthProvider>
  );
}
