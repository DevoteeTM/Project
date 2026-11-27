const STORAGE_KEY = "kinopolka.entries.v1";
const TYPES = ["Фильм", "Сериал"];
const STATUSES = ["Хочу посмотреть", "Смотрю", "Просмотрено"];
const GENRES = [
  "Боевик",
  "Комедия",
  "Драма",
  "Фантастика",
  "Ужасы",
  "Триллер",
  "Приключения",
  "Детектив",
  "Мелодрама",
  "Фэнтези",
  "Мультфильм",
  "Документальный",
  "Криминал",
  "Военный",
  "Исторический",
  "Другое",
];
const DEFAULT_STATUS = STATUSES[0];
const TOP_MOVIES = [
  { title: "Побег из Шоушенка", year: 1994, genre: "Драма", score: "9,3", rating: 5, poster: "01-shawshank-redemption.jpg" },
  { title: "Крёстный отец", year: 1972, genre: "Криминал", score: "9,2", rating: 5, poster: "02-the-godfather.jpg" },
  { title: "Тёмный рыцарь", year: 2008, genre: "Боевик", score: "9,1", rating: 5, poster: "03-the-dark-knight.jpg" },
  { title: "Властелин колец: Возвращение короля", year: 2003, genre: "Фэнтези", score: "9,0", rating: 5, poster: "04-return-of-the-king.jpg" },
  { title: "Список Шиндлера", year: 1993, genre: "Драма", score: "9,0", rating: 5, poster: "05-schindlers-list.jpg" },
  { title: "Крёстный отец 2", year: 1974, genre: "Криминал", score: "9,0", rating: 5, poster: "06-the-godfather-part-ii.jpg" },
  { title: "12 разгневанных мужчин", year: 1957, genre: "Драма", score: "9,0", rating: 5, poster: "07-12-angry-men.jpg" },
  { title: "Властелин колец: Братство Кольца", year: 2001, genre: "Фэнтези", score: "8,9", rating: 4, poster: "08-fellowship-of-the-ring.jpg" },
  { title: "Начало", year: 2010, genre: "Фантастика", score: "8,8", rating: 4, poster: "09-inception.jpg" },
  { title: "Бойцовский клуб", year: 1999, genre: "Драма", score: "8,8", rating: 4, poster: "10-fight-club.jpg" },
  { title: "Форрест Гамп", year: 1994, genre: "Драма", score: "8,8", rating: 4, poster: "11-forrest-gump.jpg" },
  { title: "Криминальное чтиво", year: 1994, genre: "Криминал", score: "8,8", rating: 4, poster: "12-pulp-fiction.jpg" },
  { title: "Властелин колец: Две крепости", year: 2002, genre: "Фэнтези", score: "8,8", rating: 4, poster: "13-the-two-towers.jpg" },
  { title: "Хороший, плохой, злой", year: 1966, genre: "Вестерн", score: "8,8", rating: 4, poster: "14-good-bad-ugly.jpg" },
  { title: "Интерстеллар", year: 2014, genre: "Фантастика", score: "8,7", rating: 4, poster: "15-interstellar.jpg" },
  { title: "Матрица", year: 1999, genre: "Фантастика", score: "8,7", rating: 4, poster: "16-the-matrix.jpg" },
  { title: "Звёздные войны: Империя наносит ответный удар", year: 1980, genre: "Фантастика", score: "8,7", rating: 4, poster: "17-empire-strikes-back.jpg" },
  { title: "Чужой", year: 1979, genre: "Ужасы", score: "8,4", rating: 4, poster: "18-alien.jpg" },
  { title: "Бегущий по лезвию", year: 1982, genre: "Фантастика", score: "8,1", rating: 4, poster: "19-blade-runner.jpg" },
  { title: "Челюсти", year: 1975, genre: "Триллер", score: "8,1", rating: 4, poster: "20-jaws.jpg" },
];

const dialog = document.querySelector("#add-dialog");
const form = document.querySelector("#movie-form");
const cards = document.querySelector("#cards");
const emptyState = document.querySelector("#empty-state");
const emptyTitle = document.querySelector("#empty-title");
const emptyCopy = document.querySelector("#empty-copy");
const itemsCount = document.querySelector("#items-count");
const cardTemplate = document.querySelector("#card-template");
const description = document.querySelector("#description");
const descriptionCount = document.querySelector("#description-count");
const yearInput = document.querySelector("#year");
const formMessage = document.querySelector("#form-message");
const collectionToolbar = document.querySelector("#collection-toolbar");
const genreFilter = document.querySelector("#genre-filter");
const dialogEyebrow = document.querySelector("#dialog-eyebrow");
const dialogTitle = document.querySelector("#dialog-title");
const submitButton = document.querySelector("#submit-form");
const topMoviesList = document.querySelector("#top-movies-list");
const topMoviesPrevious = document.querySelector("#top-movies-previous");
const topMoviesNext = document.querySelector("#top-movies-next");
const deleteDialog = document.querySelector("#delete-dialog");
const deleteDialogTitle = document.querySelector("#delete-dialog-title");
const deleteDialogCopy = document.querySelector("#delete-dialog-copy");
const deleteMessage = document.querySelector("#delete-message");
const cancelDeleteButton = document.querySelector("#cancel-delete");
const confirmDeleteButton = document.querySelector("#confirm-delete");

