/* ==========================================================================
   Gallery: images are listed by the admin settings (filenames inside
   frontend/assets/images/) with a simple lightbox.
   ========================================================================== */

async function loadGallery(containerId, limit) {
  const box = document.getElementById(containerId);
  if (!box) return;

  let images = [
    "gallery-01.jpg",
    "gallery-02.jpg",
    "gallery-03.jpg",
    "gallery-04.jpg",
    "gallery-05.jpg",
    "gallery-06.jpg",
  ];

  try {
    const content = await apiGet("/api/content");
    if (content.galleryImages && content.galleryImages.length) images = content.galleryImages;
  } catch (err) {
    // if the backend is not running we still show the default filenames
  }

  if (limit) images = images.slice(0, limit);

  box.innerHTML = images
    .map(
      (img) =>
        `<img src="${imagePath(img)}" alt="Shankari Riverfront Resort photograph" loading="lazy" onclick="openLightbox('${imagePath(
          img
        )}')" />`
    )
    .join("");
}

function openLightbox(src) {
  const box = document.getElementById("lightbox");
  if (!box) return;
  box.querySelector("img").src = src;
  box.classList.add("open");
}

function closeLightbox() {
  const box = document.getElementById("lightbox");
  if (box) box.classList.remove("open");
}
