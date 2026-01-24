import {
    LayoutDashboard,
    Users,
    TrendingUp,
    Bell,
    Settings,
    Link2,
    BookOpen,
    Shield
} from 'lucide-react'

function Sidebar() {
    return (
        <aside className="sidebar">
            {/* Logo */}
            <div className="sidebar-logo">
                <div className="sidebar-logo-icon">
                    <Shield size={22} strokeWidth={2.5} />
                </div>
                <span className="sidebar-logo-text">TrustFlow</span>
                <span className="sidebar-logo-badge">BETA</span>
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">
                <div className="sidebar-section-title">Main Menu</div>

                <a className="sidebar-nav-item active">
                    <span className="sidebar-nav-icon">
                        <LayoutDashboard size={18} />
                    </span>
                    <span>Dashboard</span>
                </a>
                <a className="sidebar-nav-item">
                    <span className="sidebar-nav-icon">
                        <Users size={18} />
                    </span>
                    <span>Applicants</span>
                </a>
                <a className="sidebar-nav-item">
                    <span className="sidebar-nav-icon">
                        <TrendingUp size={18} />
                    </span>
                    <span>Analytics</span>
                </a>
                <a className="sidebar-nav-item">
                    <span className="sidebar-nav-icon">
                        <Bell size={18} />
                    </span>
                    <span>Alerts</span>
                </a>

                <div className="sidebar-section-title">Settings</div>

                <a className="sidebar-nav-item">
                    <span className="sidebar-nav-icon">
                        <Settings size={18} />
                    </span>
                    <span>Configuration</span>
                </a>
                <a className="sidebar-nav-item">
                    <span className="sidebar-nav-icon">
                        <Link2 size={18} />
                    </span>
                    <span>API Integration</span>
                </a>
                <a className="sidebar-nav-item">
                    <span className="sidebar-nav-icon">
                        <BookOpen size={18} />
                    </span>
                    <span>Documentation</span>
                </a>
            </nav>

            {/* Footer */}
            <div className="sidebar-footer">
                <div className="sidebar-user">
                    <div className="sidebar-user-avatar">JD</div>
                    <div className="sidebar-user-info">
                        <div className="sidebar-user-name">John Doe</div>
                        <div className="sidebar-user-role">Risk Analyst</div>
                    </div>
                </div>
            </div>
        </aside>
    )
}

export default Sidebar
