const YT_API_KEY = "AIzaSyB97JCri-dlKx3ly1i3QO_calCWFC9t-2s";

const CHANNEL_IDS = [
  "UCwF9kkX-rzlFEJj9mieVOEA",
  "UCJUg0O8CGreZvwBmN6T3uTg"
];

const MAX_RESULTS = 600;

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
    if (!res.ok) break;

    const data = await res.json();
    results = results.concat(
      (data.items || []).map((item) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        publishedAt: item.snippet.publishedAt
      }))
    );

    if (!data.nextPageToken) break;
    nextPage = data.nextPageToken;
  }
  return results;
}

function isQarqastanEpisode(title) {
  if (!title) return false;
  const t = title.replace(/\s/g, "");
  return t.startsWith("بودكاست:");
}

async function fetchQarqastanEpisodes() {
  let all = [];
  for (const id of CHANNEL_IDS) {
    const videos = await fetchChannelVideos(id);
    all = all.concat(videos);
  }
  all = all.filter((v) => isQarqastanEpisode(v.title));
  all.sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
  return all;
}

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

function updateHero(ep) {
  if (!ep) return;
  if (heroTitleEl) heroTitleEl.textContent = ep.title;
  if (heroMetaEl) {
    const dateTxt = formatArabicDate(ep.publishedAt);
    const desc = truncate(ep.description, 120);
    heroMetaEl.textContent =
      (dateTxt ? `نُشرت في ${dateTxt}. ` : "") +
      (desc || "حلقة جديدة من بودكاست قرقستان.");
  }
  if (heroIframeEl) heroIframeEl.src = `https://www.youtube.com/embed/${ep.id}`;
  if (heroLinkEl) heroLinkEl.href = `https://www.youtube.com/watch?v=${ep.id}`;
}

function renderEpisodes(episodes) {
  if (!episodesGridEl) return;
  episodesGridEl.innerHTML = "";
  episodes.forEach((ep, index) => {
    const article = document.createElement("article");
    article.className = "episode-card";

    const tags = [];
    const t = ep.title || "";
    if (t.includes("روبلوكس")) tags.push("روبلوكس");
    if (t.includes("سوني") || t.includes("سايلنت")) tags.push("سوني");
    if (t.includes("بوروتو") || t.includes("أنمي")) tags.push("أنمي");
    if (!tags.length) tags.push("ألعاب");

    const episodeNumber = String(index + 1).padStart(2, "0");

    article.innerHTML = `
      <div class="episode-card__badge">الحلقة ${episodeNumber}</div>
      <h3 class="episode-card__title">${ep.title}</h3>
      <p class="episode-card__meta">${formatArabicDate(ep.publishedAt)}</p>
      <p class="episode-card__desc">${truncate(ep.description, 160)}</p>
      <div class="episode-card__tags">
        ${tags.map((x) => `<span>#${x}</span>`).join("")}
      </div>
      <div class="episode-card__actions">
        <a href="https://www.youtube.com/watch?v=${ep.id}" target="_blank" class="btn btn-sm btn-primary">
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
        const tags = card.querySelector(".episode-card__tags").textContent;
        if (filter === "all") card.style.display = "";
        else if (filter === "roblox" && tags.includes("روبلوكس"))
          card.style.display = "";
        else if (filter === "anime" && tags.match(/أنمي|بوروتو/))
          card.style.display = "";
        else if (filter === "games") card.style.display = "";
        else card.style.display = "none";
      });
    });
  });
}

async function initQarqastan() {
  if (!YT_API_KEY || YT_API_KEY === "YOUR_API_KEY_HERE" || !CHANNEL_IDS.length) {
    console.warn("YouTube API key أو Channel IDs غير مضبوطة.");
    return;
  }
  try {
    const episodes = await fetchQarqastanEpisodes();
    if (!episodes.length) return;
    updateHero(episodes[0]);
    renderEpisodes(episodes);
    setupFilters();
  } catch (e) {
    console.error(e);
  }
}

initQarqastan();
