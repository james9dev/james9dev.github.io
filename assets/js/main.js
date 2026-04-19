const START_YEAR = 2012;

const setDynamicYears = () => {
  const now = new Date();
  const totalYears = now.getFullYear() - START_YEAR;

  const yearEl = document.getElementById("current-year");
  if (yearEl) {
    yearEl.textContent = String(now.getFullYear());
  }

  const expEl = document.getElementById("experience-years");
  if (expEl) {
    expEl.textContent = `${totalYears}+`;
  }
};

const setupReveal = () => {
  const sections = document.querySelectorAll(".reveal");
  if (!sections.length) {
    return;
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          obs.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.15,
      rootMargin: "0px 0px -40px 0px",
    }
  );

  sections.forEach((section) => observer.observe(section));
};

const setupMobileMenu = () => {
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".site-nav");

  if (!toggle || !nav) {
    return;
  }

  const closeMenu = () => {
    nav.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  };

  toggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 780) {
      closeMenu();
    }
  });
};

const setupScrollSpy = () => {
  const sectionIds = ["home", "about", "projects", "career", "github", "contact"];
  const sections = sectionIds
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  const links = Array.from(document.querySelectorAll(".site-nav a"));
  const recruiterBar = document.querySelector(".recruiter-bar");
  const siteHeader = document.querySelector(".site-header");

  if (!sections.length || !links.length) {
    return;
  }

  const activate = (id) => {
    links.forEach((link) => {
      const linkedId = link.getAttribute("href")?.replace("#", "");
      link.classList.toggle("active", linkedId === id);
    });
  };

  const getAnchorOffset = () => {
    const recruiterHeight = recruiterBar?.offsetHeight || 0;
    const headerHeight = siteHeader?.offsetHeight || 0;
    return recruiterHeight + headerHeight + 12;
  };

  const updateByScroll = () => {
    const marker = window.scrollY + getAnchorOffset();
    const pageBottom = window.scrollY + window.innerHeight;
    const docHeight = document.documentElement.scrollHeight;

    if (pageBottom >= docHeight - 2) {
      activate(sections[sections.length - 1].id);
      return;
    }

    let activeId = "";

    sections.forEach((section) => {
      if (section.offsetTop <= marker) {
        activeId = section.id;
      }
    });

    activate(activeId);
  };

  let ticking = false;
  const requestUpdate = () => {
    if (ticking) {
      return;
    }

    ticking = true;
    window.requestAnimationFrame(() => {
      updateByScroll();
      ticking = false;
    });
  };

  links.forEach((link) => {
    link.addEventListener("click", () => {
      const id = link.getAttribute("href")?.replace("#", "");
      if (id) {
        activate(id);
      }
      window.requestAnimationFrame(requestUpdate);
    });
  });

  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);
  updateByScroll();
};

const setupProjectCarousels = () => {
  const carousels = document.querySelectorAll("[data-carousel]");
  if (!carousels.length) {
    return;
  }

  carousels.forEach((carousel) => {
    const track = carousel.querySelector(".project-track");
    const slides = Array.from(carousel.querySelectorAll(".project-slide"));
    const prevButton = carousel.querySelector("[data-carousel-prev]");
    const nextButton = carousel.querySelector("[data-carousel-next]");
    const dotsContainer = carousel.querySelector(".project-dots");

    if (!track || !slides.length) {
      return;
    }

    let currentIndex = 0;
    const dots = [];
    let isPointerDown = false;
    let startX = 0;
    let deltaX = 0;
    let pointerId = null;

    const getThreshold = () => {
      const width = carousel.clientWidth || 260;
      return Math.max(36, width * 0.18);
    };

    const update = (index) => {
      currentIndex = (index + slides.length) % slides.length;
      track.style.transform = `translateX(-${currentIndex * 100}%)`;

      slides.forEach((slide, slideIndex) => {
        slide.setAttribute("aria-hidden", String(slideIndex !== currentIndex));
      });

      dots.forEach((dot, dotIndex) => {
        const isActive = dotIndex === currentIndex;
        dot.classList.toggle("active", isActive);
        dot.setAttribute("aria-selected", String(isActive));
      });
    };

    const resetDragState = () => {
      isPointerDown = false;
      startX = 0;
      deltaX = 0;
      pointerId = null;
      carousel.classList.remove("is-dragging");
    };

    const onDragStart = (event) => {
      if (event.button !== undefined && event.button !== 0) {
        return;
      }

      if (event.target.closest("button")) {
        return;
      }

      isPointerDown = true;
      startX = event.clientX;
      deltaX = 0;
      pointerId = event.pointerId ?? null;
      carousel.classList.add("is-dragging");
      track.style.transition = "none";
      if (pointerId !== null) {
        carousel.setPointerCapture?.(pointerId);
      }
    };

    const onDragMove = (event) => {
      if (!isPointerDown) {
        return;
      }

      deltaX = event.clientX - startX;
      const width = carousel.clientWidth || 260;
      const baseTranslate = -currentIndex * width;
      track.style.transform = `translateX(${baseTranslate + deltaX}px)`;
    };

    const onDragEnd = (event) => {
      if (!isPointerDown) {
        return;
      }

      if (pointerId !== null) {
        carousel.releasePointerCapture?.(pointerId);
      }

      track.style.transition = "";

      if (Math.abs(deltaX) >= getThreshold()) {
        const direction = deltaX < 0 ? 1 : -1;
        update(currentIndex + direction);
      } else {
        update(currentIndex);
      }

      resetDragState();
      if (event) {
        event.preventDefault();
      }
    };

    slides.forEach((slide) => {
      slide.draggable = false;
    });

    carousel.addEventListener("pointerdown", onDragStart);
    carousel.addEventListener("pointermove", onDragMove);
    carousel.addEventListener("pointerup", onDragEnd);
    carousel.addEventListener("pointercancel", onDragEnd);
    carousel.addEventListener("pointerleave", (event) => {
      if (isPointerDown && event.pointerType === "mouse") {
        onDragEnd(event);
      }
    });

    if (dotsContainer) {
      slides.forEach((_, index) => {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "project-dot";
        dot.setAttribute("aria-label", `이미지 ${index + 1} 보기`);
        dot.setAttribute("aria-selected", index === 0 ? "true" : "false");
        dot.addEventListener("click", () => update(index));
        dotsContainer.appendChild(dot);
        dots.push(dot);
      });
    }

    prevButton?.addEventListener("click", () => update(currentIndex - 1));
    nextButton?.addEventListener("click", () => update(currentIndex + 1));

    carousel.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") {
        update(currentIndex - 1);
      }
      if (event.key === "ArrowRight") {
        update(currentIndex + 1);
      }
    });

    update(0);
  });
};

