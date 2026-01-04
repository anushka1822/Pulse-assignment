const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
let superToken, editorToken, viewerToken;
let videoId;

const login = async (email, password) => {
    try {
        const res = await axios.post(`${API_URL}/auth/login`, { email, password });
        return res.data.token;
    } catch (e) {
        console.error(`Login failed for ${email}:`, e.response?.data?.message || e.message);
        process.exit(1);
    }
};

const runTests = async () => {
    console.log('--- Starting Verification ---');

    // 1. Login
    superToken = await login('super@admin.com', 'password123'); // Updated global admin
    editorToken = await login('editor@alpha.com', 'password123');
    viewerToken = await login('viewer@alpha.com', 'password123');
    console.log('✅ Logged in all roles');

    // 2. Editor Uploads Video (Should be Flagged)
    // For this script, we can't easily upload a file via axios node without form-data lib complex setup.
    // Instead, we will simulate the check by listing videos. 
    // Wait, we need a video to test visibility.
    // Let's assume there is at least one video or we create one dummy if possible.
    // Since upload is complex in script, let's rely on manual upload or just check listing logic if empty.

    // Actually, we can use a small buffer for upload.
    const FormData = require('form-data');
    const form = new FormData();
    form.append('title', 'Test Video');
    form.append('video', Buffer.from('dummy'), 'test.mp4');

    try {
        const upRes = await axios.post(`${API_URL}/videos/upload`, form, {
            headers: {
                ...form.getHeaders(),
                Authorization: `Bearer ${editorToken}`
            }
        });
        videoId = upRes.data._id;
        console.log(`✅ Video Uploaded: ${videoId}`);
        if (upRes.data.isFlagged !== true) console.error('❌ FAIL: Video should be flagged on upload');
        else console.log('✅ Video is correctly Auto-Flagged');
    } catch (e) {
        console.error('❌ Upload Failed:', e.message);
    }

    // 3. Viewer Tries to View (Should NOT see it)
    try {
        const viewRes = await axios.get(`${API_URL}/videos`, {
            headers: { Authorization: `Bearer ${viewerToken}` }
        });
        const found = viewRes.data.find(v => v._id === videoId);
        if (found) console.error('❌ FAIL: Viewer saw a Flagged/Unpublished video');
        else console.log('✅ Viewer cannot see Flagged video');
    } catch (e) {
        console.error('Error fetching viewer videos:', e.message);
    }

    // 4. Admin Unflags (Approves)
    try {
        await axios.patch(`${API_URL}/videos/${videoId}`, { isFlagged: false }, {
            headers: { Authorization: `Bearer ${superToken}` }
        });
        console.log('✅ Admin Unflagged the video');
    } catch (e) {
        console.error('❌ Admin Unflag Failed:', e.message);
    }

    // 5. Editor Publishes
    try {
        await axios.patch(`${API_URL}/videos/${videoId}`, { isPublished: true }, {
            headers: { Authorization: `Bearer ${editorToken}` }
        });
        console.log('✅ Editor Published the video');
    } catch (e) {
        console.error('❌ Editor Publish Failed:', e.message);
    }

    // 6. Viewer Tries to View (Should See it now)
    try {
        const viewRes = await axios.get(`${API_URL}/videos`, {
            headers: { Authorization: `Bearer ${viewerToken}` }
        });
        const found = viewRes.data.find(v => v._id === videoId);
        if (found) console.log('✅ Viewer can now see the video!');
        else console.error('❌ FAIL: Viewer still cannot see video');
    } catch (e) {
        console.error('Error fetching viewer videos:', e.message);
    }

    console.log('--- Verification Complete ---');
};

runTests();
