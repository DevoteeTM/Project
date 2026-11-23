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

const maximumYear = 2026;
yearInput.max = String(maximumYear);

let entries = loadEntries();
let editingId = null;

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
    const entryGenres = normalizeGenres(entry);

    type.textContent = entry.type;
    meta.textContent = entry.year || "Год не указан";
    title.textContent = entry.title;
    cardDescription.textContent = entry.description || "Описание не добавлено.";
    status.value = STATUSES.includes(entry.status) ? entry.status : DEFAULT_STATUS;
    status.setAttribute("aria-label", `Статус «${entry.title}»`);
    editButton.setAttribute("aria-label", `Редактировать «${entry.title}»`);

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
document.querySelector("#open-form").addEventListener("click", () => openForm());
document.querySelector("#empty-add").addEventListener("click", () => openForm());
document.querySelector("#close-form").addEventListener("click", closeForm);
document.querySelector("#cancel-form").addEventListener("click", closeForm);

dialog.addEventListener("click", (event) => {
  if (event.target === dialog) closeForm();
});

dialog.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeForm();
});

renderEntries();
