
const express = require("express");
const multer = require("multer");

const router = express.Router();


const UPLOAD_DIR = "./uploads";
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    // Add .webm to file name
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + '.webm'); 
    },
});

const upload = multer({ storage });


router.post("/upload-audio", upload.single("audio"), async (req, res) => {
    
    // to import mjs file 
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
        const filePath = req.file.path; 
       
        const result = await handleAudioRequest(filePath);

        res.json(result); 

    } catch (error) {
        console.error("Route processing error:", error);
        res.status(500).json({ error: "Failed to process audio request." });
    }
});

module.exports = router;