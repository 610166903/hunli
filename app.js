const music = document.querySelector("#bgMusic");
const toggle = document.querySelector(".music-toggle");
const mapHotspot = document.querySelector(".map-hotspot");
const albumButtons = Array.from(document.querySelectorAll(".album-photo-hit"));
const lightbox = document.querySelector(".photo-lightbox");
const lightboxImage = document.querySelector(".lightbox-image");
const lightboxClose = document.querySelector(".lightbox-close");
const lightboxPrev = document.querySelector(".lightbox-prev");
const lightboxNext = document.querySelector(".lightbox-next");
const introVideo = document.querySelector(".intro-video");
const introScrubLayer = document.querySelector(".intro-scrub-layer");
const galleryImages = [
  "gallery-1.jpg",
  "gallery-2.jpg",
  "gallery-3.jpg",
  "gallery-4.jpg",
  "gallery-5.jpg",
  "gallery-6.jpg",
];
let currentPhotoIndex = 0;
let videoFrameRequest = 0;
let introProgress = 0;
let touchStartY = 0;
let isIntroComplete = false;
let introAutoPlayTimer = 0;
let introAutoPlayFrame = 0;
let introAutoPlayStartedAt = 0;
let introVideoReady = false;
let introReleaseTimer = 0;
const isTouchIntroMode = window.matchMedia?.("(pointer: coarse)")?.matches || navigator.maxTouchPoints > 0;

function setMusicState(isPlaying) {
  toggle.classList.toggle("is-playing", isPlaying);
  toggle.setAttribute("aria-pressed", String(isPlaying));
  toggle.setAttribute("aria-label", isPlaying ? "暂停音乐" : "播放音乐");
}

async function playMusic() {
  try {
    await music.play();
    setMusicState(true);
  } catch {
    setMusicState(false);
  }
}

function pauseMusic() {
  music.pause();
  setMusicState(false);
}

toggle.addEventListener("click", () => {
  if (music.paused) {
    playMusic();
  } else {
    pauseMusic();
  }
});

const startOnFirstGesture = (event) => {
  if (event.target?.closest?.(".music-toggle")) return;

  playMusic();
  window.removeEventListener("pointerdown", startOnFirstGesture);
  window.removeEventListener("touchstart", startOnFirstGesture);
  window.removeEventListener("scroll", startOnFirstGesture);
};

window.addEventListener("pointerdown", startOnFirstGesture, { once: true });
window.addEventListener("touchstart", startOnFirstGesture, { once: true });
window.addEventListener("scroll", startOnFirstGesture, { once: true });
playMusic();

mapHotspot.addEventListener("click", (event) => {
  event.preventDefault();
  window.location.href = mapHotspot.href;
});

function showPhoto(index) {
  currentPhotoIndex = (index + galleryImages.length) % galleryImages.length;
  lightboxImage.src = galleryImages[currentPhotoIndex];
  lightboxImage.alt = `相册照片预览 ${currentPhotoIndex + 1}`;
}

function openLightbox(index) {
  showPhoto(index);
  lightbox.classList.add("is-open");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.classList.add("lightbox-open");
}

function closeLightbox() {
  lightbox.classList.remove("is-open");
  lightbox.setAttribute("aria-hidden", "true");
  document.body.classList.remove("lightbox-open");
}

albumButtons.forEach((button) => {
  button.addEventListener("click", () => {
    openLightbox(Number(button.dataset.photoIndex));
  });
});

lightboxClose.addEventListener("click", closeLightbox);
lightboxPrev.addEventListener("click", (event) => {
  event.stopPropagation();
  showPhoto(currentPhotoIndex - 1);
});
lightboxNext.addEventListener("click", (event) => {
  event.stopPropagation();
  showPhoto(currentPhotoIndex + 1);
});
lightboxImage.addEventListener("click", (event) => {
  event.stopPropagation();
  const rect = lightboxImage.getBoundingClientRect();
  const isLeftSide = event.clientX < rect.left + rect.width / 2;
  showPhoto(currentPhotoIndex + (isLeftSide ? -1 : 1));
});

lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox) {
    closeLightbox();
  }
});

document.addEventListener("keydown", (event) => {
  if (!lightbox.classList.contains("is-open")) return;

  if (event.key === "Escape") {
    closeLightbox();
  } else if (event.key === "ArrowLeft") {
    showPhoto(currentPhotoIndex - 1);
  } else if (event.key === "ArrowRight") {
    showPhoto(currentPhotoIndex + 1);
  }
});

function setIntroVideoProgress(progress) {
  videoFrameRequest = 0;
  if (!introVideo || !Number.isFinite(introVideo.duration) || introVideo.duration <= 0) {
    return;
  }

  introProgress = Math.min(Math.max(progress, 0), 1);
  isIntroComplete = introProgress >= 1;
  document.body.classList.toggle("intro-complete", isIntroComplete);

  if (!isIntroComplete && window.scrollY > 0) {
    window.scrollTo(0, 0);
  }

  const nextTime = progress * Math.max(introVideo.duration - 0.04, 0);

  if (Math.abs(introVideo.currentTime - nextTime) > 0.025) {
    introVideo.currentTime = nextTime;
  }
}

