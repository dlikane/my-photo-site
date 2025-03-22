import { Routes, Route } from "react-router-dom"
import Header from "./Header"
import Footer from "./Footer"
import Slideshow from "./Slideshow"
import Category from "./Category"
import Videos from "./Videos"
import About from "./About"
import Hidden from "./Hidden"
import ClientForm from "./admin/ClientForm.jsx"
import ProjectForm from "./admin/ProjectForm.jsx"
import ClientList from "./admin/ClientList.jsx"
import CallForm from "./admin/CallForm.jsx"
import AdminDashboard from "./admin/AdminDashboard.jsx"
import ProjectList from "./admin/ProjectList.jsx"
import ClientDetails from "./admin/ClientDetails.jsx"
import ProjectDetails from "./admin/ProjectDetails.jsx"
import AdminSearch from "./admin/AdminSearch.jsx"
import ClientEdit from "./admin/ClientEdit.jsx"
import ProjectEdit from "./admin/ProjectEdit.jsx"
import Login from "./admin/Login.jsx"
import {useAuth} from "./AuthProvider.jsx";

const Main = ({ theme, setTheme }) => {
    const { user, loading } = useAuth()

    const protect = (element) =>
        loading ? null : user ? element : <Navigate to="/admin/login" replace />

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

                    {/* admin (protected) */}
                    <Route path="/admin" element={protect(<AdminDashboard />)} />
                    <Route path="/admin/clients" element={protect(<ClientForm />)} />
                    <Route path="/admin/client-list" element={protect(<ClientList />)} />
                    <Route path="/admin/client/:id" element={protect(<ClientDetails />)} />
                    <Route path="/admin/client-edit/:id" element={protect(<ClientEdit />)} />
                    <Route path="/admin/projects" element={protect(<ProjectForm />)} />
                    <Route path="/admin/project-list" element={protect(<ProjectList />)} />
                    <Route path="/admin/project/:id" element={protect(<ProjectDetails />)} />
                    <Route path="/admin/project-edit/:id" element={protect(<ProjectEdit />)} />
                    <Route path="/admin/calls" element={protect(<CallForm />)} />
                    <Route path="/admin/search" element={protect(<AdminSearch />)} />

                    {/* login */}
                    <Route path="/admin/login" element={<Login />} />
                </Routes>
            </main>
            <Footer />
        </div>
    )
}

export default Main
