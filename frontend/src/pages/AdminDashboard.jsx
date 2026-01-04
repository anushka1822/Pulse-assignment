import { useState, useEffect, useContext } from 'react';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import AuthContext from '../context/AuthContext';
import { io } from 'socket.io-client';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
    const { user } = useContext(AuthContext);
    const [activeTab, setActiveTab] = useState('tenants');
    const [tenants, setTenants] = useState([]);
    const [videos, setVideos] = useState([]);
    const [selectedTenant, setSelectedTenant] = useState('');

    // Forms
    const [newTenant, setNewTenant] = useState({ name: '', slug: '' });
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'Editor', tenantId: '' });
    const [usersList, setUsersList] = useState([]);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchData();
    }, [activeTab, selectedTenant]);

    // Socket Effect
    useEffect(() => {
        const socket = io('https://pulse-assignment-tca5.onrender.com');

        socket.on('connect', () => {
            if (user) socket.emit('join', user);
        });

        // Listen for new flagged uploads
        socket.on('video.uploaded', (video) => {
            if (activeTab === 'moderation' && video.isFlagged) {
                setVideos(prev => [video, ...prev]);
                setMessage("New video flagged for review!");
            }
        });

        // Detailed Moderation Alert
        socket.on('moderation.alert', (alertData) => {
            console.log("RECEIVED MODERATION ALERT:", alertData);
            setMessage(alertData.message);
            // Optionally play a sound or use a toast
        });

        // Listen for updates (approvals by other admins, or AI flagging results)
        socket.on('video.updated', (updated) => {
            if (activeTab === 'moderation') {
                // If unflagged, remove from list
                if (!updated.isFlagged) {
                    setVideos(prev => prev.filter(v => v._id !== updated._id));
                } else {
                    // Update existing item (reasons might have changed)
                    setVideos(prev => prev.map(v => v._id === updated._id ? updated : v));
                }
            } else if (activeTab === 'published') {
                // If becomes flagged, remove from published list
                if (updated.isFlagged || !updated.isPublished) {
                    setVideos(prev => prev.filter(v => v._id !== updated._id));
                } else {
                    // Update metadata/status
                    setVideos(prev => prev.map(v => v._id === updated._id ? updated : v));
                }
            }
        });

        socket.on('video.deleted', (kickedId) => {
            if (activeTab === 'moderation' || activeTab === 'published') {
                setVideos(prev => prev.filter(v => v._id !== kickedId));
            }
        });

        return () => socket.disconnect();
    }, [user, activeTab]);

    const fetchData = async () => {
        try {
            if (activeTab === 'tenants') {
                const res = await api.get('/tenants');
                setTenants(res.data);
            } else if (activeTab === 'moderation') {
                // Fetch flagged videos
                const url = selectedTenant ? `/videos?flagged=true&tenantId=${selectedTenant}` : '/videos?flagged=true';
                const res = await api.get(url);
                setVideos(res.data);
            } else if (activeTab === 'published') {
                // Fetch published videos
                const url = selectedTenant ? `/videos?published=true&tenantId=${selectedTenant}` : '/videos?published=true';
                const res = await api.get(url);
                setVideos(res.data);
            } else if (activeTab === 'users') {
                // We need tenants list for the user form dropdown
                if (tenants.length === 0) {
                    const res = await api.get('/tenants');
                    setTenants(res.data);
                }
                // Initial fetch of all users (or filtered if we implemented default)
                fetchUsers();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const fetchUsers = async (tenantId = '') => {
        try {
            const url = tenantId ? `/users?tenantId=${tenantId}` : '/users';
            const res = await api.get(url);
            setUsersList(res.data);
        } catch (err) {
            console.error("Failed to fetch users", err);
        }
    };

    const handleCreateTenant = async (e) => {
        e.preventDefault();
        try {
            await api.post('/tenants', newTenant);
            setMessage('Tenant created!');
            setNewTenant({ name: '', slug: '' });
            fetchData();
        } catch (err) {
            setMessage(err.response?.data?.message || 'Error creating tenant');
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            await api.post('/users', newUser);
            setMessage('User created!');
            setNewUser({ ...newUser, email: '', password: '' }); // Reset sensitive fields
        } catch (err) {
            setMessage(err.response?.data?.message || 'Error creating user');
        }
    };

    const handleApproveVideo = async (videoId) => {
        try {
            await api.patch(`/videos/${videoId}`, { isFlagged: false });
            // Socket will handle UI update
            setMessage('Video approved!');
        } catch (err) {
            console.error(err);
        }
    };

    const handleRemoveVideo = async (videoId) => {
        if (!window.confirm("Delete this video permanently?")) return;
        try {
            await api.delete(`/videos/${videoId}`);
            // Socket will handle UI update
            setMessage('Video removed.');
        } catch (err) {
            console.error(err);
            setMessage("Error removing video");
        }
    };

    return (
        <div className="min-h-screen bg-dark-900">
            <Navbar />
            <div className="container mx-auto px-6 py-10">
                <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Super Admin Portal</h1>
                        <p className="text-gray-400">Manage tenants, users, and oversee content moderation</p>
                    </div>
                    {message && (
                        <div className="bg-primary/10 border border-primary/20 text-primary-light px-4 py-2 rounded-xl text-sm animate-pulse">
                            {message}
                        </div>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex flex-wrap gap-2 mb-10 p-1 bg-dark-800 rounded-2xl border border-white/5 w-fit">
                    {['tenants', 'users', 'moderation', 'published'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => { setActiveTab(tab); setMessage(''); }}
                            className={`py-2.5 px-6 rounded-xl capitalize font-bold text-sm transition-all ${activeTab === tab ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'}`}
                        >
                            {tab === 'moderation' ? 'AI Moderation' : tab === 'published' ? 'Published' : tab}
                        </button>
                    ))}
                </div>

                {/* Global Filters for Content Tabs */}
                {(activeTab === 'moderation' || activeTab === 'published') && (
                    <div className="mb-8 glass p-6 rounded-2xl border border-white/5 flex flex-wrap items-center gap-6">
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Filter by Tenant</span>
                            <select
                                className="bg-dark-700 border border-dark-600 text-white text-sm rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary outline-none transition-all"
                                value={selectedTenant}
                                onChange={(e) => setSelectedTenant(e.target.value)}
                            >
                                <option value="">All Tenants</option>
                                {tenants.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                            </select>
                        </div>
                    </div>
                )}

                <div className="space-y-10">

                    {/* TENANTS Tab */}
                    {activeTab === 'tenants' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                            <div className="lg:col-span-1 space-y-6">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <span className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary text-sm">+</span>
                                    Add New Tenant
                                </h2>
                                <form onSubmit={handleCreateTenant} className="glass p-6 rounded-2xl border border-white/5 space-y-5">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2 tracking-wider">Company Name</label>
                                        <input type="text" className="input-field" placeholder="e.g. Acme Corp" value={newTenant.name} onChange={e => setNewTenant({ ...newTenant, name: e.target.value })} required />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2 tracking-wider">Unique Slug</label>
                                        <input type="text" className="input-field" placeholder="e.g. acme" value={newTenant.slug} onChange={e => setNewTenant({ ...newTenant, slug: e.target.value })} required />
                                    </div>
                                    <button type="submit" className="btn-primary w-full py-3 mt-2">Create Tenant</button>
                                </form>
                            </div>

                            <div className="lg:col-span-2 space-y-6">
                                <h2 className="text-xl font-bold text-white">Active Tenants</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {tenants.map(t => (
                                        <div key={t._id} className="bg-dark-800 p-5 rounded-2xl border border-white/5 flex justify-between items-center hover:bg-dark-700 transition-colors">
                                            <div>
                                                <h3 className="font-bold text-white">{t.name}</h3>
                                                <p className="text-sm text-gray-500 font-mono">{t.slug}</p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${t.isActive ? "bg-secondary/10 text-secondary border border-secondary/20" : "bg-red-500/10 text-red-500 border border-red-500/20"}`}>
                                                {t.isActive ? "Active" : "Inactive"}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* USERS Tab */}
                    {activeTab === 'users' && (
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
                            <div className="lg:col-span-1 space-y-6">
                                <h2 className="text-xl font-bold text-white">Register User</h2>
                                <form onSubmit={handleCreateUser} className="glass p-6 rounded-2xl border border-white/5 space-y-5">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2 tracking-wider">Select Tenant</label>
                                        <select className="input-field" value={newUser.tenantId} onChange={e => setNewUser({ ...newUser, tenantId: e.target.value })} required>
                                            <option value="">Select Tenant</option>
                                            {tenants.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2 tracking-wider">Assign Role</label>
                                        <select className="input-field" value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
                                            <option value="Editor">Editor (Upload/Edit)</option>
                                            <option value="Viewer">Viewer (Read Only)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2 tracking-wider">Full Name</label>
                                        <input type="text" placeholder="John Doe" className="input-field" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} required />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2 tracking-wider">Email Address</label>
                                        <input type="email" placeholder="john@company.com" className="input-field" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} required />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2 tracking-wider">Password</label>
                                        <input type="password" placeholder="••••••••" className="input-field" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} required />
                                    </div>
                                    <button type="submit" className="btn-primary w-full py-3 mt-2">Add New User</button>
                                </form>
                            </div>

                            <div className="lg:col-span-3 space-y-6">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-xl font-bold text-white">User Directory</h2>
                                    <select
                                        className="bg-dark-800 border border-white/5 text-xs text-white rounded-lg px-4 py-2"
                                        onChange={(e) => fetchUsers(e.target.value)}
                                    >
                                        <option value="">All Tenants</option>
                                        {tenants.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                                    </select>
                                </div>

                                <div className="bg-dark-800 rounded-2xl border border-white/5 overflow-hidden">
                                    {usersList.length === 0 ? (
                                        <div className="p-10 text-center text-gray-500 italic">No users found match your criteria.</div>
                                    ) : (
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="bg-white/5 text-xs font-bold text-gray-400 uppercase tracking-widest">
                                                    <th className="px-6 py-4">User</th>
                                                    <th className="px-6 py-4">Role</th>
                                                    <th className="px-6 py-4">Organization</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {usersList.map(u => (
                                                    <tr key={u._id} className="hover:bg-white/5 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col">
                                                                <span className="text-white font-bold">{u.name}</span>
                                                                <span className="text-xs text-gray-500">{u.email}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-tight ${u.role === 'Editor' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-gray-500/10 text-gray-400'}`}>
                                                                {u.role}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-gray-300 font-medium">
                                                            {u.tenantId?.name || ''}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* MODERATION Tab */}
                    {activeTab === 'moderation' && (
                        <div className="space-y-8">
                            <div className="flex items-center gap-3">
                                <h2 className="text-2xl font-bold text-white tracking-tight">AI Moderation Queue</h2>
                                <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">{videos.length} Pending</span>
                            </div>

                            {videos.length === 0 ? (
                                <div className="text-center py-20 bg-dark-800 rounded-3xl border border-white/5 shadow-xl">
                                    <div className="text-6xl mb-6 opacity-30">🛡️</div>
                                    <h3 className="text-xl font-bold text-white mb-2">Zero Alerts</h3>
                                    <p className="text-gray-500">Everything looks clean. No flagged content detected at this time.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                                    {videos.map((video) => (
                                        <div key={video._id} className="bg-dark-800 rounded-2xl border border-red-500/20 overflow-hidden flex flex-col group hover:shadow-2xl hover:shadow-red-500/10 transition-all border-b-4 border-b-red-500/50">
                                            <div className="aspect-video bg-black flex items-center justify-center relative">
                                                <div className="absolute top-4 left-4 z-10">
                                                    <span className="bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded uppercase tracking-tighter shadow-lg shadow-red-500/50">Flagged</span>
                                                </div>
                                                <span className="text-6xl opacity-20 filter grayscale">📽️</span>
                                                <div className="absolute inset-0 bg-gradient-to-t from-black opacity-60"></div>
                                                <div className="absolute bottom-4 left-4 right-4 text-white">
                                                    <h3 className="font-bold truncate text-lg leading-tight mb-1">{video.title}</h3>
                                                    <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-gray-400">
                                                        <span>{video.tenantId?.name || 'Loading...'}</span>
                                                        <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                                                        <span className="uppercase">{video.uploadedBy?.email || 'EDITOR'}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="p-5 flex-1 flex flex-col">
                                                <div className="mb-6">
                                                    <span className="text-[10px] font-black text-red-500 uppercase tracking-widest block mb-2">Notice</span>
                                                    <p className="text-red-400 text-xs font-bold uppercase">Insensitive or Abusive Content</p>
                                                </div>

                                                <div className="mt-auto grid grid-cols-2 gap-3 pt-4 border-t border-white/5">
                                                    <button onClick={() => handleApproveVideo(video._id)} className="bg-secondary/10 hover:bg-secondary text-secondary hover:text-white py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border border-secondary/20">Allow</button>
                                                    <button onClick={() => handleRemoveVideo(video._id)} className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border border-red-500/20">Remove</button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* PUBLISHED Tab */}
                    {activeTab === 'published' && (
                        <div className="space-y-8">
                            <h2 className="text-2xl font-bold text-white tracking-tight">Public Catalog</h2>
                            {videos.length === 0 ? (
                                <div className="text-center py-20 bg-dark-800 rounded-3xl border border-white/5">
                                    <p className="text-gray-500 italic">Registry is empty.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {videos.map((video) => (
                                        <div key={video._id} className="bg-dark-800 rounded-2xl border border-white/5 overflow-hidden flex flex-col hover:border-primary/30 transition-all card-hover">
                                            <div className="aspect-video bg-dark-700 flex items-center justify-center relative">
                                                <span className="text-4xl">🎬</span>
                                                <div className="absolute top-2 right-2">
                                                    <span className="bg-secondary text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase">LIVE</span>
                                                </div>
                                            </div>
                                            <div className="p-4 flex flex-col flex-1">
                                                <h3 className="font-bold text-white truncate text-sm mb-1">{video.title}</h3>
                                                <p className="text-[10px] text-gray-500 mb-4 font-medium uppercase">{video.tenantId?.name || 'Default'}</p>

                                                <div className="mt-auto space-y-2">
                                                    <Link
                                                        to={`/player/${video._id}`}
                                                        target="_blank"
                                                        className="block w-full text-center bg-primary text-white py-1.5 rounded-lg text-xs font-bold hover:bg-primary-hover transition-colors"
                                                    >
                                                        Open
                                                    </Link>
                                                    <button
                                                        onClick={() => handleRemoveVideo(video._id)}
                                                        className="w-full text-red-500 hover:text-white hover:bg-red-500/20 py-1 rounded-lg text-xs font-bold transition-all"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
