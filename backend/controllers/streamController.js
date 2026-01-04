const Video = require('../models/Video');
const { S3Client, GetObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,     // Matches .env
        secretAccessKey: process.env.AWS_SECRET_KEY, // Matches .env
    },
});

exports.streamVideo = async (req, res) => {
    try {
        const { id } = req.params;
        const video = await Video.findById(id);
        if (!video) return res.status(404).json({ message: "Video not found" });

        // Authentication Support: Check header OR query parameter (for direct <video> tag src)
        let user = req.user;
        if (!user && req.query.token) {
            try {
                const jwt = require('jsonwebtoken');
                user = jwt.verify(req.query.token, process.env.JWT_SECRET);
            } catch (err) {
                return res.status(401).json({ message: "Invalid session token" });
            }
        }

        if (!user) return res.status(401).json({ message: "Authentication required" });

        // Security: Admins can stream anything, others only their tenant
        const userTenantId = user.tenantId?.toString();
        const videoTenantId = video.tenantId.toString();

        if (user.role !== 'Admin' && userTenantId !== videoTenantId) {
            console.warn(`[STREAM] Access Denied for role ${user.role}`);
            return res.status(403).json({ message: "Access Denied" });
        }

        const bucket = process.env.S3_BUCKET_NAME;
        const key = video.s3Key;

        // Get file metadata from S3
        const headCommand = new HeadObjectCommand({ Bucket: bucket, Key: key });
        const headResult = await s3.send(headCommand);
        const videoSize = headResult.ContentLength;

        // Robust Mime Detection
        let contentType = video.mimeType || headResult.ContentType;
        if (!contentType || contentType === 'application/octet-stream') {
            const ext = key.split('.').pop().toLowerCase();
            const mimeMap = {
                'mp4': 'video/mp4',
                'webm': 'video/webm',
                'mov': 'video/quicktime',
                'avi': 'video/x-msvideo',
                'mkv': 'video/x-matroska'
            };
            contentType = mimeMap[ext] || 'video/mp4'; // Default to mp4
        }

        const range = req.headers.range;
        if (!range) {
            const command = new GetObjectCommand({ Bucket: bucket, Key: key });
            const { Body } = await s3.send(command);
            res.setHeader('Content-Length', videoSize);
            res.setHeader('Content-Type', contentType);
            res.setHeader('Cache-Control', 'no-cache');
            Body.pipe(res);
            return;
        }

        const CHUNK_SIZE = 10 ** 6; // 1MB
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : Math.min(start + CHUNK_SIZE, videoSize - 1);

        const command = new GetObjectCommand({
            Bucket: bucket,
            Key: key,
            Range: `bytes=${start}-${end}`
        });

        const { Body, ContentRange } = await s3.send(command);

        res.writeHead(206, {
            "Content-Range": ContentRange || `bytes ${start}-${end}/${videoSize}`,
            "Accept-Ranges": "bytes",
            "Content-Length": end - start + 1,
            "Content-Type": contentType,
            "Cache-Control": "no-cache",
            "X-Content-Type-Options": "nosniff"
        });

        Body.pipe(res);
    } catch (err) {
        console.error("[STREAM ERROR]", err);
        res.status(500).json({ error: "Streaming Failure: " + err.message });
    }
};