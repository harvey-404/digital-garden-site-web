import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import Layout from "./components/Layout";
import AdminLayout from "./components/AdminLayout";
import RequireAuth from "./components/RequireAuth";
import HomePage from "./pages/HomePage";
import PostListPage from "./pages/PostListPage";
import PostDetailPage from "./pages/PostDetailPage";
import ProjectListPage from "./pages/ProjectListPage";
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
import CommentModerationPage from "./pages/admin/CommentModerationPage";
import ProfileEditPage from "./pages/admin/ProfileEditPage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-center" />
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="posts" element={<PostListPage />} />
            <Route path="posts/:slug" element={<PostDetailPage />} />
            <Route path="projects" element={<ProjectListPage />} />
            <Route path="todos" element={<TodoListPage />} />
            <Route path="todos/:slug" element={<TodoDetailPage />} />
            <Route path="about" element={<AboutPage />} />
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
            <Route path="comments" element={<CommentModerationPage />} />
            <Route path="profile" element={<ProfileEditPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
