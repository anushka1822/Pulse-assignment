const { RekognitionClient, StartContentModerationCommand, GetContentModerationCommand } = require("@aws-sdk/client-rekognition");
const Video = require("../models/Video");

const rekognitionClient = new RekognitionClient({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY,
    }
});

/**
 * Analyzes video for unsafe content using AWS Rekognition.
 * Since video analysis is asynchronous, this function starts the job 
 * and then polls for results (simplified for this assignment).
 */
exports.analyzeVideo = async (s3Key, videoId, io) => {
    try {
        console.log(`Starting AI Analysis for Video: ${videoId}`);

        const startCommand = new StartContentModerationCommand({
            Video: {
                S3Object: {
                    Bucket: process.env.S3_BUCKET_NAME,
                    Name: s3Key
                }
            }
        });

        const startResponse = await rekognitionClient.send(startCommand);
        const jobId = startResponse.JobId;
        console.log(`[REKOGNITION] Job Started. ID: ${jobId} for S3 Key: ${s3Key}`);

        // Background processing
        console.log(`[AI] Background processing triggered for video ${videoId}`);
        processAnalysis(jobId, videoId, io);

        return jobId;
    } catch (err) {
        console.error("AI Analysis Start Error:", err);

        // SAFETY-FIRST POLICY: If AI fails to start (e.g., DNS or Permissions), 
        // we flag the video for manual review to ensure nothing unsafe slips through.
        console.log(`[SAFETY] Triggering manual flag for video ${videoId} due to AI start error`);
        const errorDetail = err.message || "Service Startup Failure";
        await simulateFlagging(videoId, io, ["AI-START-ERROR", `SYSTEM: ${errorDetail}`]);
    }
};

const mapLabelsToFriendlyReasons = (labels) => {
    const mapping = {
        'Tobacco': 'Smoking/Tobacco Detected',
        'Alcohol': 'Alcohol Content Detected',
        'Violence': 'Violence/Physical Fighting',
        'Explicit Content': 'Adult/Explicit Content',
        'Suggestive': 'Suggestive Material',
        'Rude Gestures': 'Inappropriate Gestures',
        'Smoking': 'Smoking/Tobacco Detected'
    };
    return labels.map(label => mapping[label] || label);
};

/**
 * Heuristic Diagnostic Engine:
 * Analyzes failure context to provide smarter labels when AI fails technically.
 */
const runHeuristicDiagnostic = (title, s3Key = "") => {
    console.log(`[DIAGNOSTIC] Analyzing failure context for: Title="${title}", S3Key="${s3Key}"`);
    const diagnosticLabels = [];
    const combined = (title + " " + s3Key).toLowerCase();

    // Policy mappings
    const policyMap = {
        'smoking': ['smok', 'tobacco', 'cigar', 'vape'],
        'alcohol': ['alcoh', 'drink', 'beer', 'wine', 'vodka', 'whiskey'],
        'violence': ['violen', 'fight', 'blood', 'kill', 'gun', 'weapon', 'attack'],
        'suggestive': ['sexy', 'bikini', 'suggestive'],
        'test': ['test', 'sample', 'demo', 'short']
    };

    if (policyMap.smoking.some(k => combined.includes(k))) diagnosticLabels.push("Heuristic: Potential Smoking Detected");
    if (policyMap.alcohol.some(k => combined.includes(k))) diagnosticLabels.push("Heuristic: Potential Alcohol Content");
    if (policyMap.violence.some(k => combined.includes(k))) diagnosticLabels.push("Heuristic: Potential Violence");
    if (policyMap.suggestive.some(k => combined.includes(k))) diagnosticLabels.push("Heuristic: Suggestive Content Policy");

    if (diagnosticLabels.length === 0) {
        console.warn(`[DIAGNOSTIC] Fallback to manual review - no policy patterns found.`);
        diagnosticLabels.push("Manual-Review-Required", "AI-Parsing-Incomplete");
    } else {
        console.log(`[DIAGNOSTIC] Flagged by heuristics: ${diagnosticLabels.join(', ')}`);
    }

    return diagnosticLabels;
};

const simulateFlagging = async (videoId, io, labels) => {
    const updatedVideo = await Video.findByIdAndUpdate(videoId, {
        isFlagged: true,
        moderationLabels: labels, // Already mapped or heuristic
        status: 'completed'
    }, { new: true }).populate('tenantId', 'name').populate('uploadedBy', 'email');

    if (io && updatedVideo) {
        const tenantIdStr = updatedVideo.tenantId._id ? updatedVideo.tenantId._id.toString() : updatedVideo.tenantId.toString();
        io.to(tenantIdStr).emit('video.updated', updatedVideo);
        io.to('admin').emit('video.uploaded', updatedVideo);
        io.to('admin').emit('moderation.alert', {
            videoId: updatedVideo._id,
            title: updatedVideo.title,
            reasons: friendlyLabels,
            message: `🤖 AI Detected: ${friendlyLabels.join(', ')} in "${updatedVideo.title}"`
        });
    }
};

const processAnalysis = async (jobId, videoId, io) => {
    let finished = false;
    let attempts = 0;
    const maxAttempts = 60;

    while (!finished && attempts < maxAttempts) {
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 5000));

        try {
            const getCommand = new GetContentModerationCommand({ JobId: jobId });
            const response = await rekognitionClient.send(getCommand);

            if (response.JobStatus === 'SUCCEEDED') {
                finished = true;
                const labels = response.ModerationLabels
                    .filter(label => label.ModerationLabel.Confidence > 50)
                    .map(label => label.ModerationLabel.Name);

                const uniqueLabels = [...new Set(labels)];
                const friendlyLabels = mapLabelsToFriendlyReasons(uniqueLabels);
                const isFlagged = friendlyLabels.length > 0;

                const updatedVideo = await Video.findByIdAndUpdate(videoId, {
                    isFlagged: isFlagged,
                    moderationLabels: friendlyLabels,
                    status: 'completed'
                }, { new: true }).populate('tenantId', 'name').populate('uploadedBy', 'email');

                if (io) {
                    const tenantIdStr = updatedVideo.tenantId._id ? updatedVideo.tenantId._id.toString() : updatedVideo.tenantId.toString();
                    io.to(tenantIdStr).emit('video.updated', updatedVideo);
                    if (isFlagged) {
                        io.to('admin').emit('video.uploaded', updatedVideo);
                        io.to('admin').emit('moderation.alert', {
                            videoId: updatedVideo._id,
                            title: updatedVideo.title,
                            reasons: friendlyLabels,
                            message: `🚨 AI detected ${friendlyLabels.join(', ')} in "${updatedVideo.title}"`
                        });
                    }
                }
            } else if (response.JobStatus === 'FAILED') {
                finished = true;
                const errorReason = response.StatusMessage || "Failed to parse video file";
                console.error(`[AI] Video ${videoId} analysis FAILED: ${errorReason}`);

                // Activate Heuristic Diagnostic Engine on Failure
                const video = await Video.findById(videoId);
                const diagnosticLabels = runHeuristicDiagnostic(video?.title || "", video?.s3Key || "");

                console.log(`[AI] Fallback diagnostic for ${videoId}:`, diagnosticLabels);
                await simulateFlagging(videoId, io, diagnosticLabels);
            }
        } catch (err) {
            console.error(`[AI] Error polling for video ${videoId}:`, err);
        }
    }
    if (!finished) await Video.findByIdAndUpdate(videoId, { status: 'failed' });
};
