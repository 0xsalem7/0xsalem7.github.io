const YT_API_KEY = "AIzaSyB97JCri-dlKx3ly1i3QO_calCWFC9t-2s";

const CHANNEL_IDS = [
  "UCwF9kkX-rzlFEJj9mieVOEA",
  "UCJUg0O8CGreZvwBmN6T3uTg"
];

const MAX_RESULTS = 600;
const QARQASTAN_QUERY = "قرقستان";

const navToggle = document.getElementById("navToggle");
const siteNav = document.getElementById("siteNav");

if (navToggle && siteNav) {
  navToggle.addEventListener("click", () => {
    siteNav.classList.toggle("is-open");
  });
}

const footerYearEl = document.getElementById("footerYear");
if (footerYearEl) {
  footerYearEl.textContent = new Date().getFullYear().toString();
}

const heroTitleEl = document.getElementById("heroEpisodeTitle");
const heroMetaEl = document.getElementById("heroEpisodeMeta");
const heroIframeEl = document.getElementById("heroEpisodePlayer");
const heroLinkEl = document.getElementById("heroEpisodeLink");
const episodesGridEl = document.getElementById("episodesGrid");
const filterButtons = document.querySelectorAll(".filter-btn");

function formatArabicDate(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  return d.toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

function truncate(text, maxLength) {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "…";
}

async function fetchChannelVideos(channelId) {
  let results = [];
  let nextPage = "";
  while (results.length < MAX_RESULTS) {
    const url =
      "https://www.googleapis.com/youtube/v3/search" +
      `?part=snippet&channelId=${channelId}` +
      `&maxResults=50` +
      `&order=date` +
      `&type=video` +
      (nextPage ? `&pageToken=${nextPage}` : "") +
      `&key=${YT_API_KEY}`;

    const res = await fetch(url);
    if (!res.ok) {
      console.error("YouTube API error", await res.text());
      break;
    }

    const data = await res.json();
    const items = data.items || [];

    const episodes = items
      .filter((item) => item.id && item.id.videoId && item.snippet)
      .map((item) => ({
        id: item.id.videoId,
        title: item.snippet.title || "",
        description: item.snippet.description || "",
        publishedAt: item.snippet.publishedAt || ""
      }));

    results = results.concat(episodes);

    if (!data.nextPageToken) break;
    nextPage = data.nextPageToken;
  }
  return results;
}

async function fetchQarqastanEpisodes() {
  let all = [];

  for (const channelId of CHANNEL_IDS) {
    const videos = await fetchChannelVideos(channelId);
    all = all.concat(videos);
  }

  all = all.filter((ep) => {
    if (!ep.title) return false;
    const t = ep.title.replace(/\s/g, "");
    return t.includes(QARQASTAN_QUERY);
  });

  all.sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  return all;
}

function updateHero(episode) {
  if (!episode) return;

  if (heroTitleEl) heroTitleEl.textContent = episode.title;

  if (heroMetaEl) {
    const dateTxt = formatArabicDate(episode.publishedAt);
    const desc = truncate(episode.description, 120);
    heroMetaEl.textContent =
      (dateTxt ? `نُشرت في ${dateTxt}. ` : "") +
      (desc || "حلقة جديدة من بودكاست قرقستان.");
  }

  if (heroIframeEl) {
    heroIframeEl.src = `https://www.youtube.com/embed/${episode.id}`;
  }
  if (heroLinkEl) {
    heroLinkEl.href = `https://www.youtube.com/watch?v=${episode.id}`;
    heroLinkEl.textContent = "افتح الحلقة في يوتيوب";
  }
}

function renderEpisodes(episodes) {
  if (!episodesGridEl) return;
  episodesGridEl.innerHTML = "";

  episodes.forEach((ep, index) => {
    const article = document.createElement("article");
    article.className = "episode-card";

    const tags = [];
    const title = ep.title || "";
    if (title.includes("روبلوكس")) tags.push("روبلوكس");
    if (title.includes("سوني") || title.includes("سايلنت")) tags.push("سوني");
    if (title.includes("بوروتو") || title.includes("أنمي")) tags.push("أنمي");
    if (tags.length === 0) tags.push("ألعاب");

    const episodeNumber = String(index + 1).padStart(2, "0");

    article.innerHTML = `
      <div class="episode-card__badge">الحلقة ${episodeNumber}</div>
      <h3 class="episode-card__title">${ep.title}</h3>
      <p class="episode-card__meta">
        ${formatArabicDate(ep.publishedAt) || "تاريخ غير متوفر"}
      </p>
      <p class="episode-card__desc">
        ${
          truncate(ep.description, 160) ||
          "حلقة من بودكاست قرقستان عن الألعاب وما يدور حولها."
        }
      </p>
      <div class="episode-card__tags">
        ${tags.map((t) => `<span>#${t.replace("#", "")}</span>`).join("")}
      </div>
      <div class="episode-card__actions">
        <a
          href="https://www.youtube.com/watch?v=${ep.id}"
          target="_blank"
          rel="noopener"
          class="btn btn-sm btn-primary"
        >
          شاهد على يوتيوب
        </a>
      </div>
    `;

    episodesGridEl.appendChild(article);
  });
}

function setupFilters() {
  if (!filterButtons.length || !episodesGridEl) return;

  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const filter = btn.getAttribute("data-filter");

      filterButtons.forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");

      const cards = episodesGridEl.querySelectorAll(".episode-card");
      cards.forEach((card) => {
        if (filter === "all") {
          card.style.display = "";
          return;
        }
        const tagsText =
          card.querySelector(".episode-card__tags")?.textContent || "";

        if (filter === "roblox" && tagsText.includes("روبلوكس")) {
          card.style.display = "";
        } else if (
          filter === "anime" &&
          (tagsText.includes("أنمي") || tagsText.includes("بوروتو"))
        ) {
          card.style.display = "";
        } else if (filter === "games") {
          card.style.display = "";
        } else {
          card.style.display = "none";
        }
      });
    });
  });
}

async function initQarqastan() {
  if (!YT_API_KEY || !CHANNEL_IDS.length) {
    console.warn("YouTube API key أو Channel IDs غير مضبوطة.");
    return;
  }

  try {
    const episodes = await fetchQarqastanEpisodes();
    if (!episodes.length) {
      console.warn("ما لقينا حلقات قرقستان من خلال اليوتيوب.");
      return;
    }

    updateHero(episodes[0]);
    renderEpisodes(episodes);
    setupFilters();
  } catch (err) {
    console.error(err);
  }
}

initQarqastan();
