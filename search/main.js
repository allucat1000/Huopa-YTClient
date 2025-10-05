// https://huopa-yt-api.deno.dev/search?q=cat
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
    window.location.href = `index.html?q=${q}`;
}

const query = (new URLSearchParams(window.location.search)).get("q");

const maxResults = ((new URLSearchParams(window.location.search)).get("maxResults")) || 25;

if (!query) {
    const error = document.createElement("h2");
    setAttrs(error, {
        id: "error",
        textContent: "Search parameter required"
    });
    contentDiv.append(error)
} else {
    main()
}

async function main() {
    searchInput.value = query
    document.title = `${query} — YouTube`
    const resultDiv = document.getElementById("resultDiv")
    const res = await fetch(`https://huopa-yt-api.deno.dev/search?q=${encodeURIComponent(query)}&maxResults=${maxResults}`);
    const data = await res.json();
    if (data.length < 1) {
        const error = document.createElement("h2");
        setAttrs(error, {
            id: "error",
            textContent: "No results found"
        });
        contentDiv.append(error)
    }
    for (const result of data) {
        const card = document.createElement("div");
        setAttrs(card, {
            id: "videoCard",
            onclick: () => {
                window.location.href = `../watch/index.html?v=${result.id}`
            }
        });
        const title = document.createElement("a");
        setAttrs(title, {
            id: "videoTitle",
            textContent: decodeHTML(result.title),
            href: `../watch/index.html?v=${result.id}`
        })
        const creator = document.createElement("a");
        setAttrs(creator, {
            id: "videoCreator",
            textContent: decodeHTML(result.channelName),
            href: `../channel/index.html?id=${result.channelId}`
        })
        const thumbnail = document.createElement("img");
        setAttrs(thumbnail, {
            id: "videoThumbnail",
            src: result.thumbnails.medium.url,
            onload: () => thumbnail.style.display = "block"
        })
        card.append(thumbnail, title, creator)
        resultDiv.append(card)
    }
}

function decodeHTML(str) {
    return new DOMParser().parseFromString(str, "text/html").documentElement.textContent;
}