const setupGithubProjects = () => {
  const repoList = document.getElementById("github-repo-list");
  if (!repoList) {
    return;
  }

  const githubUser = repoList.dataset.githubUser || "james9dev";
  const CATEGORY_LABELS = {
    ios: "iOS",
    android: "Android",
    flutter: "Flutter",
    server: "API Server",
  };

  const hardCodedRepos = [
    {
      name: "connectify-flutter",
      language: "Dart",
      categories: ["flutter"],
      topics: ["flutter", "dart", "mobile"],
      description: "Connectify Flutter 앱 클라이언트 프로젝트",
      summary: "Flutter 기반으로 모바일 기능을 구현한 앱 클라이언트 저장소입니다.",
      repoUrl: `https://github.com/${githubUser}/connectify-flutter`,
    },
    {
      name: "connectify-api-server-gcp",
      language: "Java",
      categories: ["server"],
      topics: ["api", "spring", "gcp", "backend"],
      description: "GCP 환경 기준 Connectify API 서버 프로젝트",
      summary: "Spring 기반 API 서버를 GCP 운영 환경에 맞춰 구성한 백엔드 저장소입니다.",
      repoUrl: `https://github.com/${githubUser}/connectify-api-server-gcp`,
    },
    {
      name: "connectify-ios",
      language: "Swift",
      categories: ["ios"],
      topics: ["ios", "swift", "uikit"],
      description: "Connectify iOS 앱 클라이언트 프로젝트",
      summary: "Swift 기반 iOS 앱 구조와 기능 개발을 담당하는 클라이언트 저장소입니다.",
      repoUrl: `https://github.com/${githubUser}/connectify-ios`,
    },
    {
      name: "connectify-api-server",
      language: "Java",
      categories: ["server"],
      topics: ["api", "spring", "backend"],
      description: "AWS 환경 기준 Connectify API 서버 프로젝트",
      summary: "Spring 기반 API 서버를 AWS 운영 환경에 맞춰 구성한 백엔드 저장소입니다.",
      repoUrl: `https://github.com/${githubUser}/connectify-api-server`,
    },
  ];

  const selectedRepos = hardCodedRepos.map((repo) => ({
    ...repo,
    displayTopics: Array.isArray(repo.topics) ? repo.topics.slice(0, 4) : [],
  }));

  const createMetaItem = (label, value) => {
    const item = document.createElement("li");
    item.textContent = `${label}: ${value}`;
    return item;
  };

  const createRepoCard = (repo) => {
    const card = document.createElement("article");
    card.className = "repo-card";

    const titleRow = document.createElement("div");
    titleRow.className = "repo-title-row";

    const title = document.createElement("h3");
    title.className = "repo-title";
    const titleLink = document.createElement("a");
    titleLink.href = repo.repoUrl;
    titleLink.target = "_blank";
    titleLink.rel = "noreferrer";
    titleLink.textContent = repo.name;
    title.appendChild(titleLink);
    titleRow.appendChild(title);
    card.appendChild(titleRow);

    const description = document.createElement("p");
    description.className = "repo-desc";
    description.textContent = repo.description || "설명이 등록되지 않은 프로젝트입니다.";
    card.appendChild(description);

    const readmeSummary = document.createElement("p");
    readmeSummary.className = "repo-readme";
    readmeSummary.textContent = repo.summary || "프로젝트 핵심 요약이 아직 입력되지 않았습니다.";
    card.appendChild(readmeSummary);

    const tags = document.createElement("ul");
    tags.className = "repo-tags";
    (repo.categories || []).forEach((category) => {
      const tag = document.createElement("li");
      tag.className = "repo-tag repo-tag-skill";
      tag.textContent = CATEGORY_LABELS[category] || category;
      tags.appendChild(tag);
    });
    (repo.displayTopics || []).forEach((topic) => {
      const tag = document.createElement("li");
      tag.className = "repo-tag";
      tag.textContent = `#${topic}`;
      tags.appendChild(tag);
    });
    if (tags.children.length) {
      card.appendChild(tags);
    }

    const meta = document.createElement("ul");
    meta.className = "repo-meta";
    meta.appendChild(createMetaItem("Language", repo.language || "N/A"));
    meta.appendChild(createMetaItem("Type", (repo.categories || []).includes("server") ? "Backend" : "Client App"));
    card.appendChild(meta);

    const actions = document.createElement("div");
    actions.className = "repo-actions";

    const repoLink = document.createElement("a");
    repoLink.className = "repo-link repo-link-primary";
    repoLink.href = repo.repoUrl;
    repoLink.target = "_blank";
    repoLink.rel = "noreferrer";
    repoLink.textContent = "Repository";
    actions.appendChild(repoLink);

    if (typeof repo.homepage === "string" && repo.homepage.startsWith("http")) {
      const demoLink = document.createElement("a");
      demoLink.className = "repo-link";
      demoLink.href = repo.homepage;
      demoLink.target = "_blank";
      demoLink.rel = "noreferrer";
      demoLink.textContent = "Live Demo";
      actions.appendChild(demoLink);
    }

    card.appendChild(actions);
    return card;
  };

  repoList.textContent = "";
  selectedRepos.forEach((repo) => {
    repoList.appendChild(createRepoCard(repo));
  });
};

