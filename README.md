# TaskFlow - Контейнеризиран Kanban Борд за Задачи (Разделен Frontend & Backend)

TaskFlow е модерен и интерактивен Kanban борд, разделен на самостоятелни слоеве за презентация (**Frontend**) и бизнес логика (**Backend**), работещ в отделни Docker контейнери и координиран чрез **Docker Compose**.

---

## 1. Структура на Проекта

Проектът има трикомпонентна структура:

```text
docker-assignment/
├── compose.yml              # Конфигурира трите услуги (frontend, backend, db)
├── README.md                # Документация на проекта (този файл)
├── frontend/                # Презентационен слой (Статични файлове)
│   ├── Dockerfile           # Инструкции за изграждане на Nginx уеб сървър
│   ├── index.html           # Статичен HTML5 интерфейс на приложението
│   ├── style.css            # Модерен Glassmorphism дизайн с тъмна тема
│   └── app.js               # Клиентска интерактивност (Drag and Drop, AJAX заявки към API)
└── backend/                 # Слой с бизнес логика (REST API)
    ├── Dockerfile           # Инструкции за изграждане на PHP + Apache образа
    ├── db.php               # Инициализация на връзката с базата (PDO) и миграция
    └── index.php            # CORS-enabled REST API за обработка на заявките
```

---

## 2. Как Работи Всеки от Компонентите

### А. Frontend (`frontend` услуга)
- **Технология**: `nginx:alpine`
- **Описание**: Контейнерът стартира лек Nginx сървър на порт `8080`, който обслужва статичните ресурси (HTML, CSS, JS) към браузъра на потребителя.
- **Интерактивност**: Всички данни се зареждат и обновяват динамично през JavaScript Fetch API, без необходимост от презареждане на уеб страницата. Поддържа се Drag & Drop промяна на статусите.

### Б. Backend (`backend` услуга)
- **Технология**: `php:8.2-apache`
- **Описание**: Функционира като чист REST API сървър, работещ на порт `8000`. Получава заявки от браузъра, комуникира с базата данни и връща резултати под формата на JSON обекти.
- **Dockerfile**: Инсталира разширението `pdo_mysql` и активира `mod_rewrite` за Apache.

### В. База Данни (`db` услуга)
- **Технология**: `mysql:8.0`
- **Описание**: MySQL сървър, който съхранява задачите персистентно в Docker volume `mysql_data`.
- **Автоматична миграция**: При стартиране `backend/db.php` автоматично проверява за съществуване на таблицата `tasks` и я попълва с примерни данни, ако е празна.

---

## 3. Комуникация Между Услугите и CORS Решение

1. **Docker Мрежа**: Всички услуги работят в споделена изолирана мрежа `app-network` от тип `bridge`.
2. **Връзка към Базата**: Backend сървърът се свързва към MySQL чрез DNS името на хоста `db`. С помощта на `healthcheck` и `depends_on` в `compose.yml`, backend изчаква пълното стартиране и здраве на MySQL.
3. **CORS Решение (Cross-Origin Resource Sharing)**:
   Тъй като Frontend се зарежда в браузъра от порт `8080`, а заявките се изпращат към Backend на порт `8000`, съвременните браузъри биха блокирали заявките по подразбиране. 
   В [backend/index.php](file:///c:/Users/mikov/OneDrive/Desktop/docker-assignment/backend/index.php) са конфигурирани нужните CORS хедъри и обработка на OPTIONS (preflight) заявките:
   ```php
   header("Access-Control-Allow-Origin: *");
   header("Access-Control-Allow-Headers: X-Requested-With, Content-Type, Accept, Origin, Authorization");
   header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
   ```

---

## 4. Локално Стартиране и Тестване

1. Уверете се, че **Docker Desktop** е стартиран на компютъра ви.
2. Отворете терминал в коренната папка на проекта (`docker-assignment`).
3. Стартирайте контейнерите:
   ```bash
   docker compose up -d --build
   ```
4. Отворете браузъра си на адрес:
   **[http://localhost:8080](http://localhost:8080)** (зарежда статичния Kanban интерфейс)
5. Приложението автоматично ще се свърже с бекенда на `http://localhost:8000`, за да извлече и управлява задачите.
6. За да спрете проекта, изпълнете:
   ```bash
   docker compose down
   ```

---

## 5. Публикуване на Docker Образите в Docker Hub

Трябва да качите два отделни образа в личния си Docker Hub профил. Заменете `<твоят_dockerhub_потребител>` с вашето потребителско име:

1. **Влезте в своя профил** през терминала:
   ```bash
   docker login
   ```

2. **Frontend Образ** (изграждане, тагване и изтласкване):
   ```bash
   docker build -t <твоят_dockerhub_потребител>/taskflow-frontend:latest ./frontend
   ```
   ```bash
   docker push <твоят_dockerhub_потребител>/taskflow-frontend:latest
   ```

3. **Backend Образ** (изграждане, тагване и изтласкване):
   ```bash
   docker build -t <твоят_dockerhub_потребител>/taskflow-backend:latest ./backend
   ```
   ```bash
   docker push <твоят_dockerhub_потребител>/taskflow-backend:latest
   ```

4. **Обновете `compose.yml`**:
   Сменете имената на образите под ключовете `image:` за `frontend` и `backend` съответно във вашия `compose.yml` файл.

---