const maximumYear = 2026;
yearInput.max = String(maximumYear);

let entries = loadEntries();
let editingId = null;
let pendingDeleteId = null;

function normalizeGenres(entry) {
  if (Array.isArray(entry.genres)) {
    return [...new Set(entry.genres.filter((genre) => GENRES.includes(genre)))];
  }

  // Entries created before multi-genre support used a single free-text `genre` value.
  if (typeof entry.genre === "string" && entry.genre.trim()) {
    const legacyGenre = entry.genre.trim();
    return [GENRES.includes(legacyGenre) ? legacyGenre : "Другое"];
  }

  return [];
}

function loadEntries() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(stored)) return [];

    return stored.filter(isStoredEntryValid).map((entry) => ({
      ...entry,
      genres: normalizeGenres(entry),
      status: STATUSES.includes(entry.status) ? entry.status : DEFAULT_STATUS,
    }));
  } catch {
    return [];
  }
}

function isStoredEntryValid(entry) {
  return (
    entry &&
    typeof entry.id === "string" &&
    typeof entry.title === "string" &&
    entry.title.trim().length > 0 &&
    TYPES.includes(entry.type)
  );
}

function saveEntries() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    return true;
  } catch {
    return false;
  }
}

function pluralizeEntries(count) {
  const lastTwo = count % 100;
  const last = count % 10;
  if (lastTwo >= 11 && lastTwo <= 14) return `${count} записей`;
  if (last === 1) return `${count} запись`;
  if (last >= 2 && last <= 4) return `${count} записи`;
  return `${count} записей`;
}

function createGenreTag(genre, isEmpty = false) {
  const tag = document.createElement("span");
  tag.className = `genre-tag${isEmpty ? " genre-tag--empty" : ""}`;
  tag.textContent = genre;
  return tag;
}

function createTrailerSearchUrl(movie) {
  const query = `${movie.title} ${movie.year} официальный трейлер`;
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

function createWatchSearchUrl(movie) {
  const query = `${movie.title} ${movie.year}`;
  return `https://www.kinopoisk.ru/index.php?kp_query=${encodeURIComponent(query)}`;
}

function renderTopMovies() {
  TOP_MOVIES.forEach((movie, index) => {
    const card = document.createElement("article");
    card.className = "top-movie-card";

    const poster = document.createElement("div");
    poster.className = "top-movie-card__poster";

    const image = document.createElement("img");
    image.src = `specs/posters/${movie.poster}`;
    image.alt = `Постер фильма «${movie.title}»`;
    image.loading = index < 4 ? "eager" : "lazy";
    image.draggable = false;

    const body = document.createElement("div");
    body.className = "top-movie-card__body";

    const meta = document.createElement("p");
    meta.className = "top-movie-card__meta";
    meta.textContent = `${movie.year} · ${movie.genre}`;

    const title = document.createElement("h3");
    title.textContent = movie.title;

    const rating = document.createElement("div");
    rating.className = "top-movie-card__rating";

    const stars = document.createElement("span");
    stars.className = "top-movie-card__stars";
    stars.setAttribute("aria-label", `Оценка: ${movie.rating} из 5 звёзд`);
    stars.textContent = "★".repeat(movie.rating);

    const score = document.createElement("span");
    score.className = "top-movie-card__score";
    score.textContent = `${movie.score} / 10`;

    const trailerLink = document.createElement("a");
    trailerLink.className = "top-movie-card__trailer-link";
    trailerLink.href = createTrailerSearchUrl(movie);
    trailerLink.target = "_blank";
    trailerLink.rel = "noopener noreferrer";
    trailerLink.setAttribute(
      "aria-label",
      `Смотреть официальный трейлер фильма «${movie.title}» (${movie.year}) на YouTube`,
    );
    trailerLink.textContent = "Смотреть трейлер";

    const watchLink = document.createElement("a");
    watchLink.className = "top-movie-card__watch-link";
    watchLink.href = createWatchSearchUrl(movie);
    watchLink.target = "_blank";
    watchLink.rel = "noopener noreferrer";
    watchLink.setAttribute(
      "aria-label",
      `Найти фильм «${movie.title}» (${movie.year}) для легального просмотра на Кинопоиске`,
    );
    watchLink.textContent = "Смотреть фильм";

    rating.append(stars, score);
    body.append(meta, title, rating, trailerLink, watchLink);
    poster.append(image);
    card.append(poster, body);
    topMoviesList.append(card);
  });
}

function updateTopMovieArrows() {
  const maximumScroll = topMoviesList.scrollWidth - topMoviesList.clientWidth;
  topMoviesPrevious.disabled = topMoviesList.scrollLeft <= 1;
  topMoviesNext.disabled = topMoviesList.scrollLeft >= maximumScroll - 1;
}

function scrollTopMovies(direction) {
  topMoviesList.scrollBy({
    left: direction * Math.max(topMoviesList.clientWidth * 0.8, 220),
    behavior: "smooth",
  });
}

function enableTopMoviesDragging() {
  let pointerStart = 0;
  let scrollStart = 0;
  let dragging = false;

  topMoviesList.addEventListener("pointerdown", (event) => {
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    dragging = true;
    pointerStart = event.clientX;
    scrollStart = topMoviesList.scrollLeft;
    topMoviesList.classList.add("is-dragging");
    topMoviesList.setPointerCapture(event.pointerId);
  });

  topMoviesList.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    topMoviesList.scrollLeft = scrollStart - (event.clientX - pointerStart);
  });

  const stopDragging = (event) => {
    if (!dragging) return;
    dragging = false;
    topMoviesList.classList.remove("is-dragging");
    if (topMoviesList.hasPointerCapture(event.pointerId)) {
      topMoviesList.releasePointerCapture(event.pointerId);
    }
  };

  topMoviesList.addEventListener("pointerup", stopDragging);
  topMoviesList.addEventListener("pointercancel", stopDragging);
}

