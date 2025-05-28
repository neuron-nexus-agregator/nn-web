const body = document.getElementById('container-top');
const bodyAll = document.getElementById('container-all');

function getDynamicUrl(limit) {
    const baseUrl = 'http://localhost:9999/api/v1/get/';
    const queryLimit = `limit=${limit}`;
    let endpoint = 'top'; // Значение по умолчанию

    // Проверяем текущий путь
    const currentPath = window.location.pathname;
    if (currentPath === '/reg') {
        endpoint = 'reg';
    }

    // Формируем итоговый URL
    return `${baseUrl}${endpoint}?${queryLimit}`;
}

document.addEventListener('DOMContentLoaded', async function() {
    const url = getDynamicUrl(30);
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const json = await response.json();
        await updateNews(json);
        await loadAllNews();
        console.log(json);
    } catch (err) {
        console.error('Fetch error:', err);
    }
});

async function updateNews(json) {
    const n = 3
    for (let i = 0; i < json.items.length - json.items.length % n; i++) {
        const newItem = document.createElement('div');
        newItem.className = 'news-item';

        const image = document.createElement('img');
        image.src = json.items[i].enclosure || '/static/images/post.jpg'; // Заглушка по умолчанию
        image.alt = json.items[i].title || 'News image';
        image.loading = 'lazy';
        image.width = 300; // Фиксированная ширина
        image.height = 200; // Фиксированная высота
        image.onerror = () => {
            image.src = '/static/images/post.jpg'; // Заглушка при ошибке загрузки
        };

        const imageDiv = document.createElement('div');
        imageDiv.className = 'image-div';
        imageDiv.appendChild(image);
        newItem.appendChild(imageDiv);

        const titleDiv = document.createElement('div');
        titleDiv.className = 'title-div';

        const date = document.createElement('p');
        date.textContent = new Date(json.items[i].date).toLocaleString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit',
            hour12: false
        }).replace(', ', ' / ').replace(/\.\d{4}/, '');

        const title = document.createElement('h2');
        title.textContent = json.items[i].title;

        titleDiv.appendChild(date);
        titleDiv.appendChild(title);
        newItem.appendChild(titleDiv);

        if (json.items[i].description && json.items[i].description.length > 3) {
            const description = document.createElement('p');
            const desc = decodeHtmlEntities(json.items[i].description).slice(0, 100) + '...';
            description.textContent = desc;
            description.innerHTML = desc; // Используем textContent для безопасности

            const descriptionDiv = document.createElement('div');
            descriptionDiv.className = 'description-div';
            descriptionDiv.appendChild(description);
            newItem.appendChild(descriptionDiv);
        }

        const newsLink = document.createElement('a')
        newsLink.className = 'news-link'
        newsLink.href = `/news/${json.items[i].id}`
        newsLink.appendChild(newItem)
        body.appendChild(newsLink)
    }
}

async function loadAllNews(){

    let allUrl = ''
    const limit = 65
    const currentPath = window.location.pathname;
    if (currentPath === '/reg') {
        allUrl = `http://localhost:9999/api/v1/get/reg?limit=${limit}&rt=false`;
    } else {
        allUrl = `http://localhost:9999/api/v1/get/all?limit=${limit}`
    }

    try{
    const response = await fetch(allUrl);
    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const json = await response.json();
    for (let i = 0; i < json.items.length; i++) {
        const dateDiv = document.createElement('div');
        dateDiv.className = 'date-div';
        const date = document.createElement('p');
        date.textContent = new Date(json.items[i].date).toLocaleString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit',
        });
        dateDiv.appendChild(date);

        const titleDiv = document.createElement('div');
        titleDiv.className = 'title-div';
        const title = document.createElement('p');
        title.textContent = json.items[i].title;
        titleDiv.appendChild(title);

        const lineNewsDiv = document.createElement('div');
        lineNewsDiv.className = 'line-news-div';
        lineNewsDiv.appendChild(dateDiv);
        lineNewsDiv.appendChild(titleDiv);

        if (json.items[i].isRT) {
            lineNewsDiv.classList.add('line-news-div-rt');
        }

        const newsLink = document.createElement('a')
        newsLink.className = 'news-link'
        newsLink.href = `/news/${json.items[i].id}`
        newsLink.appendChild(lineNewsDiv)
        bodyAll.appendChild(newsLink)
    }
    } catch (err) {
        console.error('Fetch error:', err);
    }
}

function decodeHtmlEntities(str) {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = str;
    return textarea.value;
}