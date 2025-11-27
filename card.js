document.addEventListener("DOMContentLoaded", () => {

  // ===== Firebase =====
  const firebaseConfig = {
    apiKey: "AIzaSyD4G8qEj4o6ZGGdZMkmqrcFjsKeexAPPlE",
    authDomain: "toktogul-b4bc8.firebaseapp.com",
    projectId: "toktogul-b4bc8",
    storageBucket: "toktogul-b4bc8.firebasestorage.app",
    messagingSenderId: "994223338100",
    appId: "1:994223338100:web:41f38224398bd4d21e5721",
    measurementId: "G-EGSEE12JPM"
  };
  firebase.initializeApp(firebaseConfig);

  const db = firebase.firestore();

  // ===== Включаем offline persistence =====
  firebase.firestore().enablePersistence()
    .catch(err => console.log("Ошибка offline persistence:", err));

  // ===== Элементы =====
  const cardsContainer = document.getElementById("cards");
  const createAdBtn = document.getElementById("createAd");
  const categorySelect = document.getElementById("category");
  const desc = document.getElementById("desc");
  const counter = document.getElementById("counter");
  const favoriteMenu = document.querySelector('[data-type="favorite"]');
  const homeMenu = document.querySelector('[data-type="home"]');
  const searchInput = document.getElementById("searchInput");
  const chatMenu = document.querySelector('[data-type="chat"]');
  const loadingEl = document.getElementById("loading"); // спиннер

  const categoryLabels = {
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

  let allAds = JSON.parse(localStorage.getItem("allAds") || "[]");
  let favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
  let uniqueViews = JSON.parse(localStorage.getItem("uniqueViews") || "{}");

  function saveAllAds() { localStorage.setItem("allAds", JSON.stringify(allAds)); }
  function saveFavorites() { localStorage.setItem("favorites", JSON.stringify(favorites)); }
  function saveUniqueViews() { localStorage.setItem("uniqueViews", JSON.stringify(uniqueViews)); }

  // ===== Счётчик описания =====
  if (desc && counter) {
    desc.addEventListener("input", () => {
      counter.textContent = desc.value.length + "/6000";
    });
  }

// ===== Загрузка объявлений через onSnapshot =====
function loadAllAdsRealtime() {
  if (loadingEl) loadingEl.style.display = "block";

  db.collection("ads").orderBy("timestamp", "desc")
    .onSnapshot(snapshot => {
      allAds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      renderMasonry(allAds, 2);
      if (loadingEl) loadingEl.style.display = "none";
    }, error => {
      console.error("Ошибка при загрузке объявлений:", error);
      alert("Ошибка при загрузке объявлений. Попробуйте обновить страницу.\n" + error.message);
      if (cardsContainer) cardsContainer.innerHTML = "<p style='text-align:center; color:red;'>Ошибка загрузки объявлений</p>";
      if (loadingEl) loadingEl.style.display = "none";
    });
}

// ===== Вызываем realtime загрузку =====
loadAllAdsRealtime();

  // ===== Добавление объявления =====
  createAdBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    const phoneInput = document.getElementById("phone").value.trim();
    const phone = phoneInput.startsWith("0") ? "996" + phoneInput.slice(1) : phoneInput;
    const category = categorySelect.value;
    const descText = desc.value.trim();
    const price = document.getElementById("price").value.trim();
    const allImgs = Array.from(document.querySelectorAll("#selectedGrid .slot img.gal"))
      .map(img => img.src)
      .filter(src => src && !src.includes("Canvas.svg"));

    if (!phone || !category || !descText || allImgs.length === 0) {
      alert("Заполните все поля и добавьте хотя бы одно фото.");
      return;
    }

    const newAdData = {
      images: allImgs,
      firstImg: allImgs[0],
      categoryName: categoryLabels[category] || "Категория",
      descText,
      price,
      phone,
      views: 0,
      likes: 0,
      timestamp: Date.now()
    };

    // --- Показ локально сразу ---
    const tempId = "temp-" + Date.now();
    allAds.unshift({ id: tempId, ...newAdData });
    renderMasonry(allAds, 2);
    saveAllAds();

    try {
      const docRef = await db.collection("ads").add(newAdData);
      // заменяем tempId на реальный id
      const index = allAds.findIndex(ad => ad.id === tempId);
      if (index !== -1) allAds[index].id = docRef.id;
      saveAllAds();
      renderMasonry(allAds, 2);

      // Очистка формы
      document.getElementById("phone").value = "";
      categorySelect.value = "";
      document.getElementById("price").value = "";
      desc.value = "";
      counter.textContent = "0/6000";
      document.querySelectorAll("#selectedGrid img.gal").forEach(img => img.src = "./img/Canvas.svg");
    } catch (error) {
      console.error("Ошибка при добавлении объявления:", error);
      alert("Ошибка при сохранении объявления. Попробуйте снова.");
    }
  });

  // ===== Masonry layout =====
  function renderMasonry(cardsData, columnsCount = 2) {
    if (!cardsContainer) return;
    let columns = Array.from(cardsContainer.querySelectorAll(".column"));
    if (columns.length !== columnsCount) {
      cardsContainer.innerHTML = "";
      columns = [];
      for (let i = 0; i < columnsCount; i++) {
        const col = document.createElement("div");
        col.classList.add("column");
        col.style.flex = "1";
        col.style.display = "flex";
        col.style.flexDirection = "column";
        col.style.gap = "10px";
        columns.push(col);
        cardsContainer.appendChild(col);
      }
    } else {
      columns.forEach(col => col.innerHTML = "");
    }

    cardsData.forEach((data, index) => {
      const card = createCard(data);
      columns[index % columnsCount].appendChild(card);
    });
  }

  // ===== Уникальные просмотры =====
  function incrementViewCount(cardId, viewCountElement) {
    if (!uniqueViews[cardId]) {
      const adIndex = allAds.findIndex(ad => ad.id === cardId);
      if (adIndex !== -1) {
        allAds[adIndex].views++;
        viewCountElement.textContent = allAds[adIndex].views;
        uniqueViews[cardId] = true;
        saveUniqueViews();
        saveAllAds();
      }
    }
  }

  // ===== Галерея =====
  function openGallery(images, card, cardId) {
    const galleryModal = document.getElementById("galleryModal");
    const galleryTrack = document.getElementById("galleryTrack");
    const viewCountElement = card.querySelector(".view-count");

    incrementViewCount(cardId, viewCountElement);

    galleryTrack.innerHTML = images.map(src => `<div class="gallery-slide"><img src="${src}" /></div>`).join("");
    galleryModal.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  document.getElementById("closeGallery").addEventListener("click", () => {
    document.getElementById("galleryModal").classList.remove("open");
    document.body.style.overflow = "";
  });

  // ===== Создание карточки =====
  function createCard(data) {
    data.views = data.views || 0;
    data.likes = data.likes || 0;

    const displayPhone = data.phone.startsWith("996") ? "0" + data.phone.slice(3) : data.phone;
    const waNumber = data.phone.startsWith("0") ? "996" + data.phone.slice(1) : data.phone;

    const card = document.createElement("article");
    card.classList.add("card");
    card.dataset.images = JSON.stringify(data.images);
    card.dataset.favoriteId = data.id;

    const isFavoriteNow = favorites.some(item => item.id === data.id);
    data.isFavorite = isFavoriteNow;

    card.innerHTML = `
   <div class="img">
      <img src="${data.firstImg}" class="card-img"/>
    </div>
    <div class="body">
      <div class="price">${data.price ? data.price + " сом" : "Договорная"}</div>
      <div class="sub">${data.categoryName}</div>
      <div class="title">${data.descText || "Без описания"}</div>
 <div class="phone">
        ${displayPhone ? `
          <a href="tel:${displayPhone}" class="phone-link">${displayPhone}</a>
          <a href="https://wa.me/${waNumber}" target="_blank" class="icon-btn whatsapp">
      <svg class="what" viewBox="0 0 20 20" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title>whatsapp [#128]</title> <desc>Created with Sketch.</desc> <defs> </defs> <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g id="Dribbble-Light-Preview" transform="translate(-300.000000, -7599.000000)" > <g id="icons" transform="translate(56.000000, 160.000000)"> 
						<path d="M259.821,7453.12124 C259.58,7453.80344 258.622,7454.36761 257.858,7454.53266 C257.335,7454.64369 256.653,7454.73172 254.355,7453.77943 C251.774,7452.71011 248.19,7448.90097 248.19,7446.36621 C248.19,7445.07582 248.934,7443.57337 250.235,7443.57337 C250.861,7443.57337 250.999,7443.58538 251.205,7444.07952 C251.446,7444.6617 252.034,7446.09613 252.104,7446.24317 C252.393,7446.84635 251.81,7447.19946 251.387,7447.72462 C251.252,7447.88266 251.099,7448.05372 251.27,7448.3478 C251.44,7448.63589 252.028,7449.59418 252.892,7450.36341 C254.008,7451.35771 254.913,7451.6748 255.237,7451.80984 C255.478,7451.90987 255.766,7451.88687 255.942,7451.69881 C256.165,7451.45774 256.442,7451.05762 256.724,7450.6635 C256.923,7450.38141 257.176,7450.3464 257.441,7450.44643 C257.62,7450.50845 259.895,7451.56477 259.991,7451.73382 C260.062,7451.85686 260.062,7452.43903 259.821,7453.12124 M254.002,7439 L253.997,7439 L253.997,7439 C248.484,7439 244,7443.48535 244,7449 C244,7451.18666 244.705,7453.21526 245.904,7454.86076 L244.658,7458.57687 L248.501,7457.3485 C250.082,7458.39482 251.969,7459 254.002,7459 C259.515,7459 264,7454.51465 264,7449 C264,7443.48535 259.515,7439 254.002,7439" id="whatsapp-[#128]"> </path> </g> </g> </g> </g>
						</svg>
    </a>
  ` : "Номер не указан"}
</div>
      <div class="actions">
        <div class="left-actions">
  <svg class="view" viewBox="0 0 24 24">
            <path d="M12 5C7 5 2.73 8.11 1 12c1.73 3.89 6 7 11 7s9.27-3.11 11-7c-1.73-3.89-6-7-11-7zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10z"/>
            <circle cx="12" cy="12" r="2"/>
          </svg>
          <span class="view-count">${data.views}</span>
        </div>
        <div class="right-actions">
          <button class="icon-btn heart ${data.isFavorite ? 'active' : ''}">
           <svg class="like" viewBox="0 0 24 24" fill="none">
              <path d="M2 9.1371C2 14 6.01943 16.5914 8.96173 18.9109C10 19.7294 11 20.5 12 20.5C13 20.5 14 19.7294 15.0383 18.9109C17.9806 16.5914 22 14 22 9.1371C22 4.27416 16.4998 0.825464 12 5.50063C7.50016 0.825464 2 4.27416 2 9.1371Z"></path>
            </svg>
          </button>
          <span class="like-count">${data.likes}</span>
        </div>
      </div>
    </div>
    `;

     // Галерея
    card.querySelector(".card-img").addEventListener("click", () => openGallery(data.images, card, data.id));

    // Лайки
    card.querySelector(".heart").addEventListener("click", () => {
      const btn = card.querySelector(".heart");
      const likeCountElement = card.querySelector(".like-count");
      const adIndex = allAds.findIndex(ad => ad.id === data.id);
      if (adIndex !== -1) {
        const currentAd = allAds[adIndex];
        if (btn.classList.contains("active")) {
          btn.classList.remove("active");
          currentAd.likes = Math.max(0, currentAd.likes - 1);
          favorites = favorites.filter(item => item.id !== data.id);
        } else {
          btn.classList.add("active");
          currentAd.likes++;
          if (!favorites.find(item => item.id === data.id)) favorites.push({ ...currentAd, isFavorite: true });
        }
        likeCountElement.textContent = currentAd.likes;
        saveFavorites();
        saveAllAds();
      }
    });

    return card;
  }

  // ===== Поиск =====
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      const q = searchInput.value.toLowerCase();
      cardsContainer.querySelectorAll(".card").forEach(card => {
        const title = card.querySelector(".title")?.textContent.toLowerCase() || "";
        const category = card.querySelector(".sub")?.textContent.toLowerCase() || "";
        card.style.display = (title.includes(q) || category.includes(q)) ? "" : "none";
      });
    });
  }

  // ===== Меню =====
  if (favoriteMenu) favoriteMenu.addEventListener("click", () => renderMasonry(favorites, 2));
  if (homeMenu) homeMenu.addEventListener("click", () => renderMasonry(allAds, 2));

  document.querySelectorAll(".nav-item").forEach(item => {
    item.addEventListener("click", () => {
      document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
      item.classList.add("active");
    });
  });

  // ===== WhatsApp =====
  if (chatMenu) {
    chatMenu.addEventListener("click", () => {
      const whatsappNumber = "996220604604"; 
      window.open(`https://wa.me/${whatsappNumber}`, "_blank");
    });
  }

  // ===== Экспорт =====
  window.renderAds = renderMasonry;
  window.allAds = allAds;
  window.favorites = favorites;

});