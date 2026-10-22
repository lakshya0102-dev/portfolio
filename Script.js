console.log("JavaScript is running")
const themeButton = document.getElementById("themeToggle");

themeButton.addEventListener("click", function () {

    document.body.classList.toggle("dark-mode");

    if (document.body.classList.contains("dark-mode")) {
        themeButton.textContent = "Switch to Light Mode";
    } else {
        themeButton.textContent = "Switch to Dark Mode";
    }

});
const cityInput = document.getElementById("cityInput");
const weatherButton = document.getElementById("weatherButton");
const weatherResult = document.getElementById("weatherResult");
weatherButton.addEventListener("click", getWeather);
async function getWeather() {

    const city = cityInput.value.trim();

    if (!city) {
        weatherResult.textContent = "Please enter a city.";
        return;
    }

    if (
        typeof CONFIG === "undefined" ||
        !CONFIG.weatherApiKey ||
        CONFIG.weatherApiKey === "YOUR_OPENWEATHERMAP_API_KEY"
    ) {
        weatherResult.textContent =
            "Weather service is available in local demonstration only.";
        return;
    }

    weatherResult.textContent = "Loading weather...";

    const apiKey = CONFIG.weatherApiKey;

    const url =
  `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;

    try {

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        weatherResult.innerHTML = `
            <h3>${data.name}</h3>
            <p>Temperature: ${data.main.temp}°C</p>
            <p>Condition: ${data.weather[0].description}</p>
        `;

    } catch (error) {

        weatherResult.textContent =
            "Unable to fetch weather. Please try again.";

        console.error(error);
    }
}

/* ==========================================================================
   Smart Project Finder
   ========================================================================== */
function initProjectFinder() {
    const searchInput = document.getElementById("projectSearchInput");
    const searchContainer = document.getElementById("projectSearchContainer");
    const searchDropdown = document.getElementById("searchResultsDropdown");
    const resultsList = document.getElementById("searchResultsList");
    const searchClearBtn = document.getElementById("searchClearBtn");
    const searchKbdHint = document.getElementById("searchKbdHint");
    const searchIcon = searchContainer ? searchContainer.querySelector(".search-icon") : null;

    const filterStatus = document.getElementById("projectFilterStatus");
    const filterMsg = document.getElementById("projectFilterMsg");
    const clearFilterBtn = document.getElementById("clearFilterBtn");
    const noProjectsFilteredMsg = document.getElementById("noProjectsFilteredMsg");
    const emptyStateResetBtn = document.getElementById("emptyStateResetBtn");

    if (!searchInput || !searchDropdown || !resultsList) {
        return;
    }

    // Technology variations, acronyms, and synonyms
    const ALIASES = {
        js: "javascript",
        javascript: "js",
        py: "python",
        python: "py",
        cpp: "c++",
        "c++": "cpp",
        oop: "object-oriented programming",
        "object-oriented": "oop",
        cli: "command-line",
        "command line": "cli",
        ml: "machine learning",
        "machine learning": "ml",
        ai: "artificial intelligence",
        "artificial intelligence": "ai",
        algo: "algorithms",
        algorithm: "algorithms",
        algorithms: "algorithm",
        web: "frontend",
        frontend: "web"
    };

    // Extract project metadata directly from the page DOM (single source of truth)
    function parseProjectsFromDOM() {
        const items = document.querySelectorAll(".projects-list > li");
        const list = [];

        items.forEach((item, idx) => {
            const link = item.querySelector("a");
            const desc = item.querySelector("p");
            const title = link ? link.textContent.trim() : (item.dataset.title || `Project ${idx + 1}`);
            const url = link ? link.getAttribute("href") : "";
            const description = desc ? desc.textContent.trim() : "";

            let tags = [];
            if (item.dataset.tags) {
                tags = item.dataset.tags.split(",").map(t => t.trim()).filter(Boolean);
            } else {
                const pills = item.querySelectorAll(".project-pill");
                tags = Array.from(pills).map(p => p.textContent.trim());
            }

            list.push({
                id: item.id || `project-${idx}`,
                element: item,
                title,
                url,
                description,
                tags
            });
        });

        return list;
    }

    const projects = parseProjectsFromDOM();
    let currentResults = [];
    let activeIndex = -1;

    // Safe highlighting of matching substrings using DOM text nodes and <mark> elements
    function appendHighlighted(parent, text, query) {
        if (!query) {
            parent.appendChild(document.createTextNode(text));
            return;
        }

        const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(`(${escaped})`, "gi");
        const parts = text.split(regex);

        parts.forEach(part => {
            if (!part) return;
            if (part.toLowerCase() === query.toLowerCase()) {
                const mark = document.createElement("mark");
                mark.className = "search-mark";
                mark.textContent = part;
                parent.appendChild(mark);
            } else {
                parent.appendChild(document.createTextNode(part));
            }
        });
    }

    // Relevance scoring: exact title and tag matches rank highest
    function scoreProject(project, rawQuery) {
        const q = rawQuery.toLowerCase().trim();
        if (!q) return 0;

        const titleLower = project.title.toLowerCase();
        const descLower = project.description.toLowerCase();
        const tagsLower = project.tags.map(t => t.toLowerCase());

        let score = 0;

        // 1. Title match
        if (titleLower === q) {
            score += 200;
        } else if (titleLower.startsWith(q)) {
            score += 100;
        } else if (titleLower.includes(q)) {
            score += 60;
        }

        // 2. Tag / Tech match
        for (const tag of tagsLower) {
            if (tag === q) {
                score += 120;
            } else if (tag.startsWith(q)) {
                score += 70;
            } else if (tag.includes(q)) {
                score += 45;
            }
        }

        // 3. Synonym / alias matching
        const aliasTarget = ALIASES[q];
        if (aliasTarget) {
            for (const tag of tagsLower) {
                if (tag === aliasTarget || tag.includes(aliasTarget)) {
                    score += 65;
                }
            }
            if (titleLower.includes(aliasTarget)) {
                score += 50;
            }
            if (descLower.includes(aliasTarget)) {
                score += 30;
            }
        }

        // Reverse check if any project tag has an alias matching the query
        for (const tag of tagsLower) {
            const tagAlias = ALIASES[tag];
            if (tagAlias && (tagAlias === q || tagAlias.includes(q))) {
                score += 55;
            }
        }

        // 4. Description match
        if (descLower.includes(q)) {
            score += 25;
        }

        // 5. Multi-term query support (all terms matching gives extra boost)
        const terms = q.split(/\s+/).filter(t => t.length > 1);
        if (terms.length > 1) {
            let matchedCount = 0;
            terms.forEach(term => {
                if (titleLower.includes(term) || tagsLower.some(t => t.includes(term)) || descLower.includes(term)) {
                    matchedCount++;
                    score += 20;
                }
            });
            if (matchedCount === terms.length) {
                score += 40;
            }
        }

        return score;
    }

    function search(query) {
        const cleanQuery = query.trim();
        if (!cleanQuery) {
            return projects.map(p => ({ project: p, score: 1 }));
        }

        const scored = [];
        projects.forEach(p => {
            const score = scoreProject(p, cleanQuery);
            if (score > 0) {
                scored.push({ project: p, score });
            }
        });

        // Sort descending by relevance score
        scored.sort((a, b) => b.score - a.score);
        return scored;
    }

    function renderDropdown(results, query) {
        resultsList.innerHTML = "";
        activeIndex = -1;
        currentResults = results;

        if (results.length === 0) {
            const emptyDiv = document.createElement("div");
            emptyDiv.className = "search-empty-state";

            const emptyTitle = document.createElement("p");
            emptyTitle.className = "empty-title";
            emptyTitle.textContent = 'No projects found for "';
            const querySpan = document.createElement("span");
            querySpan.className = "empty-query";
            querySpan.textContent = query.trim();
            emptyTitle.appendChild(querySpan);
            emptyTitle.appendChild(document.createTextNode('"'));

            const emptyHint = document.createElement("p");
            emptyHint.className = "empty-hint";
            emptyHint.textContent = "Try searching for Python, JavaScript, OOP, CLI, or Algorithms.";

            emptyDiv.appendChild(emptyTitle);
            emptyDiv.appendChild(emptyHint);
            resultsList.appendChild(emptyDiv);
            openDropdown();
            return;
        }

        results.forEach((item, idx) => {
            const proj = item.project;
            const row = document.createElement("div");
            row.className = "search-result-item";
            row.setAttribute("role", "option");
            row.setAttribute("id", `search-opt-${idx}`);
            row.setAttribute("data-index", idx);
            row.setAttribute("aria-selected", "false");

            const mainCol = document.createElement("div");
            mainCol.className = "result-main";

            // Title with highlight
            const titleEl = document.createElement("span");
            titleEl.className = "result-title";
            appendHighlighted(titleEl, proj.title, query.trim());
            mainCol.appendChild(titleEl);

            // Description snippet with highlight
            if (proj.description) {
                const descEl = document.createElement("p");
                descEl.className = "result-desc";
                appendHighlighted(descEl, proj.description, query.trim());
                mainCol.appendChild(descEl);
            }

            // Skills & technologies pills
            if (proj.tags && proj.tags.length > 0) {
                const skillsDiv = document.createElement("div");
                skillsDiv.className = "result-skills";
                proj.tags.forEach(tag => {
                    const pill = document.createElement("span");
                    pill.className = "result-pill";
                    appendHighlighted(pill, tag, query.trim());
                    skillsDiv.appendChild(pill);
                });
                mainCol.appendChild(skillsDiv);
            }

            row.appendChild(mainCol);

            // GitHub repository external link button
            if (proj.url) {
                const actCol = document.createElement("div");
                actCol.className = "result-actions";

                const ghLink = document.createElement("a");
                ghLink.href = proj.url;
                ghLink.target = "_blank";
                ghLink.rel = "noopener noreferrer";
                ghLink.className = "result-gh-link";
                ghLink.setAttribute("title", "Open GitHub repository in new tab");
                ghLink.setAttribute("aria-label", `Open ${proj.title} on GitHub`);
                ghLink.innerHTML = `
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                        <polyline points="15 3 21 3 21 9"></polyline>
                        <line x1="10" y1="14" x2="21" y2="3"></line>
                    </svg>
                `;

                // Allow external link click without triggering row navigation
                ghLink.addEventListener("click", e => {
                    e.stopPropagation();
                });

                actCol.appendChild(ghLink);
                row.appendChild(actCol);
            }

            // Click row to navigate to project card
            row.addEventListener("click", () => {
                selectProject(proj);
            });

            // Hover to set active keyboard index
            row.addEventListener("mouseenter", () => {
                setActiveIndex(idx, false);
            });

            resultsList.appendChild(row);
        });

        openDropdown();
    }

    function setActiveIndex(idx, scrollIntoView = true) {
        const items = resultsList.querySelectorAll(".search-result-item");
        items.forEach(el => {
            el.classList.remove("active");
            el.setAttribute("aria-selected", "false");
        });

        activeIndex = idx;
        if (idx >= 0 && idx < items.length) {
            const activeEl = items[idx];
            activeEl.classList.add("active");
            activeEl.setAttribute("aria-selected", "true");
            searchInput.setAttribute("aria-activedescendant", activeEl.id);
            if (scrollIntoView) {
                activeEl.scrollIntoView({ block: "nearest" });
            }
        } else {
            searchInput.removeAttribute("aria-activedescendant");
        }
    }

    function openDropdown() {
        searchDropdown.removeAttribute("hidden");
        searchInput.setAttribute("aria-expanded", "true");
    }

    function closeDropdown() {
        searchDropdown.setAttribute("hidden", "");
        searchInput.setAttribute("aria-expanded", "false");
        searchInput.removeAttribute("aria-activedescendant");
        activeIndex = -1;
    }

    function selectProject(project) {
        if (!project || !project.element) return;
        closeDropdown();

        // Ensure target project is visible if filtering was applied
        project.element.classList.remove("project-card-hidden");

        // Smooth scroll to card in main section
        project.element.scrollIntoView({ behavior: "smooth", block: "center" });

        // Trigger pulse highlight animation
        project.element.classList.remove("project-highlight-pulse");
        void project.element.offsetWidth; // Force reflow
        project.element.classList.add("project-highlight-pulse");
        setTimeout(() => {
            project.element.classList.remove("project-highlight-pulse");
        }, 2200);
    }

    // Section 7 Enhancement: Filter main projects section cleanly without removing DOM elements
    function applyProjectFilter(results, query) {
        const clean = query.trim();
        if (!clean) {
            resetProjectFilter();
            return;
        }

        const matchingIds = new Set(results.map(r => r.project.id));
        let matchCount = 0;

        projects.forEach(p => {
            if (matchingIds.has(p.id)) {
                p.element.classList.remove("project-card-hidden");
                matchCount++;
            } else {
                p.element.classList.add("project-card-hidden");
            }
        });

        if (filterStatus && filterMsg) {
            filterStatus.removeAttribute("hidden");
            filterMsg.textContent = `Showing ${matchCount} of ${projects.length} project${projects.length === 1 ? "" : "s"} for "${clean}"`;
        }

        if (noProjectsFilteredMsg) {
            if (matchCount === 0) {
                noProjectsFilteredMsg.removeAttribute("hidden");
            } else {
                noProjectsFilteredMsg.setAttribute("hidden", "");
            }
        }
    }

    function resetProjectFilter() {
        projects.forEach(p => {
            p.element.classList.remove("project-card-hidden");
        });
        if (filterStatus) {
            filterStatus.setAttribute("hidden", "");
        }
        if (noProjectsFilteredMsg) {
            noProjectsFilteredMsg.setAttribute("hidden", "");
        }
    }

    function clearSearch() {
        searchInput.value = "";
        if (searchClearBtn) searchClearBtn.setAttribute("hidden", "");
        if (searchKbdHint) searchKbdHint.style.display = "inline-flex";
        closeDropdown();
        resetProjectFilter();
        searchInput.focus();
    }

    // Input event for live search
    searchInput.addEventListener("input", () => {
        const val = searchInput.value;
        if (val.trim()) {
            if (searchClearBtn) searchClearBtn.removeAttribute("hidden");
            if (searchKbdHint) searchKbdHint.style.display = "none";
            const results = search(val);
            renderDropdown(results, val);
            applyProjectFilter(results, val);
        } else {
            if (searchClearBtn) searchClearBtn.setAttribute("hidden", "");
            if (searchKbdHint) searchKbdHint.style.display = "inline-flex";
            resetProjectFilter();
            const allResults = search("");
            renderDropdown(allResults, "");
        }
    });

    // Focus event: show dropdown panel
    searchInput.addEventListener("focus", () => {
        const val = searchInput.value;
        const results = search(val);
        renderDropdown(results, val);
    });

    // Keyboard navigation (ArrowDown, ArrowUp, Enter, Escape)
    searchInput.addEventListener("keydown", e => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            if (searchDropdown.hasAttribute("hidden")) {
                const results = search(searchInput.value);
                renderDropdown(results, searchInput.value);
            }
            const count = currentResults.length;
            if (count > 0) {
                const next = activeIndex < count - 1 ? activeIndex + 1 : 0;
                setActiveIndex(next);
            }
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            if (searchDropdown.hasAttribute("hidden")) {
                const results = search(searchInput.value);
                renderDropdown(results, searchInput.value);
            }
            const count = currentResults.length;
            if (count > 0) {
                const prev = activeIndex > 0 ? activeIndex - 1 : count - 1;
                setActiveIndex(prev);
            }
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (activeIndex >= 0 && currentResults[activeIndex]) {
                selectProject(currentResults[activeIndex].project);
            } else if (currentResults.length > 0) {
                selectProject(currentResults[0].project);
            }
        } else if (e.key === "Escape") {
            e.preventDefault();
            closeDropdown();
            searchInput.blur();
        }
    });

    // Clear search button
    if (searchClearBtn) {
        searchClearBtn.addEventListener("click", () => {
            clearSearch();
        });
    }

    // Filter section reset buttons
    if (clearFilterBtn) {
        clearFilterBtn.addEventListener("click", () => {
            clearSearch();
        });
    }
    if (emptyStateResetBtn) {
        emptyStateResetBtn.addEventListener("click", () => {
            clearSearch();
        });
    }

    // Clicking the search icon focuses the input
    if (searchIcon) {
        searchIcon.addEventListener("click", () => {
            searchInput.focus();
        });
    }

    // Outside click closes dropdown
    document.addEventListener("click", e => {
        if (!searchContainer.contains(e.target)) {
            closeDropdown();
        }
    });

    // Keyboard shortcut: '/' focuses the search field when not typing elsewhere
    document.addEventListener("keydown", e => {
        if (e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey) {
            const active = document.activeElement;
            const isTyping =
                active &&
                (active.tagName === "INPUT" ||
                    active.tagName === "TEXTAREA" ||
                    active.isContentEditable ||
                    active.getAttribute("role") === "textbox");

            if (!isTyping) {
                e.preventDefault();
                searchInput.focus();
                searchInput.select();
            }
        }
    });
}

// Initialize on DOM ready
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initProjectFinder);
} else {
    initProjectFinder();
}