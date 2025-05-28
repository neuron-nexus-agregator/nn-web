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
    const url = `http://localhost:9999/api/v1/get/${id}`
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
        const enclosure = data.enclosure
        const sources = data.sources;
        if(enclosure){
            const enc = document.createElement('img');
            enc.src = enclosure;
            enc.alt = title;
            body.appendChild(enc);
        }

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
            a.text = source.name + " : "+ source.title;
            a.target = '_blank';
            li.appendChild(a);
            ul.appendChild(li);
        });
        body.appendChild(ul);

        await loadSimilar(id);

    } catch (error) {
        console.error(error);
    }
}

async function loadSimilar(id) {
    try{
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

    }catch(error){
        console.error(error);
    }
}