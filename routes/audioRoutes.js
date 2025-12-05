// audioRoutes.js

const express = require("express");
const multer = require("multer");
// ... (dynamic import logic will follow)

const router = express.Router();

// --------------------------------------------------------
// FIX: Custom Multer storage to enforce the .webm extension
// --------------------------------------------------------
const UPLOAD_DIR = "./uploads";
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    // CRITICAL: Set a fixed filename with the required extension
    filename: (req, file, cb) => {
        // Generates a unique name + the .webm extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + '.webm'); 
    },
});

const upload = multer({ storage });


// POST /api/upload-audio (Handles file upload, transcription, and parsing)
router.post("/upload-audio", upload.single("audio"), async (req, res) => {
    
    // -----------------------------------------------------------------
    // NOTE: Insert dynamic import logic here (as corrected in previous turn)
    // -----------------------------------------------------------------
    let handleAudioRequest;
    try {
        const audioModule = await import("../controllers/audioController.mjs");
        handleAudioRequest = audioModule.handleAudioRequest;
    } catch (importError) {
        console.error("Failed to dynamically import audioController.mjs:", importError);
        return res.status(500).json({ error: "Server module initialization failed." });
    }
    
    if (!req.file) {
        return res.status(400).json({ error: "No audio file uploaded." });
    }
    
    try {
        // Multer's custom diskStorage saved the file with the .webm extension.
        const filePath = req.file.path; 

        // Cleanup note: Since we used diskStorage, we need to ensure the cleanup
        // logic in the controller or a 'finally' block still removes the file.
        
        const result = await handleAudioRequest(filePath);

        res.json(result); 

    } catch (error) {
        console.error("Route processing error:", error);
        res.status(500).json({ error: "Failed to process audio request." });
    }
});

// Export the router using CommonJS syntax
module.exports = router;