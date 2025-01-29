// Enforce HTTPS
if (location.protocol !== 'https:' && !location.host.includes('localhost')) {
    location.replace(`https:${location.href.substring(location.protocol.length)}`);
}

const webcamBtn = document.getElementById('webcamBtn');
const videoElement = document.getElementById('webCamVideo');
const screenShare = document.getElementById('screenShare');
const micBtn = document.getElementById('micBtn');
const endCall = document.getElementById('end');
const meetingIdElement = document.getElementById('meetingId');
const screenSharingBanner = document.getElementById('screenSharingBanner');

let mediaStream = null;
let screenStream = null;
let isMuted = false;
let isScreenSharing = false;

// Clipboard functionality
document.querySelector('.copy-meeting-id').addEventListener('click', () => {
    navigator.clipboard.writeText(meetingIdElement.textContent)
        .then(() => showAlert('Meeting ID copied to clipboard!', 'success'))
        .catch(() => showAlert('Failed to copy meeting ID', 'danger'));
});

// Webcam controls
async function startWebCam() {
    try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ 
            video: true, 
            audio: true 
        });
        videoElement.srcObject = mediaStream;
        updateButtonStates(true);
        showAlert('Camera and microphone enabled', 'success');
    } catch (error) {
        showAlert('Error accessing media devices. Please check permissions.', 'danger');
        console.error('Media access error:', error);
    }
}

function stopWebCam() {
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        mediaStream = null;
    }
    videoElement.srcObject = null;
    updateButtonStates(false);
}

// Screen sharing
async function toggleScreenShare() {
    try {
        if (!isScreenSharing) {
            screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            screenStream.getTracks().forEach(track => {
                track.onended = () => handleScreenShareEnd();
                mediaStream.addTrack(track);
            });
            isScreenSharing = true;
            screenSharingBanner.classList.remove('d-none');
            screenShare.classList.add('active');
        } else {
            handleScreenShareEnd();
        }
    } catch (error) {
        showAlert('Screen sharing failed to start', 'danger');
        console.error('Screen share error:', error);
    }
}

function handleScreenShareEnd() {
    screenStream.getTracks().forEach(track => track.stop());
    isScreenSharing = false;
    screenSharingBanner.classList.add('d-none');
    screenShare.classList.remove('active');
    startWebCam(); // Restart webcam
}

// Audio controls
function toggleAudio() {
    isMuted = !isMuted;
    mediaStream.getAudioTracks().forEach(track => track.enabled = !isMuted);
    micBtn.classList.toggle('muted', isMuted);
    micBtn.innerHTML = isMuted ? '<i class="ri-mic-off-line"></i>' : '<i class="ri-mic-line"></i>';
}

// Utilities
function updateButtonStates(isActive) {
    const buttons = [micBtn, webcamBtn, screenShare, endCall];
    buttons.forEach(btn => btn.disabled = !isActive);
    webcamBtn.innerHTML = isActive ? '<i class="ri-video-off-line"></i>' : '<i class="ri-video-on-line"></i>';
    webcamBtn.classList.toggle('active', isActive);
}

function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.prepend(alertDiv);
    setTimeout(() => alertDiv.remove(), 5000);
}

// Event listeners
endCall.addEventListener('click', () => {
    if (confirm('Are you sure you want to end the call?')) {
        stopWebCam();
        if (screenStream) screenStream.getTracks().forEach(track => track.stop());
        showAlert('Call ended', 'warning');
    }
});

micBtn.addEventListener('click', toggleAudio);
webcamBtn.addEventListener('click', () => mediaStream ? stopWebCam() : startWebCam());
screenShare.addEventListener('click', toggleScreenShare);

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.code === 'KeyM') toggleAudio();
    if (e.code === 'KeyV') mediaStream ? stopWebCam() : startWebCam();
    if (e.code === 'KeyS') toggleScreenShare();
});