function renderEntries() {
  const selectedGenre = genreFilter.value;
  const visibleEntries = selectedGenre
    ? entries.filter((entry) => normalizeGenres(entry).includes(selectedGenre))
    : entries;

  cards.replaceChildren();
  collectionToolbar.hidden = entries.length === 0;
  emptyState.hidden = visibleEntries.length > 0;
  cards.hidden = visibleEntries.length === 0;

  if (selectedGenre) {
    itemsCount.textContent = `${visibleEntries.length} из ${pluralizeEntries(entries.length)}`;
  } else {
    itemsCount.textContent = pluralizeEntries(entries.length);
  }

  if (entries.length === 0) {
    emptyTitle.textContent = "Пока здесь пусто";
    emptyCopy.textContent = "Добавьте первый фильм или сериал — он появится в вашей коллекции.";
  } else if (visibleEntries.length === 0) {
    emptyTitle.textContent = "Ничего не найдено";
    emptyCopy.textContent = `В коллекции пока нет записей в жанре «${selectedGenre}».`;
  }

  visibleEntries.forEach((entry) => {
    const card = cardTemplate.content.firstElementChild.cloneNode(true);
    const image = card.querySelector("img");
    const type = card.querySelector(".card__type");
    const meta = card.querySelector(".card__meta");
    const title = card.querySelector(".card__title");
    const genreList = card.querySelector(".card__genres");
    const cardDescription = card.querySelector(".card__description");
    const status = card.querySelector(".card__status");
    const editButton = card.querySelector(".card__edit");
    const deleteButton = card.querySelector(".card__delete");
    const entryGenres = normalizeGenres(entry);

    type.textContent = entry.type;
    meta.textContent = entry.year || "Год не указан";
    title.textContent = entry.title;
    cardDescription.textContent = entry.description || "Описание не добавлено.";
    status.value = STATUSES.includes(entry.status) ? entry.status : DEFAULT_STATUS;
    status.setAttribute("aria-label", `Статус «${entry.title}»`);
    editButton.setAttribute("aria-label", `Редактировать «${entry.title}»`);
    deleteButton.setAttribute("aria-label", `Удалить «${entry.title}»`);

    if (entryGenres.length > 0) {
      entryGenres.forEach((genre) => genreList.append(createGenreTag(genre)));
    } else {
      genreList.append(createGenreTag("Жанр не указан", true));
    }

    if (entry.posterUrl) {
      image.src = entry.posterUrl;
      image.alt = `Постер: ${entry.title}`;
      image.addEventListener("error", () => image.classList.add("is-broken"), { once: true });
    }

    status.addEventListener("change", () => updateStatus(entry.id, status.value, status));
    editButton.addEventListener("click", () => openForm(entry));
    deleteButton.addEventListener("click", () => openDeleteDialog(entry));
    cards.append(card);
  });
}

