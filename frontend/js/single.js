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

        // Create elements for title and description
        const h1 = document.createElement('h1');
        h1.textContent = title;

        const pDateDescription = document.createElement('p');
        pDateDescription.innerHTML = `${date} - ${description}`;

        // Add initial content to the body based on enclosure presence
        if (enclosure) {
            const imageContainer = document.createElement('div');
            imageContainer.style.position = 'relative';
            imageContainer.style.width = '100%';
            imageContainer.style.minHeight = '400px';
            imageContainer.style.overflow = 'hidden';

            const placeholderImg = document.createElement('img');
            placeholderImg.src = '/static/images/post.jpg';
            placeholderImg.alt = 'Загрузка изображения...';
            placeholderImg.id = 'news-placeholder-image';
            placeholderImg.style.width = '100%';
            placeholderImg.style.height = '100%';
            placeholderImg.style.objectFit = 'cover';
            placeholderImg.style.display = 'block';
            placeholderImg.style.backgroundColor = '#f0f0f0';

            imageContainer.appendChild(placeholderImg);
            body.appendChild(imageContainer);
        }
        body.appendChild(h1);
        body.appendChild(pDateDescription);

        const hr = document.createElement('hr');
        body.appendChild(hr);

        // --- Content that loads independently of the image ---
        const text = document.createElement('p');
        text.innerHTML = fullText;
        body.appendChild(text);

        const h2Sources = document.createElement('h2');
        h2Sources.textContent = 'Источники:';
        body.appendChild(h2Sources);

        const ul = document.createElement('ul');
        sources.forEach(source => {
            const li = document.createElement('li');
            li.classList.add('source-li')
            const a = document.createElement('a');
            a.href = source.link;
            a.text = source.name + " : " + source.title;
            a.target = '_blank';
            li.appendChild(a);
            ul.appendChild(li);
        });
        body.appendChild(ul);

        // --- Handle image loading asynchronously, without blocking text ---
        if (enclosure) {
            const minDisplayTime = 500;
            const startTime = Date.now();

            const enc = document.createElement('img');
            enc.src = enclosure;
            enc.alt = title;
            enc.style.width = '100%';
            enc.style.height = '100%';
            enc.style.objectFit = 'cover';
            enc.style.display = 'block';

            const imageLoadPromise = new Promise((resolve) => {
                enc.onload = () => {
                    resolve();
                };
                enc.onerror = () => {
                    console.error('Не удалось загрузить фактическое изображение:', enclosure);
                    const currentPlaceholder = document.getElementById('news-placeholder-image');
                    if (currentPlaceholder) {
                        currentPlaceholder.remove();
                    }
                    resolve();
                };
                if (enc.complete && enc.naturalHeight !== 0) {
                    resolve();
                }
            });

            // Wait for image to load AND min display time, then replace placeholder
            Promise.all([
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
            ]).then(() => {
                if (enc.complete && enc.naturalHeight !== 0) {
                    const currentPlaceholder = document.getElementById('news-placeholder-image');
                    if (currentPlaceholder) {
                        currentPlaceholder.replaceWith(enc);
                    }
                } else {
                    const currentPlaceholder = document.getElementById('news-placeholder-image');
                    if (currentPlaceholder) {
                        currentPlaceholder.remove();
                    }
                }
            });
        }

        await loadSimilar(id);
        await loadAllNews();

    } catch (error) {
        console.error(error);
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
                day: '2-digit',
                month: 'short',
                hour12: false
            }).replace(', ', ' / ').replace(/\.\d{4}/, '');
            date.classList.add('news-similar-date');


            const sourceDiv = document.createElement('div');
            sourceDiv.classList.add('news-similar-source');
            sourceDiv.appendChild(date);


            div.appendChild(sourceDiv);
            title.classList.add('news-similar-title');
            div.appendChild(title);

            const description = document.createElement('p');
            if (news.description){
                const desc = news.description;
                if(desc.length > 150){
                    description.innerHTML = desc.substring(0, 150) + "...";
                } else {
                    description.innerHTML = desc;
                }
                description.classList.add('news-similar-description');
                div.appendChild(description);
            }

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


async function loadAllNews(){
    const bodyAll = document.getElementById('all-news');
    let allUrl = ''
    const limit = 20
    allUrl = `http://localhost:9999/api/v1/get/all?limit=${limit}`

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