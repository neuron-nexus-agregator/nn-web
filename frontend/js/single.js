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

        // Логика для обработки изображения и заглушки
        if (enclosure) {
            // Если изображение существует, сначала показываем заглушку
            const placeholderImg = document.createElement('img');
            placeholderImg.src = '/static/images/post.jpg';
            placeholderImg.alt = 'Загрузка изображения...';
            placeholderImg.id = 'news-placeholder-image';

            // Применяем стили для заглушки, чтобы предотвратить скачки макета
            placeholderImg.style.minHeight = '250px'; // Можно настроить это значение
            placeholderImg.style.backgroundColor = '#f0f0f0'; // Фон для заглушки
            placeholderImg.style.display = 'block';
            placeholderImg.style.objectFit = 'cover';
            placeholderImg.style.width = '100%';
            placeholderImg.style.borderRadius = '15px';

            body.appendChild(placeholderImg); // Добавляем заглушку сразу после того, как стало известно, что есть изображение

            const minDisplayTime = 500; // Минимальное время отображения заглушки (500 миллисекунд)
            const startTime = Date.now();

            const enc = document.createElement('img');
            enc.src = enclosure;
            enc.alt = title;
            // Применяем те же стили для фактического изображения
            enc.style.minHeight = '250px';
            enc.style.display = 'block';
            enc.style.objectFit = 'cover';
            enc.style.width = '100%';
            enc.style.borderRadius = '15px';

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
            if (enc.complete && enc.naturalHeight !== 0) { // Проверяем, успешно ли загрузилось фактическое изображение
                const currentPlaceholder = document.getElementById('news-placeholder-image');
                if (currentPlaceholder) {
                    currentPlaceholder.replaceWith(enc); // Заменяем заглушку фактическим изображением
                } else {
                    // Если заглушка была каким-то образом удалена, просто добавляем изображение в начало
                    body.prepend(enc);
                }
            } else {
                // Если изображение не загрузилось, убедимся, что заглушка удалена
                const currentPlaceholder = document.getElementById('news-placeholder-image');
                if (currentPlaceholder) {
                    currentPlaceholder.remove();
                }
            }

        } else {
            // Если enclosure отсутствует, заглушка не добавляется и никаких действий с изображениями не происходит.
            // Убедимся, что любая случайная заглушка от предыдущих попыток удалена (хотя с этой логикой ее быть не должно)
            const currentPlaceholder = document.getElementById('news-placeholder-image');
            if (currentPlaceholder) {
                currentPlaceholder.remove();
            }
        }

        // Остальная часть добавления контента остается прежней
        const h1 = document.createElement('h1');
        h1.textContent = title;
        body.appendChild(h1);

        const hr = document.createElement('hr');
        body.appendChild(hr);

        const p = document.createElement('p');
        p.textContent = `${date} - ${description}`;
        body.appendChild(p);

        const hr2 = document.createElement('hr');
        body.appendChild(hr2);

        const text = document.createElement('p');
        text.innerHTML = fullText;
        body.appendChild(text);

        const hr3 = document.createElement('hr');
        body.appendChild(hr3);

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
