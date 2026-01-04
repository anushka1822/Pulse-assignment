import { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import AuthContext from '../context/AuthContext';

const Player = () => {
    const { id } = useParams();
    const { token } = useContext(AuthContext);
    const [videoUrl, setVideoUrl] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if (token && id) {
            // Direct streaming URL with token in query param
            // This allows the browser to handle partial content (range requests) natively
            const streamUrl = `https://pulse-assignment-tca5.onrender.com/api/videos/stream/${id}?token=${token}`;
            setVideoUrl(streamUrl);
        }
    }, [id, token]);

    return (
        <div className="min-h-screen bg-dark-900">
            <Navbar />
            <div className="container mx-auto px-6 py-10 max-w-5xl">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-white mb-2">Streaming Now</h2>
                    <p className="text-gray-400">Sit back and enjoy the high-quality stream</p>
                </div>

                <div className="glass rounded-2xl border border-white/5 shadow-2xl overflow-hidden aspect-video relative group">
                    {error ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-dark-800 p-8 text-center">
                            <div className="max-w-md">
                                <span className="text-5xl mb-4 block">❌</span>
                                <h3 className="text-xl font-bold text-white mb-2">Initialization Error</h3>
                                <p className="text-red-400 text-sm">{error}</p>
                            </div>
                        </div>
                    ) : videoUrl ? (
                        <video
                            controls
                            autoPlay
                            className="w-full h-full object-contain bg-black"
                            src={videoUrl}
                            onError={(e) => {
                                console.error("Video Error:", e);
                                setError("Decoding Error: The browser cannot render this video track. It might be due to an unsupported codec or file corruption.");
                            }}
                        >
                            Your browser does not support the video tag.
                        </video>
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-dark-800">
                            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                            <span className="text-gray-400 font-medium tracking-wide">Initializing Stream...</span>
                        </div>
                    )}
                </div>

                <div className="mt-8 flex items-center gap-4 text-sm text-gray-500 font-medium">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-secondary"></span> Live Stream</span>
                    <span className="w-1 h-1 rounded-full bg-gray-700"></span>
                    <span>1080p HD</span>
                </div>
            </div>
        </div>
    );
};

export default Player;
