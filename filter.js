document.addEventListener("DOMContentLoaded", () => {
  // Элементы
  const btnFilter = document.querySelector(".btn-filter");
  const filterModal = document.getElementById("filterModalNew");
  const closeFilterModal = document.getElementById("closeFilterModalNew");
  const openCategoryBtn = document.getElementById("openCategoryBtn");
  const categoryList = document.getElementById("catList");
  const applyFilterBtn = document.getElementById("filterApplyBtn");
  const resetFilterBtn = document.getElementById("filterResetBtn");
  const cards = document.getElementById("cards");

  // Проверка DOM
  const missing = [
    ["btnFilter", btnFilter],
    ["filterModal", filterModal],
    ["closeFilterModal", closeFilterModal],
    ["openCategoryBtn", openCategoryBtn],
    ["categoryList", categoryList],
    ["applyFilterBtn", applyFilterBtn],
    ["resetFilterBtn", resetFilterBtn],
    ["cards", cards]
  ].filter(([_, el]) => !el);

  if (missing.length) {
    console.error("Не найдены элементы:", missing.map(([name]) => name).join(", "));
    return;
  }

  // Карта ключ -> русское имя
  const categoryMap = {
    electronics: "Электроника",
    cars: "Авто",
    real_estate: "Недвижимость",
    clothes: "Одежда",
    services: "Услуги",
    jobs: "Работа",
    personal: "Личные вещи",
    home_garden: "Дом и сад",
    repair: "Ремонт и строительство",
    hobby: "Спорт и хобби",
    other: "Другое"
  };

  // Открытие/закрытие модалки
  const openModal = () => {
    filterModal.style.display = "flex";
    categoryList.classList.remove("show");
  };
  const closeModal = () => {
    filterModal.style.display = "none";
    categoryList.classList.remove("show");
  };

  btnFilter.addEventListener("click", openModal);
  closeFilterModal.addEventListener("click", closeModal);

  filterModal.addEventListener("click", (e) => {
    if (e.target === filterModal) closeModal();
  });

  openCategoryBtn.addEventListener("click", e => {
    e.stopPropagation();
    categoryList.classList.toggle("show");
  });

  categoryList.addEventListener("click", e => {
    const label = e.target.closest("label");
    if (!label) return;
    const input = label.querySelector('input[name="filterCategoryNew"]');
    if (!input) return;
    input.checked = true;
    openCategoryBtn.textContent = label.textContent.trim();
    categoryList.classList.remove("show");
  });

  document.addEventListener("click", e => {
    if (!categoryList.contains(e.target) && !openCategoryBtn.contains(e.target)) {
      categoryList.classList.remove("show");
    }
  });

  resetFilterBtn.addEventListener("click", () => {
    categoryList.querySelectorAll('input[name="filterCategoryNew"]').forEach(x => x.checked = false);
    openCategoryBtn.textContent = "Категория";
    const minEl = document.getElementById("filterMinPrice");
    const maxEl = document.getElementById("filterMaxPrice");
    if (minEl) minEl.value = "";
    if (maxEl) maxEl.value = "";
  });

  applyFilterBtn.addEventListener("click", () => {
    const ads = Array.isArray(window.allAds) ? window.allAds : [];
    const render = typeof window.renderAds === "function" ? window.renderAds : null;
    if (!render) {
      console.error("Функция renderAds не найдена!");
      return;
    }

    const selectedInput = document.querySelector('input[name="filterCategoryNew"]:checked');
    const selectedKey = selectedInput?.value ?? null;

    const minVal = document.getElementById("filterMinPrice")?.value ?? "";
    const maxVal = document.getElementById("filterMaxPrice")?.value ?? "";
    const minPrice = minVal === "" ? 0 : Number(minVal);
    const maxPrice = maxVal === "" ? Number.POSITIVE_INFINITY : Number(maxVal);

    const filteredAds = ads.filter(ad => {
      const adKey = ad.categoryKey ?? null;
      const adName = ad.categoryName ?? null;

      const byCategory = selectedKey
        ? (adKey === selectedKey) || (adName === categoryMap[selectedKey])
        : true;

      const price = Number(ad.price) || 0;
      const byPrice = price >= minPrice && price <= maxPrice;

      return byCategory && byPrice;
    });

    // 🔍 Отладка
    console.log("Выбранная категория:", selectedKey);
    console.log("Диапазон цен:", minPrice, "-", maxPrice);
    console.log("Найдено объявлений:", filteredAds.length);
    console.log("Отфильтрованные:", filteredAds);

    // 💬 Визуальный отладочный блок
    const debugBlock = document.createElement("div");
    debugBlock.className = "debug-info";
    debugBlock.style.padding = "10px";
    debugBlock.style.background = "#f9f9f9";
    debugBlock.style.border = "1px dashed #ccc";
    debugBlock.style.marginBottom = "10px";
    debugBlock.innerHTML = `
      <strong>Фильтр:</strong><br>
      Категория: ${selectedKey ?? "не выбрана"}<br>
      Цена: от ${minPrice} до ${maxPrice}<br>
      Найдено: ${filteredAds.length}
    `;
    cards.prepend(debugBlock);

    if (filteredAds.length) {
      render(filteredAds);
    } else {
      cards.innerHTML = `<div class="no-ads">Такое объявление пока нет</div>`;
    }

    closeModal();
  });
});