function completeIntroVideo() {
  window.clearTimeout(introReleaseTimer);
  introReleaseTimer = 0;
  document.body.classList.remove("intro-playing");
  setIntroVideoProgress(1);
}

function stopIntroAutoPlay() {
  window.clearTimeout(introAutoPlayTimer);
  introAutoPlayTimer = 0;

  if (introAutoPlayFrame) {
    cancelAnimationFrame(introAutoPlayFrame);
    introAutoPlayFrame = 0;
  }
}

function runIntroAutoPlay(timestamp) {
  if (!introVideo || !introVideoReady || isIntroComplete) {
    stopIntroAutoPlay();
    return;
  }

  if (!introAutoPlayStartedAt) {
    introAutoPlayStartedAt = timestamp - introProgress * introVideo.duration * 1000;
  }

  const elapsed = timestamp - introAutoPlayStartedAt;
  setIntroVideoProgress(elapsed / (introVideo.duration * 1000));

  if (!isIntroComplete) {
    introAutoPlayFrame = requestAnimationFrame(runIntroAutoPlay);
  }
}

function startIntroAutoPlay() {
  if (!introVideo || !introVideoReady || isIntroComplete || introAutoPlayFrame) return;
  if (isTouchIntroMode) {
    playIntroVideoSmooth();
    return;
  }
  introAutoPlayStartedAt = 0;
  introAutoPlayFrame = requestAnimationFrame(runIntroAutoPlay);
}

function requestIntroVideoFrame() {
  if (!introVideo || videoFrameRequest) return;
  videoFrameRequest = requestAnimationFrame(() => setIntroVideoProgress(introProgress));
}

function advanceIntroVideo(delta) {
  if (!introVideo) return false;
  if (window.scrollY > 2) return false;
  if (isIntroComplete && delta > 0) return false;
  if (!isIntroComplete && delta < 0 && introProgress <= 0) return true;

  if (isTouchIntroMode) {
    playIntroVideoSmooth();
    return false;
  }

  stopIntroAutoPlay();
  const progressStep = delta / Math.max(window.innerHeight * 1.85, 1);
  setIntroVideoProgress(introProgress + progressStep);
  return true;
}

function getTouchY(event) {
  return event.touches?.[0]?.clientY ?? event.changedTouches?.[0]?.clientY ?? touchStartY;
}

function initializeIntroVideo() {
  if (!introVideo || introVideoReady) return;
  introVideoReady = true;
  if (isTouchIntroMode) {
    introVideo.currentTime = 0;
    introReleaseTimer = window.setTimeout(completeIntroVideo, 5200);
  } else {
    introVideo.pause();
    setIntroVideoProgress(0);
  }
  introAutoPlayTimer = window.setTimeout(startIntroAutoPlay, 1000);
}

async function playIntroVideoSmooth() {
  if (!introVideo || !introVideoReady || isIntroComplete) return;

  stopIntroAutoPlay();
  document.body.classList.add("intro-playing");
  introVideo.playbackRate = 1;

  try {
    await introVideo.play();
  } catch {
    window.setTimeout(completeIntroVideo, 600);
  }
}

if (introVideo) {
  introVideo.addEventListener("loadedmetadata", () => {
    initializeIntroVideo();
  });
  introVideo.addEventListener("durationchange", initializeIntroVideo);
  introVideo.addEventListener("canplay", () => {
    initializeIntroVideo();
    if (!isTouchIntroMode) {
      setIntroVideoProgress(introProgress);
    }
  });
  introVideo.addEventListener("timeupdate", () => {
    if (!isTouchIntroMode || !introVideo.duration) return;
    introProgress = Math.min(introVideo.currentTime / introVideo.duration, 1);
  });
  introVideo.addEventListener("ended", () => {
    document.body.classList.remove("intro-playing");
    completeIntroVideo();
  });

  window.addEventListener("wheel", (event) => {
    if (advanceIntroVideo(event.deltaY)) {
      event.preventDefault();
    }
  }, { passive: false });

  const handleTouchStart = (event) => {
    touchStartY = getTouchY(event);
  };

  const handleTouchMove = (event) => {
    const currentY = getTouchY(event);
    const delta = touchStartY - currentY;

    if (advanceIntroVideo(delta)) {
      event.preventDefault();
      touchStartY = currentY;
    }
  };

  window.addEventListener("touchstart", handleTouchStart, { passive: true });
  window.addEventListener("touchmove", handleTouchMove, { passive: false });

  introScrubLayer?.addEventListener("touchstart", (event) => {
    touchStartY = getTouchY(event);
    playIntroVideoSmooth();
  }, { passive: true });

  introScrubLayer?.addEventListener("touchmove", (event) => {
    const currentY = getTouchY(event);
    const delta = touchStartY - currentY;

    if (advanceIntroVideo(delta)) {
      event.preventDefault();
      touchStartY = currentY;
    }
  }, { passive: false });

  window.addEventListener("scroll", () => {
    if (!isIntroComplete && window.scrollY > 0) {
      window.scrollTo(0, 0);
    }
  }, { passive: true });

  window.addEventListener("resize", requestIntroVideoFrame);
  introVideo.load();
  if (introVideo.readyState >= 1) {
    initializeIntroVideo();
  }
  requestIntroVideoFrame();
}
