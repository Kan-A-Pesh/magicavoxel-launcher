const THUMBNAILS = [
    "./images/thumbnails/0.png",
    "./images/thumbnails/1.jpg",
    "./images/thumbnails/2.jpg",
    "./images/thumbnails/3.jpg",
    "./images/thumbnails/4.jpg",
    "./images/thumbnails/5.jpg",
    "./images/thumbnails/6.png",
    "./images/thumbnails/7.jpg",
];

// Load svg icons and replace img[src] with svg content
const loadSvg = () => {
    const imgs = document.querySelectorAll("img[src$='.svg']");
    imgs.forEach((img) => {
        const src = img.getAttribute("src");
        fetch(src)
            .then((res) => res.text())
            .then((data) => {
                const parser = new DOMParser();
                const svg = parser.parseFromString(data, "image/svg+xml").documentElement;
                img.replaceWith(svg);
            });
    });
};

const loadRandomThumbnail = () => {
    const thumbnail = document.querySelector("#THUMBNAIL");
    const randomIndex = Math.floor(Math.random() * THUMBNAILS.length);
    thumbnail.src = THUMBNAILS[randomIndex];
};

const loadRecents = async () => {
    const recents = await window.electronAPI.callAction("get-recents");
    const recentList = document.querySelector("#RECENTS");
    const recentDivTemplate = recentList.querySelector("*[x-template-name='RECENTS']");

    // Sort recents by date (most recent first)
    const sortedRecents = Object.keys(recents).sort((a, b) => Number(b) - Number(a));

    sortedRecents.forEach((id) => {
        const folder = recents[id];
        const clone = recentDivTemplate.cloneNode(true);
        recentList.appendChild(clone);
        clone.removeAttribute("x-template-name");

        const name = clone.querySelector("*[x-template='NAME']");
        const path = clone.querySelector("*[x-template='PATH']");
        const date = clone.querySelector("*[x-template='DATE']");
        const deleteBtn = clone.querySelector("*[x-template='DELETE']");
        const workspaceName = folder.replace(/\\/g, "/").split("/").slice(-2).join("/");

        name.textContent = workspaceName;
        path.textContent = folder;
        date.textContent = new Date(Number(id)).toLocaleDateString("en-GB");

        if (Number(id) === 0) {
            date.textContent = "Default";
            deleteBtn.style.opacity = 0;
        } else {
            deleteBtn.addEventListener("click", async () => {
                await window.electronAPI.callAction("remove-from-recent", id);
                clone.remove();
            });
        }

        clone.addEventListener("click", async (event) => {
            // Check if first parent is the delete button or the clone itself
            let target = event.target;
            while (target !== clone) {
                target = target.parentElement;
                console.log(target, "-", target === deleteBtn, "-", target === clone);
                if (target === deleteBtn) return;
            }

            await window.electronAPI.callAction("open-project", folder);
        });
    });
};

const loadSettings = async () => {
    const path = await window.electronAPI.callAction("get-magica-path");
    document.querySelector("input[name='path']").value = path;
};

(async () => {
    await loadRecents();
    await loadSvg();
    await loadSettings();
    await loadRandomThumbnail();
})();

const openWorkspace = async (folder) => {
    await window.electronAPI.callAction("open-project", folder);
};

const toggleSettingsModal = () => {
    const modal = document.querySelector("#SETTINGS_MODAL");
    modal.classList.toggle("hidden");
};

const openGithub = async () => {
    await window.electronAPI.callAction("open-github-repo");
};

document.querySelector("#OPEN_WORKSPACE").addEventListener("click", () => openWorkspace(null));
document.querySelector("#SETTINGS").addEventListener("click", toggleSettingsModal);
document.querySelector("#GITHUB").addEventListener("click", openGithub);

document.querySelector("#SETTINGS_CLOSE").addEventListener("click", toggleSettingsModal);

document.querySelector("#SETTINGS_FORM").addEventListener("submit", async (e) => {
    e.preventDefault();
    const path = document.querySelector("input[name='path']").value;
    await window.electronAPI.callAction("set-magica-path", path);
    toggleSettingsModal();
});
