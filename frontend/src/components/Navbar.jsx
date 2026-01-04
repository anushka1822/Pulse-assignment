import { useContext } from 'react';
import AuthContext from '../context/AuthContext';
import { Link } from 'react-router-dom';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);

    return (
        <nav className="sticky top-0 z-50 glass border-b border-white/5 p-4 flex justify-between items-center px-6 md:px-12 transition-all">
            <Link to="/dashboard" className="flex items-center gap-2 group">
                <span className="text-2xl">⚡</span>
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-400 group-hover:from-primary-light group-hover:to-indigo-300 transition-all">
                    Pulse CMS
                </h1>
            </Link>
            <div className="flex items-center gap-6">
                <div className="hidden md:flex flex-col items-end">
                    <span className="text-sm font-semibold text-gray-100">
                        {user?.name}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                        {user?.role} {user?.tenantName && <span>• {user.tenantName}</span>}
                    </span>
                </div>
                <button
                    onClick={logout}
                    className="px-4 py-1.5 border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white rounded-lg text-sm font-semibold transition-all active:scale-95"
                >
                    Logout
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
