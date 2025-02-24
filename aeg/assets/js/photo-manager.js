let vehicleId;
let folder = null;

function getVehicleIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  vehicleId = params.get("vehicleId");
  folder = params.get("folder"); // optional parameter
}

function showFolderView() {
  // In folder list view, show folder creation & list; hide photo upload controls.
  document.getElementById("folderSection").style.display = "block";
  document.getElementById("photoSection").style.display = "none";
  document.getElementById("pageHeading").textContent = "Manage Photos - Folders";
}

function showPhotoView() {
  // In photo view, show photo gallery and upload controls; hide folder creation controls.
  document.getElementById("folderSection").style.display = "none";
  document.getElementById("photoSection").style.display = "block";
  document.getElementById("pageHeading").textContent = `Photos in Folder: ${folder}`;
}

function uploadVehiclePhotos() {
  let files = document.getElementById("photoInput").files;
  if (!files.length) return;

  let formData = new FormData();
  formData.append("vehicleId", vehicleId);
  // Include folder if in photo view
  if (folder) {
    formData.append("folder", folder);
  }

  for (let file of files) {
    formData.append("photos", file);
  }

  fetch("https://aeg-backend-vq4w.onrender.com/upload", {
    method: "POST",
    body: formData
  })
    .then(response => response.json())
    .then(() => fetchVehiclePhotos())
    .catch(error => console.error("Upload Error:", error));
}

function fetchVehiclePhotos() {
  // Only fetch photos if in photo view.
  if (!folder) return;
  let url = `https://aeg-backend-vq4w.onrender.com/photos/${vehicleId}/${encodeURIComponent(folder)}`;
  fetch(url)
    .then(response => response.json())
    .then(data => {
      let gallery = document.getElementById("photoGallery");
      gallery.innerHTML = "";

      data.photos.forEach(photo => {
        let img = document.createElement("img");
        // Use the image itself as a thumbnail.
        img.src = `https://aeg-backend-vq4w.onrender.com${photo}`;
        img.alt = "Vehicle Photo";
        // On click, open the full image with a timestamp to avoid caching issues.
        img.onclick = () => window.open(`https://aeg-backend-vq4w.onrender.com${photo}?t=${Date.now()}`, "_blank");

        let deleteBtn = document.createElement("button");
        deleteBtn.textContent = "❌";
        deleteBtn.classList.add("btn-delete");
        deleteBtn.onclick = () => deleteVehiclePhoto(photo);

        let photoDiv = document.createElement("div");
        photoDiv.appendChild(img);
        photoDiv.appendChild(deleteBtn);
        gallery.appendChild(photoDiv);
      });
    })
    .catch(error => console.error("Error fetching photos:", error));
}

function deleteVehiclePhoto(photoPath) {
  fetch("https://aeg-backend-vq4w.onrender.com/delete_photo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ vehicleId, photoPath })
  })
    .then(() => fetchVehiclePhotos())
    .catch(error => console.error("Delete Error:", error));
}

function createFolder() {
  let folderName = document.getElementById("folderName").value.trim();
  if (!folderName) {
    alert("Please enter a folder name.");
    return;
  }

  fetch("https://aeg-backend-vq4w.onrender.com/create_folder", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ vehicleId, folderName })
  })
    .then(response => response.json())
    .then(data => {
      console.log(data.message);
      fetchFolders();
      document.getElementById("folderName").value = "";
    })
    .catch(error => {
      console.error("Error creating folder:", error);
      alert("Error creating folder. Check console for details.");
    });
}

function fetchFolders() {
  fetch(`https://aeg-backend-vq4w.onrender.com/folders/${vehicleId}`)
    .then(response => response.json())
    .then(data => {
      let folderList = document.getElementById("folderList");
      folderList.innerHTML = "";

      data.folders.forEach(fld => {
        let folderContainer = document.createElement("div");
        folderContainer.classList.add("folder-item");

        // Create a clickable span for the folder name.
        let folderNameSpan = document.createElement("span");
        folderNameSpan.textContent = fld;
        folderNameSpan.style.cursor = "pointer";
        folderNameSpan.onclick = () => openFolder(fld);
        folderContainer.appendChild(folderNameSpan);

        // Create a delete button for the folder.
        let deleteBtn = document.createElement("button");
        deleteBtn.textContent = "❌";
        deleteBtn.style.marginLeft = "5px";
        deleteBtn.onclick = (e) => {
          e.stopPropagation();
          if (confirm("Are you sure you want to delete folder '" + fld + "'?")) {
            deleteFolder(fld);
          }
        };
        folderContainer.appendChild(deleteBtn);

        folderList.appendChild(folderContainer);
      });
    })
    .catch(error => console.error("Error fetching folders:", error));
}

function deleteFolder(folderName) {
  fetch("https://aeg-backend-vq4w.onrender.com/delete_folder", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ vehicleId, folderName })
  })
    .then(response => response.json())
    .then(data => {
      console.log(data.message);
      fetchFolders();
    })
    .catch(error => console.error("Error deleting folder:", error));
}

function openFolder(folderName) {
  window.location.href = `photo-manager.html?vehicleId=${vehicleId}&folder=${encodeURIComponent(folderName)}`;
}

function goBack() {
  if (folder) {
    // In photo view, Back returns to the folder list view.
    window.location.href = `photo-manager.html?vehicleId=${vehicleId}`;
  } else {
    // In folder list view, Back goes to the existing customer page.
    window.location.href = "existing-customer.html";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  getVehicleIdFromURL();
  if (folder) {
    showPhotoView();
    fetchVehiclePhotos();
  } else {
    showFolderView();
  }
  fetchFolders();
});
