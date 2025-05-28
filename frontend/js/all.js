const limit = 100
const url = `http://localhost:9999/api/v1/get/all?limit=${limit}`
const body = document.getElementById('news')

document.addEventListener('DOMContentLoaded', async function() {
    try{
    const response = await fetch(url)
    if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`)
    }
    const data = await response.json()

    for (let i = 0; i < data.items.length; i++){
        const newsItemDiv =  document.createElement('div')
        newsItemDiv.className = 'news-item'
        
        const newsItemTitle = document.createElement('h2')
        newsItemTitle.textContent = data.items[i].title

        const newsItemDate = document.createElement('p')
        newsItemDate.textContent = new Date(data.items[i].date).toLocaleString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit',
            hour12: false
        }).replace(', ', ' / ').replace(/\.\d{4}/, '');
        
        newsItemDiv.appendChild(newsItemDate)
        newsItemDiv.appendChild(newsItemTitle)
        if (data.items[i].isRT){
            newsItemDiv.classList.add('news-item-rt')
        }
        const newsLink = document.createElement('a')
        newsLink.className = 'news-link'
        newsLink.href = `/news/${data.items[i].id}`
        newsLink.appendChild(newsItemDiv)
        body.appendChild(newsLink)
    }

    } catch(error) {
        console.log(error)
    }
})