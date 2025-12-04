document.addEventListener("DOMContentLoaded", () => {

    // Define assistant image element (THIS WAS MISSING)
    const assistantImg = document.getElementById("assistantImgMenu");

    // Set Assistant Image
    const assignedAssistant = sessionStorage.getItem("assignedAssistant");
    if (assistantImg && assignedAssistant) {
        assistantImg.src = assignedAssistant;
        assistantImg.style.display = "block";
    }

    // Get Voice Recording
    const startButton = document.getElementById("startButton");
    const stopButton = document.getElementById("endButton");
    const playButton = document.getElementById("playButton");
    const audioElement = document.getElementById('audioPlayback');

    let mediaRecorder;
    let audioChunks = [];
    let audioStream;

    // START RECORDING
    startButton.addEventListener("click", async () => {
        try {
            audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(audioStream);

            mediaRecorder.ondataavailable = event => {
                audioChunks.push(event.data);
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                const formData = new FormDataEvent();
                formData.append('audio_data', audioBlob, 'recording.wav');

                await fetch('/upload-audio', { // Replace with your backend endpoint  --> in backed yu call get (upload-audio)
                method: 'POST',
                body: formData
                });
                
                const audioUrl = URL.createObjectURL(audioBlob);
                audioElement.src = audioUrl;
                playButton.disabled = false;
                audioChunks = [];
            };

            mediaRecorder.start();
            startButton.disabled = true;
            stopButton.disabled = false;
            playButton.disabled = true;

        } catch (err) {
            console.error('Error accessing microphone:', err);
        }
    });

    // STOP RECORDING
    stopButton.addEventListener("click", () => {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
            audioStream.getTracks().forEach(track => track.stop());
            startButton.disabled = false;
            stopButton.disabled = true;
        }
    });

    // PLAY RECORDING
    playButton.addEventListener("click", () => {
        if (audioElement.src) {
            audioElement.play();
        }
    });

});