const THEME_PRESETS = {
  "1": {
    themeColor: "#0b1f3a",
    vars: {
      "--bg": "#f4f7fb",
      "--bg-soft": "#edf3fa",
      "--surface": "rgba(255, 255, 255, 0.88)",
      "--surface-strong": "#ffffff",
      "--text": "#132033",
      "--text-soft": "#42546b",
      "--brand": "#0b1f3a",
      "--accent": "#2f80ed",
      "--accent-2": "#00a3a3",
      "--line": "rgba(19, 32, 51, 0.2)",
      "--shadow": "0 20px 50px rgba(19, 32, 51, 0.15)",
      "--text-rgb": "19, 32, 51",
      "--brand-rgb": "11, 31, 58",
      "--accent-rgb": "47, 128, 237",
      "--accent-2-rgb": "0, 163, 163",
      "--bg-grad-start": "#f4f7fb",
      "--bg-grad-mid": "#edf3fa",
      "--bg-grad-end": "#e5edf7",
      "--recruiter-bg": "#0b1f3a",
      "--recruiter-btn-primary-bg": "#2f80ed",
      "--recruiter-btn-primary-text": "#f4f7fb",
    },
  },
  "2": {
    themeColor: "#1b45c7",
    vars: {
      "--bg": "#eef4ff",
      "--bg-soft": "#e3eeff",
      "--surface": "rgba(255, 255, 255, 0.9)",
      "--surface-strong": "#ffffff",
      "--text": "#0f1d38",
      "--text-soft": "#2f466b",
      "--brand": "#1b45c7",
      "--accent": "#0ea5a5",
      "--accent-2": "#1fa954",
      "--line": "rgba(15, 29, 56, 0.22)",
      "--shadow": "0 20px 50px rgba(15, 29, 56, 0.16)",
      "--text-rgb": "15, 29, 56",
      "--brand-rgb": "27, 69, 199",
      "--accent-rgb": "14, 165, 165",
      "--accent-2-rgb": "31, 169, 84",
      "--bg-grad-start": "#eef4ff",
      "--bg-grad-mid": "#e5efff",
      "--bg-grad-end": "#dce9ff",
      "--recruiter-bg": "#1238a6",
      "--recruiter-btn-primary-bg": "#2ad166",
      "--recruiter-btn-primary-text": "#082012",
    },
  },
  "3": {
    themeColor: "#111827",
    vars: {
      "--bg": "#f8f6f2",
      "--bg-soft": "#f0ede7",
      "--surface": "rgba(255, 255, 255, 0.9)",
      "--surface-strong": "#ffffff",
      "--text": "#1f2937",
      "--text-soft": "#4b5563",
      "--brand": "#111827",
      "--accent": "#f97316",
      "--accent-2": "#0ea5a5",
      "--line": "rgba(31, 41, 55, 0.2)",
      "--shadow": "0 20px 50px rgba(31, 41, 55, 0.14)",
      "--text-rgb": "31, 41, 55",
      "--brand-rgb": "17, 24, 39",
      "--accent-rgb": "249, 115, 22",
      "--accent-2-rgb": "14, 165, 165",
      "--bg-grad-start": "#f8f6f2",
      "--bg-grad-mid": "#f0ede7",
      "--bg-grad-end": "#e9e4dc",
      "--recruiter-bg": "#111827",
      "--recruiter-btn-primary-bg": "#f97316",
      "--recruiter-btn-primary-text": "#2d1403",
    },
  },
  "4": {
    themeColor: "#0b1220",
    vars: {
      "--bg": "#eef2f7",
      "--bg-soft": "#e6ebf2",
      "--surface": "rgba(255, 255, 255, 0.9)",
      "--surface-strong": "#ffffff",
      "--text": "#0f172a",
      "--text-soft": "#334155",
      "--brand": "#0b1220",
      "--accent": "#38bdf8",
      "--accent-2": "#14b8a6",
      "--line": "rgba(15, 23, 42, 0.22)",
      "--shadow": "0 20px 50px rgba(15, 23, 42, 0.16)",
      "--text-rgb": "15, 23, 42",
      "--brand-rgb": "11, 18, 32",
      "--accent-rgb": "56, 189, 248",
      "--accent-2-rgb": "20, 184, 166",
      "--bg-grad-start": "#eef2f7",
      "--bg-grad-mid": "#e6ebf2",
      "--bg-grad-end": "#dde5ef",
      "--recruiter-bg": "#0b1220",
      "--recruiter-btn-primary-bg": "#38bdf8",
      "--recruiter-btn-primary-text": "#042237",
    },
  },
  "5": {
    themeColor: "#1f4b3b",
    vars: {
      "--bg": "#f5f8f3",
      "--bg-soft": "#edf3e9",
      "--surface": "rgba(255, 255, 255, 0.9)",
      "--surface-strong": "#ffffff",
      "--text": "#1a2b1d",
      "--text-soft": "#3f5443",
      "--brand": "#1f4b3b",
      "--accent": "#c9a227",
      "--accent-2": "#0ea5a5",
      "--line": "rgba(26, 43, 29, 0.22)",
      "--shadow": "0 20px 50px rgba(26, 43, 29, 0.16)",
      "--text-rgb": "26, 43, 29",
      "--brand-rgb": "31, 75, 59",
      "--accent-rgb": "201, 162, 39",
      "--accent-2-rgb": "14, 165, 165",
      "--bg-grad-start": "#f5f8f3",
      "--bg-grad-mid": "#edf3e9",
      "--bg-grad-end": "#e4ebdd",
      "--recruiter-bg": "#1f4b3b",
      "--recruiter-btn-primary-bg": "#c9a227",
      "--recruiter-btn-primary-text": "#2f2305",
    },
  },
};

