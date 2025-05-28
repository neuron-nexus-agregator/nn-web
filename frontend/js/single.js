const body = document.getElementById('news');

function getNewsId() {
    const path = window.location.pathname;
    const match = path.match(/\/news\/(\d+)/);
    return match ? match[1] : null;
}

document.addEventListener('DOMContentLoaded', async () => {
    const newsId = getNewsId();
    if (newsId) {
        await load(newsId);
    } else {
        console.log('ID не найден');
    }
});

async function load(id) {
    const url = `http://localhost:9999/api/v1/get/${id}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }
        const data = await response.json();

        const title = data.title;
        const description = data.description;
        const date = new Date(data.date).toLocaleString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit',
            hour12: false
        }).replace(', ', ' / ').replace(/\.\d{4}/, '');
        const fullText = data.rewrite;
        const enclosure = data.enclosure;
        const sources = data.sources;

        // Создаем элементы для заголовка и описания, но пока не добавляем их в DOM
        const h1 = document.createElement('h1');
        h1.textContent = title;

        const pDateDescription = document.createElement('p');
        pDateDescription.textContent = `${date} - ${description}`;

        if (enclosure) {
            // Если изображение существует, создаем контейнер для изображения и текста
            const imageContainer = document.createElement('div');
            imageContainer.style.position = 'relative';
            imageContainer.style.width = '100vw'; // Занимает всю ширину видимой области
            imageContainer.style.marginLeft = 'calc(-50vw + 50%)'; // Центрирует контейнер по ширине экрана
            imageContainer.style.minHeight = '250px'; // Зарезервированная высота
            imageContainer.style.overflow = 'hidden';
            imageContainer.style.marginBottom = '20px'; // Добавляем отступ снизу

            // Создаем изображение-заглушку
            const placeholderImg = document.createElement('img');
            placeholderImg.src = '/static/images/post.jpg';
            placeholderImg.alt = 'Загрузка изображения...';
            placeholderImg.id = 'news-placeholder-image';
            placeholderImg.style.width = '100%';
            placeholderImg.style.height = '100%'; // Изображение заполняет контейнер
            placeholderImg.style.objectFit = 'cover';
            placeholderImg.style.display = 'block';
            placeholderImg.style.backgroundColor = '#f0f0f0'; // Фон для заглушки
            placeholderImg.style.borderRadius = '5%'; // Возвращаем скругление краев в 5%

            imageContainer.appendChild(placeholderImg);

            // Создаем градиентную накладку
            const gradientOverlay = document.createElement('div');
            gradientOverlay.style.position = 'absolute';
            gradientOverlay.style.bottom = '0';
            gradientOverlay.style.left = '0';
            gradientOverlay.style.width = '100%';
            gradientOverlay.style.height = '50%'; // Градиент начинается с середины изображения
            // Изменена непрозрачность белого цвета: 100% внизу (0%) и 90% на 70% высоты градиента для более сильного эффекта
            gradientOverlay.style.background = 'linear-gradient(to top, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0.9) 70%, rgba(255, 255, 255, 0) 100%)';
            gradientOverlay.style.pointerEvents = 'none'; // Позволяет кликам проходить сквозь градиент
            imageContainer.appendChild(gradientOverlay);

            // Создаем контейнер для текста, накладываемого на изображение
            const textOverlay = document.createElement('div');
            textOverlay.style.position = 'absolute';
            textOverlay.style.bottom = '15%'; // Подняли текст выше
            textOverlay.style.left = '0';
            textOverlay.style.width = '100%';
            textOverlay.style.padding = '20px';
            textOverlay.style.boxSizing = 'border-box';
            textOverlay.style.color = 'black'; // Цвет текста
            textOverlay.style.zIndex = '1'; // Убедимся, что текст находится над градиентом
            // Возвращаем тень к предыдущему значению
            textOverlay.style.textShadow = '0px 0px 5px rgba(255,255,255,0.7)'; 

            h1.style.margin = '0'; // Убираем стандартные отступы
            h1.style.color = 'black'; // Убедимся, что цвет текста черный
            textOverlay.appendChild(h1);

            pDateDescription.style.margin = '0'; // Убираем стандартные отступы
            pDateDescription.style.marginTop = '5px'; // Небольшой отступ от заголовка
            pDateDescription.style.color = 'black'; // Убедимся, что цвет текста черный
            textOverlay.appendChild(pDateDescription);

            imageContainer.appendChild(textOverlay);
            body.appendChild(imageContainer); // Добавляем весь контейнер в body

            const minDisplayTime = 500; // Минимальное время отображения заглушки
            const startTime = Date.now();

            const enc = document.createElement('img');
            enc.src = enclosure;
            enc.alt = title;
            // Применяем те же стили для фактического изображения
            enc.style.width = '100%';
            enc.style.height = '100%';
            enc.style.objectFit = 'cover';
            enc.style.display = 'block';
            enc.style.borderRadius = '5%'; // Возвращаем скругление краев в 5%

            // Создаем промис, который разрешится, когда изображение загрузится или произойдет ошибка
            const imageLoadPromise = new Promise((resolve) => {
                enc.onload = () => {
                    resolve();
                };
                enc.onerror = () => {
                    console.error('Не удалось загрузить фактическое изображение:', enclosure);
                    // Если фактическое изображение не загрузилось, удаляем заглушку
                    const currentPlaceholder = document.getElementById('news-placeholder-image');
                    if (currentPlaceholder) {
                        currentPlaceholder.remove();
                    }
                    resolve(); // Разрешаем промис, чтобы продолжить с другим контентом
                };
                // Если изображение уже кэшировано, событие onload может не сработать, поэтому проверяем свойство complete
                if (enc.complete && enc.naturalHeight !== 0) {
                    resolve();
                }
            });

            // Ждем завершения загрузки изображения И минимального времени отображения заглушки
            await Promise.all([
                imageLoadPromise,
                new Promise(resolve => {
                    const elapsedTime = Date.now() - startTime;
                    const remainingTime = minDisplayTime - elapsedTime;
                    if (remainingTime > 0) {
                        setTimeout(resolve, remainingTime);
                    } else {
                        resolve();
                    }
                })
            ]);

            // Теперь заменяем заглушку фактическим изображением, если оно успешно загрузилось
            if (enc.complete && enc.naturalHeight !== 0) {
                const currentPlaceholder = document.getElementById('news-placeholder-image');
                if (currentPlaceholder) {
                    currentPlaceholder.replaceWith(enc); // Заменяем заглушку фактическим изображением
                }
            } else {
                // Если изображение не загрузилось, убедимся, что заглушка удалена
                const currentPlaceholder = document.getElementById('news-placeholder-image');
                if (currentPlaceholder) {
                    currentPlaceholder.remove();
                }
            }

        } else {
            // Если enclosure отсутствует, добавляем заголовок и описание как обычный текст
            body.appendChild(h1);
            body.appendChild(pDateDescription);
        }

        // --- Контент, который загружается независимо от наличия изображения ---
        const text = document.createElement('p');
        text.innerHTML = fullText;
        body.appendChild(text);

        const h2 = document.createElement('h2');
        h2.textContent = 'Источники:';
        body.appendChild(h2);

        const ul = document.createElement('ul');
        sources.forEach(source => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = source.link;
            a.text = source.name + " : " + source.title;
            a.target = '_blank';
            li.appendChild(a);
            ul.appendChild(li);
        });
        body.appendChild(ul);

        await loadSimilar(id);

    } catch (error) {
        console.error(error);
        // В случае любой ошибки во время загрузки или обработки, убедимся, что заглушка удалена, если она была добавлена
        const currentPlaceholder = document.getElementById('news-placeholder-image');
        if (currentPlaceholder) {
            currentPlaceholder.remove();
        }
    }
}

async function loadSimilar(id) {
    try {
        const h2 = document.createElement('h2');
        h2.textContent = 'Похожие новости:';
        body.appendChild(h2);

        const url = `http://localhost:9999/api/v1/get/similar/${id}`;
        const response = await fetch(url);
        const data = await response.json();
        const items = data.items;
        items.forEach(news => {
            const div = document.createElement('div');
            div.classList.add('news-similar');

            const title = document.createElement('h3');
            title.textContent = news.title;

            const date = document.createElement('p');
            date.textContent = new Date(news.date).toLocaleString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            }).replace(', ', ' / ').replace(/\.\d{4}/, '');
            date.classList.add('news-similar-date');

            const sourceName = document.createElement('p');
            sourceName.textContent = news.sourceName;
            sourceName.classList.add('news-similar-source-name');


            const sourceDiv = document.createElement('div');
            sourceDiv.classList.add('news-similar-source');
            sourceDiv.appendChild(date);
            sourceDiv.appendChild(sourceName);

            const description = document.createElement('p');
            description.textContent = news.description;

            div.appendChild(sourceDiv);
            title.classList.add('news-similar-title');
            div.appendChild(title);
            description.classList.add('news-similar-description');
            div.appendChild(description);
            const a = document.createElement('a');
            a.href = `/news/${news.id}`;
            a.appendChild(div);
            a.classList.add('news-link');
            body.appendChild(a);
        });

    } catch (error) {
        console.error(error);
    }
}
