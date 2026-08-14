const music = document.querySelector("#bgMusic");
const toggle = document.querySelector(".music-toggle");
const mapHotspots = Array.from(document.querySelectorAll(".map-hotspot"));
const albumButtons = Array.from(document.querySelectorAll(".album-photo-hit"));
const lightbox = document.querySelector(".photo-lightbox");
const lightboxImage = document.querySelector(".lightbox-image");
const lightboxClose = document.querySelector(".lightbox-close");
const lightboxPrev = document.querySelector(".lightbox-prev");
const lightboxNext = document.querySelector(".lightbox-next");
const introVideo = document.querySelector(".intro-video");
const introScrubLayer = document.querySelector(".intro-scrub-layer");
const galleryImages = [
  "gallery-1-optimized.jpg",
  "gallery-2-optimized.jpg",
  "gallery-3-optimized.jpg",
  "gallery-4-optimized.jpg",
  "gallery-5-optimized.jpg",
  "gallery-6-optimized.jpg",
];
let currentPhotoIndex = 0;

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
window.addEventListener("load", playMusic);
window.addEventListener("pageshow", playMusic);
document.addEventListener("WeixinJSBridgeReady", playMusic);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    playMusic();
  }
});
playMusic();

mapHotspots.forEach((hotspot) => {
  hotspot.addEventListener("click", (event) => {
    event.preventDefault();
    window.location.href = hotspot.href;
  });
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

if (introVideo) {
  let introProgress = 0;
  let introComplete = false;
  let touchStartY = 0;
  let releaseTimer = 0;

  introVideo.muted = true;
  introVideo.playsInline = true;
  introVideo.autoplay = false;
  introVideo.loop = false;
  introVideo.playbackRate = 1;

  const setIntroProgress = (progress) => {
    if (!Number.isFinite(introVideo.duration) || introVideo.duration <= 0) return;

    introProgress = Math.min(Math.max(progress, 0), 1);
    introComplete = introProgress >= 1;
    document.body.classList.toggle("intro-complete", introComplete);

    const targetTime = introProgress * Math.max(introVideo.duration - 0.04, 0);
    if (Math.abs(introVideo.currentTime - targetTime) > 0.025) {
      introVideo.currentTime = targetTime;
    }

    if (introComplete) {
      window.clearTimeout(releaseTimer);
      introVideo.pause();
    }
  };

  const releaseIntro = () => {
    setIntroProgress(1);
  };

  const advanceIntro = (delta) => {
    if (introComplete || window.scrollY > 2) return false;
    if (delta < 0 && introProgress <= 0) return true;

    const step = delta / Math.max(window.innerHeight * 1.45, 1);
    setIntroProgress(introProgress + step);
    return !introComplete;
  };

  const getTouchY = (event) => event.touches?.[0]?.clientY ?? event.changedTouches?.[0]?.clientY ?? touchStartY;

  introVideo.addEventListener("loadedmetadata", () => {
    introVideo.pause();
    setIntroProgress(0);
    releaseTimer = window.setTimeout(releaseIntro, 8000);
  });

  window.addEventListener("wheel", (event) => {
    if (advanceIntro(event.deltaY)) {
      event.preventDefault();
    }
  }, { passive: false });

  introScrubLayer?.addEventListener("touchstart", (event) => {
    touchStartY = getTouchY(event);
  }, { passive: true });

  introScrubLayer?.addEventListener("touchmove", (event) => {
    const currentY = getTouchY(event);
    const delta = touchStartY - currentY;

    if (advanceIntro(delta)) {
      event.preventDefault();
      touchStartY = currentY;
    }
  }, { passive: false });

  window.addEventListener("touchstart", (event) => {
    touchStartY = getTouchY(event);
  }, { passive: true });

  window.addEventListener("touchmove", (event) => {
    const currentY = getTouchY(event);
    const delta = touchStartY - currentY;

    if (advanceIntro(delta)) {
      event.preventDefault();
      touchStartY = currentY;
    }
  }, { passive: false });

  introVideo.load();
}
