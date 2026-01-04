import { useState } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const Upload = () => {
    const [title, setTitle] = useState('');
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) {
            setError('Please select a video file');
            return;
        }

        const formData = new FormData();
        formData.append('title', title);
        formData.append('video', file);

        try {
            setUploading(true);
            setError('');
            await api.post('/videos/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            navigate('/dashboard');
        } catch (err) {
            console.error(err);
            setError('Upload failed. ' + (err.response?.data?.message || 'Check your connection'));
            setUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-dark-900">
            <Navbar />
            <div className="container mx-auto px-6 py-10 max-w-2xl">
                <div className="mb-10">
                    <h2 className="text-3xl font-bold text-white mb-2">Upload Video</h2>
                    <p className="text-gray-400">Add a new video to your library</p>
                </div>

                <div className="bg-dark-800 p-8 rounded-2xl border border-white/5 shadow-2xl relative overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full translate-x-16 -translate-y-16"></div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl text-sm mb-8 flex items-center gap-3">
                            <span className="text-xl">⚠️</span>
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                        <div>
                            <label className="block text-sm font-semibold text-gray-300 mb-2">Video Title</label>
                            <input
                                type="text"
                                className="input-field py-3"
                                placeholder="Enter a descriptive title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-300 mb-2">Video File</label>
                            <div className="relative group">
                                <input
                                    type="file"
                                    accept="video/*"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    onChange={handleFileChange}
                                    required
                                />
                                <div className="border-2 border-dashed border-dark-600 group-hover:border-primary/50 group-hover:bg-primary/5 rounded-2xl p-10 transition-all flex flex-col items-center justify-center text-center">
                                    <div className="w-16 h-16 bg-dark-700 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <span className="text-3xl">{file ? '✅' : '📁'}</span>
                                    </div>
                                    <p className="text-gray-300 font-medium mb-1">
                                        {file ? file.name : 'Click to select or drag and drop'}
                                    </p>
                                    <p className="text-gray-500 text-xs uppercase tracking-widest font-bold">
                                        MP4, WEBM, OGG (Max 100MB)
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={uploading}
                                className={`btn-primary w-full py-4 text-lg flex items-center justify-center gap-3 ${uploading ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {uploading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        <span>Uploading...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>⬆️</span>
                                        <span>Upload Video</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Upload;
