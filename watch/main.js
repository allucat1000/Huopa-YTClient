
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

const error = document.createElement("h2");


setAttrs(error, {
    id: "error"
})

searchInput.addEventListener("keydown", (e) => {
    if (e.key == "Enter") {
        e.preventDefault();
        if (searchInput.value) search(searchInput.value);
    }
})

async function search(q) {
    window.location.href = `../search/index.html?q=${q}`;
}
const id = (new URLSearchParams(window.location.search)).get("v");

let data;

let player;

async function main() {

    if (!id) {
        error.textContent = "Video ID parameter required";
        contentDiv.style.display = "none";
        document.body.append(error);
    } else {
        const response = await fetch(`https://huopa-yt-api.deno.dev/video?id=${id}`);
        if (!response.ok) {
            if (response.status == 404) {
                error.textContent = "Video not found"
            } else if (response.status == 500) {
                error.textContent = "Server failed to get video data"
            } else {
                error.textContent = "An unknown error occurred while fetching video data"
            }
            contentDiv.style.display = "none";
            document.body.append(error);
        }
        data = await response.json()
        document.title = data.title + " — YouTube";

        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        document.body.appendChild(tag);

    }

}

main()

function onYouTubeIframeAPIReady() {
    if (data.contentDetails.licensedContent) {
        console.warn("Embedding not allowed, falling back to yout-ube.com");
        const container = document.getElementById("player");
        container.innerHTML = "";

        const frame = document.createElement("iframe")
        frame.src = `https://yout-ube.com/watch?v=${id}`;
        frame.style.width = "100%";
        frame.id = "player"
        frame.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
        frame.allowFullscreen = true;
        container.appendChild(frame);
        onPlayerReady()
    } else {
        player = new YT.Player('player', {
            height: '530',
            width: '700',
            videoId: id,
            playerVars: {
                controls: 1,
                modestbranding: 1,
                rel: 0,
                hl: 'en',
                cc_load_policy: 1,
                cc_lang_pref: 'en',
                iv_load_policy: 3
            },
            events: {
                'onReady': onPlayerReady,
                'onStateChange': playerStateChange,
            }
        });
    }
}

async function onPlayerReady() {
    const title = document.getElementById("videoTitle");
    title.textContent = data.title;
    const author = document.getElementById("videoCreator");
    author.textContent = data.channelTitle;
    author.href = `../channel/index.html?id=${data.channelId}`;
    
    const date = document.getElementById("videoDate");
    const dateObj = new Date(data.publishedAt);
    const formattedDate = dateObj.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "UTC",
        hour12: false
    });
    date.textContent = formattedDate;

    const description = document.getElementById("videoDescription");
    description.textContent = data.description;
    description.classList.add("collapsed");
    const collapseToggle = document.getElementById("showMore");
    collapseToggle.addEventListener("click", () => {
        if (collapseToggle.textContent == "Show more") collapseToggle.textContent = "Show less"; else collapseToggle.textContent = "Show more";
        description.classList.toggle("collapsed");
    });
    loadComments()
}

function playerStateChange(event) {
    switch(event.data) {
        case YT.PlayerState.PLAYING: break;
        case YT.PlayerState.PAUSED: break;
        case YT.PlayerState.ENDED: break;
    }
}

