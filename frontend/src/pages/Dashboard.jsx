import { useEffect, useState, useContext } from 'react';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import { Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { io } from 'socket.io-client';

const Dashboard = () => {
    const { user } = useContext(AuthContext);
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchVideos();

        // Socket Connection
        const socket = io('http://localhost:5000');

        socket.on('connect', () => {
            console.log("Connected to socket");
            if (user) socket.emit('join', user);
        });

        socket.on('video.uploaded', (newVideo) => {
            // Only add if it belongs to this tenant (backend emits to room, so it should be fine)
            // But double check logic if needed.
            setVideos(prev => [newVideo, ...prev]);
        });

        socket.on('video.updated', (updatedVideo) => {
            setVideos(prev => prev.map(v => v._id === updatedVideo._id ? updatedVideo : v));
        });

        socket.on('video.deleted', (kickedId) => {
            setVideos(prev => prev.filter(v => v._id !== kickedId));
        });

        return () => {
            socket.disconnect();
        };
    }, [user]); // Re-run if user changes (for join event)

    const fetchVideos = async () => {
        try {
            const res = await api.get('/videos');
            setVideos(res.data);
        } catch (err) {
            console.error("Failed to fetch videos", err);
        } finally {
            setLoading(false);
        }
    };

    const handleTogglePublish = async (video) => {
        try {
            // Optimistic update handled by Socket? Or just wait? 
            // Better to wait or let socket handle it. 
            // But request must go through.
            await api.patch(`/videos/${video._id}`, { isPublished: !video.isPublished });
            // socket will send update back
        } catch (err) {
            console.error(err);
            alert("Failed to update status");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure?")) return;
        try {
            await api.delete(`/videos/${id}`);
            // socket will remove it
        } catch (err) {
            console.error(err);
            alert("Failed to delete video");
        }
    };

    return (
        <div className="min-h-screen bg-dark-900">
            <Navbar />
            <div className="container mx-auto px-6 py-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
                    <div>
                        <h2 className="text-3xl font-bold text-white mb-2">Video Library</h2>
                        <p className="text-gray-400">Manage and view your collection of videos</p>
                    </div>
                    {user?.role === 'Editor' && (
                        <Link
                            to="/upload"
                            className="btn-primary flex items-center gap-2"
                        >
                            <span>+</span> Upload Video
                        </Link>
                    )}
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <p className="mt-4 text-gray-400">Fetching your library...</p>
                    </div>
                ) : videos.length === 0 ? (
                    <div className="text-center py-20 bg-dark-800 rounded-2xl border border-white/5 shadow-xl">
                        <div className="text-6xl mb-4">📂</div>
                        <p className="text-gray-300 text-lg mb-4">No videos found in your library.</p>
                        {user?.role === 'Editor' && (
                            <Link to="/upload" className="text-primary hover:text-primary-light font-medium transition-colors">
                                Click here to upload your first video
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {videos.map((video) => (
                            <div key={video._id} className="group bg-dark-800 rounded-2xl border border-white/5 overflow-hidden card-hover flex flex-col h-full">
                                {video.isFlagged && (
                                    <div className="absolute top-3 right-3 z-10 bg-red-500/90 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider backdrop-blur-sm">
                                        Flagged
                                    </div>
                                )}

                                <div className="aspect-video bg-dark-700 flex items-center justify-center relative overflow-hidden">
                                    <span className="text-5xl group-hover:scale-110 transition-transform duration-500">🎬</span>
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Link to={`/player/${video._id}`} className="bg-white text-black w-10 h-10 rounded-full flex items-center justify-center font-bold">▶</Link>
                                    </div>
                                </div>

                                <div className="p-5 flex flex-col flex-1">
                                    <h3 className="font-bold text-white text-lg mb-2 truncate group-hover:text-primary transition-colors">
                                        {video.title}
                                    </h3>

                                    <div className="flex justify-between items-center text-xs text-gray-400 mb-6">
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-gray-600"></span>
                                            {(video.fileSize / 1024 / 1024).toFixed(1)} MB
                                        </div>
                                        <div className={`px-2 py-0.5 rounded-full border text-[10px] uppercase font-bold tracking-tight ${video.isPublished ? 'text-secondary border-secondary/20 bg-secondary/10' : 'text-gray-400 border-white/10 bg-white/5'}`}>
                                            {video.isPublished ? 'Published' : 'Draft'}
                                        </div>
                                    </div>

                                    <div className="flex gap-2 mt-auto">
                                        <Link
                                            to={`/player/${video._id}`}
                                            className="flex-1 text-center bg-dark-700 border border-white/5 text-gray-200 py-2 rounded-lg text-sm font-semibold hover:bg-dark-600 transition-colors"
                                        >
                                            Watch
                                        </Link>

                                        {user?.role === 'Editor' && (
                                            <>
                                                <button
                                                    onClick={() => handleTogglePublish(video)}
                                                    disabled={video.isFlagged}
                                                    title={video.isPublished ? 'Unpublish' : 'Publish'}
                                                    className={`flex-1 text-center py-2 rounded-lg text-sm font-semibold transition-all ${video.isFlagged ? 'bg-dark-900 text-gray-600 cursor-not-allowed border border-white/5' : (video.isPublished ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500 hover:text-white' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white')}`}
                                                >
                                                    {video.isPublished ? 'Draft' : 'Publish'}
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(video._id)}
                                                    className="w-10 flex items-center justify-center bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                                                    title="Delete"
                                                >
                                                    🗑️
                                                </button>
                                            </>
                                        )}
                                    </div>

                                    {video.isFlagged && user?.role === 'Editor' && (
                                        <p className="text-[10px] text-red-400 mt-3 text-center font-medium">Restricted: Flagged for content</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