const applyTheme = (themeId) => {
  const selectedTheme = THEME_PRESETS[themeId];
  if (!selectedTheme) {
    return;
  }

  Object.entries(selectedTheme.vars).forEach(([key, value]) => {
    document.documentElement.style.setProperty(key, value);
  });

  const themeMeta = document.querySelector('meta[name="theme-color"]');
  if (themeMeta) {
    themeMeta.setAttribute("content", selectedTheme.themeColor);
  }

  document.querySelectorAll(".theme-btn").forEach((button) => {
    const isActive = button.dataset.themeId === themeId;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  window.localStorage.setItem("portfolio-theme", themeId);
};

const setupThemeSwitcher = () => {
  const themeButtons = Array.from(document.querySelectorAll(".theme-btn"));
  if (!themeButtons.length) {
    return;
  }

  const defaultTheme = document.body.dataset.themeDefault || "2";
  const savedTheme = window.localStorage.getItem("portfolio-theme");
  const initialTheme = THEME_PRESETS[savedTheme] ? savedTheme : defaultTheme;

  applyTheme(initialTheme);

  themeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const themeId = button.dataset.themeId || defaultTheme;
      applyTheme(themeId);
    });
  });
};

window.addEventListener("DOMContentLoaded", () => {
  setDynamicYears();
  setupReveal();
  setupMobileMenu();
  setupScrollSpy();
  setupProjectCarousels();
  setupGithubProjects();
  setupThemeSwitcher();
});