function updateStatus(id, nextStatus, select) {
  if (!STATUSES.includes(nextStatus)) return;

  const entry = entries.find((item) => item.id === id);
  if (!entry) return;

  const previousStatus = entry.status;
  entry.status = nextStatus;
  if (!saveEntries()) {
    entry.status = previousStatus;
    select.value = previousStatus;
    window.alert("Не удалось сохранить новый статус. Проверьте настройки браузера и попробуйте ещё раз.");
  }
}

function openDeleteDialog(entry) {
  pendingDeleteId = entry.id;
  deleteDialogTitle.textContent = `Удалить «${entry.title}»?`;
  deleteDialogCopy.textContent =
    "Запись и все сохранённые в ней данные будут удалены из коллекции. Это действие нельзя отменить.";
  deleteMessage.textContent = "";
  deleteDialog.showModal();
  requestAnimationFrame(() => cancelDeleteButton.focus());
}

function closeDeleteDialog() {
  if (deleteDialog.open) deleteDialog.close();
  pendingDeleteId = null;
  deleteMessage.textContent = "";
}

function deleteEntry() {
  const index = entries.findIndex((entry) => entry.id === pendingDeleteId);
  if (index === -1) {
    deleteMessage.textContent = "Запись не найдена. Закройте окно и попробуйте ещё раз.";
    return;
  }

  const [removedEntry] = entries.splice(index, 1);
  if (!saveEntries()) {
    entries.splice(index, 0, removedEntry);
    deleteMessage.textContent = "Не удалось удалить запись. Проверьте настройки браузера и попробуйте ещё раз.";
    return;
  }

  closeDeleteDialog();
  renderEntries();
}

function fillForm(entry) {
  form.elements.type.value = entry.type;
  form.elements.title.value = entry.title;
  form.elements.year.value = entry.year || "";
  form.elements.status.value = STATUSES.includes(entry.status) ? entry.status : DEFAULT_STATUS;
  form.elements.posterUrl.value = entry.posterUrl || "";
  form.elements.description.value = entry.description || "";

  const selectedGenres = normalizeGenres(entry);
  form.querySelectorAll('input[name="genres"]').forEach((checkbox) => {
    checkbox.checked = selectedGenres.includes(checkbox.value);
  });

  descriptionCount.textContent = `${description.value.length} / 2000`;
}

function openForm(entry = null) {
  form.reset();
  clearValidation();
  editingId = entry?.id || null;

  if (entry) {
    fillForm(entry);
    dialogEyebrow.textContent = "Редактирование";
    dialogTitle.textContent = "Изменить запись";
    submitButton.textContent = "Сохранить изменения";
  } else {
    descriptionCount.textContent = "0 / 2000";
    dialogEyebrow.textContent = "Новая запись";
    dialogTitle.textContent = "Добавить в коллекцию";
    submitButton.textContent = "Добавить в коллекцию";
  }

  dialog.showModal();
  requestAnimationFrame(() => document.querySelector("#title").focus());
}

function closeForm() {
  if (dialog.open) dialog.close();
  form.reset();
  editingId = null;
  descriptionCount.textContent = "0 / 2000";
  clearValidation();
}

function clearValidation() {
  formMessage.textContent = "";
  form.querySelectorAll("[aria-invalid]").forEach((field) => field.removeAttribute("aria-invalid"));
  form.querySelectorAll("[data-error-for]").forEach((error) => {
    error.textContent = "";
  });
}

function setFieldError(fieldName, message) {
  const field = form.elements[fieldName];
  const input = field instanceof RadioNodeList ? field[0] : field;
  input?.setAttribute("aria-invalid", "true");
  const error = form.querySelector(`[data-error-for="${fieldName}"]`);
  if (error) error.textContent = message;
}

