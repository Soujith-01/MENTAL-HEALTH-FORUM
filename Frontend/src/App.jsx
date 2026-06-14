import { createBrowserRouter, RouterProvider } from "react-router";
import { Toaster } from "react-hot-toast";
import RootLayout from "./components/RootLayout";
import Home from "./components/Home";
import Register from "./components/Register";
import Login from "./components/Login";
import CreatePost from "./components/CreatePost";
import PostDetails from "./components/PostDetails";
import MyPosts from "./components/MyPosts";
import SavedPosts from "./components/SavedPosts";
import Notifications from "./components/Notifications";
import Profile from "./components/Profile";
import EditProfile from "./components/EditProfile";
import UserProfile from "./components/UserProfile";
import Discover from "./components/Discover";
import MoodJournal from "./components/MoodJournal";
import ChangePassword from "./components/ChangePassword";
import AdminDashboard from "./components/AdminDashboard";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import Messages from "./components/Messages";
import NotFound from "./components/NotFound";

function App() {
  const routerObj = createBrowserRouter([
    {
      path: "/",
      element: <RootLayout />,
      children: [
        {
          index: true,
          element: <Home />,
        },
        {
          path: "discover",
          element: <Discover />,
        },
        {
          path: "login",
          element: <Login />,
        },
        {
          path: "register",
          element: <Register />,
        },
        {
          path: "create-post",
          element: <CreatePost />,
        },
        {
          path: "posts/:postId",
          element: <PostDetails />,
        },
        {
          path: "my-posts",
          element: <MyPosts />,
        },
        {
          path: "saved-posts",
          element: <SavedPosts />,
        },
        {
          path: "mood-journal",
          element: <MoodJournal />,
        },
        {
          path: "messages",
          element: <Messages />,
        },
        {
          path: "change-password",
          element: <ChangePassword />,
        },
        {
          path: "notifications",
          element: <Notifications />,
        },
        {
          path: "profile",
          element: <Profile />,
        },
        {
          path: "profile/:userId",
          element: <UserProfile />,
        },
        {
          path: "edit-profile",
          element: <EditProfile />,
        },
        {
          path: "admin",
          element: (
            <ProtectedAdminRoute>
              <AdminDashboard />
            </ProtectedAdminRoute>
          ),
        },
        {
          path: "*",
          element: <NotFound />,
        },
      ],
    },
  ]);

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      <RouterProvider router={routerObj} />
    </>
  );
}

export default App;