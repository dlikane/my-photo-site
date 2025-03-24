import { Routes, Route, Navigate } from "react-router-dom"
import Header from "./Header"
import Footer from "./Footer"
import Slideshow from "./Slideshow"
import Category from "./Category"
import Videos from "./Videos"
import About from "./About"
import Hidden from "./Hidden"
import ClientList from "./admin/ClientList.jsx"
import CallForm from "./admin/CallForm.jsx"
import AdminDashboard from "./admin/AdminDashboard.jsx"
import ProjectList from "./admin/ProjectList.jsx"
import Client from "./admin/Client.jsx"
import Project from "./admin/Project.jsx"
import AdminSearch from "./admin/AdminSearch.jsx"
import Login from "./admin/Login.jsx"
import { allowedEmails } from "../resources/adminEmails"
import { useAuth } from "./AuthProvider"
import ClientForm from "./admin/ClientForm.jsx";
import ProjectForm from "./admin/ProjectForm.jsx";

const Main = ({ theme, setTheme }) => {
    const { user } = useAuth()

    const protect = (element) =>
        user && allowedEmails.includes(user.email)
            ? element
            : <Navigate to="/" replace />

    return (
        <div className="flex h-screen flex-col">
            <Header theme={theme} setTheme={setTheme} />
            <main className="grow overflow-auto scrollbar-hide bg-white dark:bg-black">
                <Routes>
                    <Route path="/" element={<Slideshow />} />
                    <Route path="/category/*" element={<Category />} />
                    <Route path="/videos/:playlist" element={<Videos />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/hidden" element={<Hidden />} />

                    {/* Admin Routes (protected) */}
                    <Route path="/admin" element={protect(<AdminDashboard />)} />
                    <Route path="/admin/client-new" element={protect(<ClientForm />)} />
                    <Route path="/admin/project-new" element={protect(<ProjectForm />)} />
                    <Route path="/admin/client-list" element={protect(<ClientList />)} />
                    <Route path="/admin/calls" element={protect(<CallForm />)} />
                    <Route path="/admin/project-list" element={protect(<ProjectList />)} />
                    <Route path="/admin/client/:id" element={protect(<Client />)} />
                    <Route path="/admin/project/:id" element={protect(<Project />)} />
                    <Route path="/admin/search" element={protect(<AdminSearch />)} />
                    <Route path="/admin/client-edit/:id" element={protect(<ClientForm />)} />
                    <Route path="/admin/project-edit/:id" element={protect(<ProjectForm />)} />

                    {/* Public login page */}
                    <Route path="/admin/login" element={<Login />} />
                </Routes>
            </main>
            <Footer />
        </div>
    )
}

export default Main