function validate(values) {
  const errors = {};

  if (!values.title) {
    errors.title = "Введите название фильма или сериала.";
  } else if (values.title.length > 200) {
    errors.title = "Название не должно быть длиннее 200 символов.";
  }

  if (!TYPES.includes(values.type)) {
    errors.type = "Выберите фильм или сериал.";
  }

  if (!STATUSES.includes(values.status)) {
    errors.status = "Выберите допустимый статус просмотра.";
  }

  if (!values.genres.every((genre) => GENRES.includes(genre))) {
    errors.genres = "Выберите жанры из предложенного списка.";
  }

  if (values.year) {
    const numericYear = Number(values.year);
    if (!Number.isInteger(numericYear) || numericYear < 1888 || numericYear > maximumYear) {
      errors.year = `Укажите целый год от 1888 до ${maximumYear}.`;
    }
  }

  if (values.description.length > 2000) {
    errors.description = "Описание не должно быть длиннее 2000 символов.";
  }

  if (values.posterUrl) {
    try {
      const url = new URL(values.posterUrl);
      if (!["http:", "https:"].includes(url.protocol)) throw new Error("Unsupported protocol");
    } catch {
      errors.posterUrl = "Введите корректную ссылку, начинающуюся с http:// или https://.";
    }
  }

  return errors;
}

function valuesFromForm() {
  const formData = new FormData(form);
  return {
    type: String(formData.get("type") || ""),
    title: String(formData.get("title") || "").trim(),
    year: String(formData.get("year") || "").trim(),
    genres: [...new Set(formData.getAll("genres").map(String))],
    status: String(formData.get("status") || DEFAULT_STATUS),
    posterUrl: String(formData.get("posterUrl") || "").trim(),
    description: String(formData.get("description") || "").trim(),
  };
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  clearValidation();

  const values = valuesFromForm();
  const errors = validate(values);

  if (Object.keys(errors).length > 0) {
    Object.entries(errors).forEach(([field, message]) => setFieldError(field, message));
    formMessage.textContent = "Проверьте выделенные поля.";
    const firstInvalid = form.querySelector('[aria-invalid="true"]');
    firstInvalid?.focus();
    return;
  }

  if (editingId) {
    const index = entries.findIndex((entry) => entry.id === editingId);
    if (index === -1) {
      formMessage.textContent = "Запись не найдена. Закройте форму и попробуйте ещё раз.";
      return;
    }

    const previousEntry = entries[index];
    entries[index] = { ...previousEntry, ...values, updatedAt: new Date().toISOString() };
    if (!saveEntries()) {
      entries[index] = previousEntry;
      formMessage.textContent = "Не удалось сохранить изменения. Проверьте настройки браузера и попробуйте ещё раз.";
      return;
    }
  } else {
    const entry = {
      id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      ...values,
      status: values.status || DEFAULT_STATUS,
      createdAt: new Date().toISOString(),
    };

    entries = [entry, ...entries];
    if (!saveEntries()) {
      entries.shift();
      formMessage.textContent = "Не удалось сохранить запись. Проверьте настройки браузера и попробуйте ещё раз.";
      return;
    }
  }

  renderEntries();
  closeForm();
});

description.addEventListener("input", () => {
  descriptionCount.textContent = `${description.value.length} / 2000`;
});

form.addEventListener("input", (event) => {
  const field = event.target;
  if (!(field instanceof HTMLElement) || !field.getAttribute("name")) return;
  field.removeAttribute("aria-invalid");
  const error = form.querySelector(`[data-error-for="${field.getAttribute("name")}"]`);
  if (error) error.textContent = "";
  formMessage.textContent = "";
});

genreFilter.addEventListener("change", renderEntries);
topMoviesPrevious.addEventListener("click", () => scrollTopMovies(-1));
topMoviesNext.addEventListener("click", () => scrollTopMovies(1));
topMoviesList.addEventListener("scroll", updateTopMovieArrows, { passive: true });
topMoviesList.addEventListener(
  "wheel",
  (event) => {
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
    event.preventDefault();
    topMoviesList.scrollLeft += event.deltaY;
  },
  { passive: false },
);
topMoviesList.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    scrollTopMovies(-1);
  } else if (event.key === "ArrowRight") {
    event.preventDefault();
    scrollTopMovies(1);
  }
});
document.querySelector("#open-form").addEventListener("click", () => openForm());
document.querySelector("#empty-add").addEventListener("click", () => openForm());
document.querySelector("#close-form").addEventListener("click", closeForm);
document.querySelector("#cancel-form").addEventListener("click", closeForm);
document.querySelector("#close-delete").addEventListener("click", closeDeleteDialog);
cancelDeleteButton.addEventListener("click", closeDeleteDialog);
confirmDeleteButton.addEventListener("click", deleteEntry);

dialog.addEventListener("click", (event) => {
  if (event.target === dialog) closeForm();
});

dialog.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeForm();
});

deleteDialog.addEventListener("click", (event) => {
  if (event.target === deleteDialog) closeDeleteDialog();
});

deleteDialog.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeDeleteDialog();
});

renderTopMovies();
enableTopMoviesDragging();
updateTopMovieArrows();
renderEntries();