async function fetchComments(videoId, pageToken = "") {
    const url = `https://huopa-yt-api.deno.dev/comments?id=${videoId}&replies=true${pageToken ? `&pageToken=${pageToken}` : ""}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to load comments");
    return res.json();
}

let nextPageToken = null;

const loadMoreButton = document.getElementById("loadMore");

loadMoreButton.addEventListener("click", async() => {
    loadMoreButton.style.opacity = "0"
    await loadComments();
    loadMoreButton.style.opacity = "1"
});

async function loadComments() {
    const commentSection = document.getElementById("commentSection");
    const commentSectionTitle = document.getElementById("commentTitle");
    try {
        const data = await fetchComments(id, nextPageToken);
        nextPageToken = data.nextPageToken;
        for (const comment of data.comments) {
            const commentEl = document.createElement("div");
            setAttrs(commentEl, { class: "comment" });

            const authorContainer = document.createElement("div");
            setAttrs(authorContainer, { class: "commentAuthorContainer" });

            const pfp = document.createElement("img");
            setAttrs(pfp, {
                class: "commentPfp",
                src: comment.authorProfileImageUrl,
                onclick: () => window.location.href = "../channel/index.html?handle=" + comment.authorChannelUrl.split("/").pop()
            });

            const handle = document.createElement("a");
            setAttrs(handle, {
                class: "commentHandle",
                textContent: comment.author,
                href: "../channel/index.html?handle=" + comment.authorChannelUrl.split("/").pop()
            });

            const text = document.createElement("p");
            setAttrs(text, {
                class: "commentText",
                textContent: comment.text
            });

            const date = document.createElement("p");

            setAttrs(date, {
                class: "commentDate",
                textContent: formatCommentDate(comment.publishedAt),
            });

            const showReplies = document.createElement("button");

            authorContainer.append(pfp, handle, date);

            const replyDiv = document.createElement("div");

            setAttrs(replyDiv, {
                class: "replyDiv",
                style: "display: none;"
            })

            setAttrs(showReplies, {
                class: "showReplies",
                textContent: `${comment.totalReplyCount} replies`,
                onclick: () => {
                    if (replyDiv.style.display == "none") replyDiv.style.display = "block"; else replyDiv.style.display = "none";
                }
            })

            if (!comment.replies || comment.replies.length < 1) {
                showReplies.style.display = "none";
            }

            commentEl.append(authorContainer, text, showReplies, replyDiv);

            commentSection.append(commentEl);

            if (comment.replies && comment.replies.length > 0) {
                for (const reply of comment.replies) {
                    const replyEl = document.createElement("div");
                    setAttrs(replyEl, {
                        class: "reply"
                    })
                    const pfp = document.createElement("img");
                    const authorContainer = document.createElement("div");
                    setAttrs(authorContainer, {
                        class: "commentAuthorContainer"
                    });

                    setAttrs(pfp, {
                        class: "commentPfp",
                        style: "margin-left: 4em;",
                        src: reply.authorProfileImageUrl,
                        onclick: () => window.location.href = "../channel/index.html?handle=" + reply.authorChannelUrl.split("/").pop()
                    });

                    const handle = document.createElement("a");
                    setAttrs(handle, {
                        class: "commentHandle",
                        textContent: reply.author,
                        href: "../channel/index.html?handle=" + reply.authorChannelUrl.split("/").pop()
                    });
                    const date = document.createElement("p");

                    setAttrs(date, {
                        class: "commentDate",
                        textContent: formatCommentDate(reply.publishedAt),
                    });

                    authorContainer.append(pfp, handle, date)

                    const text = document.createElement("p");
                    setAttrs(text, {
                        class: "commentText",
                        style: "margin-left: 6em;",
                        textContent: reply.text
                    });
                    replyEl.append(authorContainer, text);
                    
                    replyDiv.append(replyEl);
                }
            }
        }

        if (nextPageToken) {
            loadMoreButton.style.display = "block";
        } else {
            loadMoreButton.style.display = "none";
        }

    } catch (err) {
        console.error(err);
        commentSectionTitle.textContent = "Failed to load comments";
    }
}


function playVideo() { player.playVideo(); }
function pauseVideo() { player.pauseVideo(); }
function stopVideo() { player.stopVideo(); }
function seekTo(seconds) { player.seekTo(seconds, true); }

function formatCommentDate(date) {
    const dateObj = new Date(date);
    const formattedDate = dateObj.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        timeZone: "UTC",
        hour12: false
    });
    return formattedDate;
}