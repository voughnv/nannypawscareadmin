import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import AdminLayout from "./layouts/AdminLayout";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import Auth from "./Auth";
import BookingsPage from "./Booking/BookingsPage";
import SitterPage from "./sitter";
import MessagesPage from "./messages";
import ApplicantPage from "./applicant";
import FeedbackPage from "./feedback";
import SettingPage from "./setting";
import ProfilePage from "./profile";
import { ConfirmationProvider } from "./context/ConfirmationProvider";
import { hasLocalAdminSession } from "./utils/adminSession";

function RootRedirect() {
  return (
    <Navigate
      to={
        hasLocalAdminSession()
          ? "/bookings"
          : "/login"
      }
      replace
    />
  );
}

function App() {
  return (
    <ConfirmationProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Auth />} />

          <Route element={<ProtectedAdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/bookings" element={<BookingsPage />} />
              <Route path="/sitters" element={<SitterPage />} />
              <Route path="/messages" element={<MessagesPage />} />
              <Route path="/applicants" element={<ApplicantPage />} />
              <Route path="/feedbacks" element={<FeedbackPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/settings" element={<SettingPage />} />
            </Route>
          </Route>

          <Route
            path="/"
            element={<RootRedirect />}
          />

          <Route
            path="*"
            element={<RootRedirect />}
          />
        </Routes>
      </BrowserRouter>
    </ConfirmationProvider>
  );
}

export default App;
