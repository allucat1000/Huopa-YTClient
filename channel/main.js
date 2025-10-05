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

const id = (new URLSearchParams(window.location.search)).get("id") || (new URLSearchParams(window.location.search)).get("handle");

searchInput.addEventListener("keydown", (e) => {
    if (e.key == "Enter") {
        e.preventDefault();
        if (searchInput.value) search(searchInput.value);
    }
})

async function search(q) {
    window.location.href = `../search/index.html?q=${q}`;
}

const error = document.createElement("h2");
setAttrs(error, {
    id: "error"
})

async function main() {
    if (!id) {
        error.textContent = "Channel ID or handle required";
        const recentVideosTitle = document.getElementById("recentVideosTitle");
        recentVideosTitle.remove();
        contentDiv.append(error);
    } else {
        let response;
        if (id.startsWith("@")) {
            response = await fetch(`https://huopa-yt-api.deno.dev/channel?handle=${id}`);
        } else {
            response = await fetch(`https://huopa-yt-api.deno.dev/channel?id=${id}`);
        }
        if (!response.ok) {
            const recentVideosTitle = document.getElementById("recentVideosTitle");
            recentVideosTitle.remove();
            if (response.status == 404) {
                error.textContent = "Channel not found"
            } else if (response.status == 500) {
                error.textContent = "Server failed to get channel data"
            } else {
                error.textContent = "An unknown error occurred while fetching channel data"
            }
            contentDiv.append(error);
        }
        const data = await response.json()
        document.title = data.handle + " — YouTube";
        const profPfp = document.getElementById("channelPfp");
        const profName = document.getElementById("channelName");
        const profHandle = document.getElementById("channelHandle");
        const subCount = document.getElementById("channelSubcount")
        const vidCount = document.getElementById("channelVidcount")
        subCount.textContent = `${formatCount(data.statistics.subscriberCount)} subscribers`;
        vidCount.textContent = `${formatCount(data.statistics.videoCount)} videos`;
        setFavicon(data.thumbnails.medium.url);

        profName.textContent = data.name;
        profHandle.textContent = data.handle;
        profPfp.src = data.thumbnails.medium.url;
        profPfp.onload = () => profPfp.style.display = "block"
        const vidSection = document.getElementById("recentVideos");
        for (const result of data.videos) {
            const card = document.createElement("div");
            setAttrs(card, {
                id: "videoCard",
                onclick: () => {
                    window.location.href = `../watch/index.html?v=${result.videoId}`
                }
            });
            const title = document.createElement("a");
            setAttrs(title, {
                id: "videoTitle",
                textContent: decodeHTML(result.title),
                href: `../watch/index.html?v=${result.videoId}`
            })
            const creator = document.createElement("a");
            setAttrs(creator, {
                id: "videoCreator",
                textContent: decodeHTML(data.name),
                href: `../channel/index.html?id=${result.channelId}`
            })
            const thumbnail = document.createElement("img");
            setAttrs(thumbnail, {
                id: "videoThumbnail",
                src: result.thumbnails.medium.url,
                onload: () => thumbnail.style.display = "block"
            })
            card.append(thumbnail, title, creator)
            vidSection.append(card)
        }
    }
}

function formatCount(num) {
  if (num >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'b';
  } else if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'm';
  } else if (num >= 1_000) {
    return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
  } else {
    return num.toString();
  }
}

function decodeHTML(str) {
    return new DOMParser().parseFromString(str, "text/html").documentElement.textContent;
}

function setFavicon(url) {
  let link = document.querySelector("link[rel~='icon']");
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.href = url;
}

main()