const searchInput = document.getElementById("searchInput")
const topbar = document.getElementById("topbar")
const contentDiv = document.getElementById("contentDiv")

function setAttrs(element, attrs) {
    for (const [key, value] of Object.entries(attrs)) {
        if (key === "class") {
            element.classList.add(value);
        } else {
            element[key] = value;
        }
    }
}


searchInput.addEventListener("keydown", (e) => {
    if (e.key == "Enter") {
        e.preventDefault();
        if (searchInput.value) search(searchInput.value);
    }
})

async function search(q) {
    window.location.href = `search/index.html?q=${q}`;
}

document.body.append(contentDiv)
async function mainMenu() {
    contentDiv.innerHTML = "";
    topbar.remove();
    topbar.append(searchInput)
    document.body.append(topbar)
}


mainMenu()