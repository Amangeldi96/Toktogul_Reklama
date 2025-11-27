document.addEventListener("DOMContentLoaded", () => {

  /* ============================
        ❤️ ЛАЙКИ (heart)
  ============================ */
  document.querySelectorAll(".heart").forEach(btn => {
    btn.addEventListener("click", () => {
      btn.classList.toggle("active");
      btn.textContent = btn.classList.contains("active") ? "♥" : "♡";
    });
  });

  /* ============================
        ВКЛАДКИ tabRec / tabNew
  ============================ */
  const tabRec = document.getElementById("tabRec");
  const tabNew = document.getElementById("tabNew");

  if (tabRec && tabNew) {
    tabRec.onclick = () => {
      tabRec.classList.add("active");
      tabNew.classList.remove("active");
    };

    tabNew.onclick = () => {
      tabNew.classList.add("active");
      tabRec.classList.remove("active");
    };
  }

  /* ============================
        FAB КНОПКА
  ============================ */
  const fab = document.getElementById("fab");
  if (fab) {
    fab.onclick = () => {
      alert("Открыть форму подачи объявления");
    };
  }

  /* ============================
        ПОИСК ПО КАРТОЧКАМ
  ============================ */
  const searchInput = document.getElementById("search");
  const cards = document.querySelectorAll(".card");

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      const q = searchInput.value.toLowerCase();
      cards.forEach(card => {
        const title = card.querySelector(".title").textContent.toLowerCase();
        card.style.display = title.includes(q) ? "" : "none";
      });
    });
  }

  /* ============================
        ФИЛЬТР
  ============================ */
  const filterBtn = document.getElementById("filterBtn");
  if (filterBtn) {
    filterBtn.onclick = () => {
      alert("Открыть меню фильтрации");
    };
  }


  /* ==================================================
          🔥 НИЖНЕЕ МЕНЮ — АКТИВАЦИЯ КНОПОК
  =================================================== */
  document.querySelectorAll(".nav-item").forEach(item => {
    item.addEventListener("click", () => {

      // убрать active у всех
      document.querySelectorAll(".nav-item")
        .forEach(n => n.classList.remove("active"));

      // включить активный
      item.classList.add("active");
    });
  });

});
