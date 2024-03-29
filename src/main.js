// Data 

const api = axios.create({
    baseURL: 'https://api.themoviedb.org/3/',
    headers: {
        'Content-Type': 'application/json;charset=utf-8',
    },
    params: {
        'api_key': 'b3752885e967c8479c86bee6e62eccb6',
    }
});


function likedMoviesList() {
    const item = JSON.parse(localStorage.getItem('liked_movies'));
    let movies;

    if (item) {
        movies = item;
    } else {
        movies = {};
    }

    return movies;
}

function likedMovie(movie) {
    const likedMovies = likedMoviesList();

    if (likedMovies[movie.id]) {
        likedMovies[movie.id] = undefined;
    } else {
        likedMovies[movie.id] = movie;
    }

    localStorage.setItem('liked_movies', JSON.stringify(likedMovies));

    getTrendingMoviesPreview()
    getLikedMovies()
}

// Utils

// Constante para carga imagenes 
const lazyLoader = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            const url = entry.target.getAttribute('data-img')
            entry.target.setAttribute('src', url);
        }
    });
});

function createMovies(
    movies,
    container,
    {
        lazyLoad = false,
        clean = true,
    } = {},
) {
    if (clean) {
        container.innerHTML = '';
    }

    movies.forEach(movie => {
        const movieContainer = document.createElement('div');
        movieContainer.classList.add('movie-container');

        const movieImg = document.createElement('img');
        movieImg.classList.add('movie-img');
        movieImg.setAttribute('alt', movie.title);
        movieImg.setAttribute(
            lazyLoad ? 'data-img' : 'src',
            'https://image.tmdb.org/t/p/w300' + movie.poster_path,
        );
        movieImg.addEventListener('click', () => {
            location.hash = '#movie=' + movie.id;
        });
        movieImg.addEventListener('error', () => {
            movieImg.setAttribute(
                'src',
                'https://static.platzi.com/static/images/error/img404.png',
            );
        });

        const movieBtn = document.createElement('button');
        movieBtn.classList.add('movie-btn');
        likedMoviesList()[movie.id] && movieBtn.classList.add('movie-btn--liked');
        movieBtn.addEventListener('click', () => {
            movieBtn.classList.toggle('movie-btn--liked');
            likedMovie(movie);
        });

        if (lazyLoad) {
            lazyLoader.observe(movieImg);
        }

        movieContainer.appendChild(movieImg);
        movieContainer.appendChild(movieBtn);
        container.appendChild(movieContainer);
    });
}

function createCategories(categories, container) {
    container.innerHTML = "";

    categories.forEach(category => {
        const categoryContainer = document.createElement('div');
        categoryContainer.classList.add('category-container');

        const categoryTitle = document.createElement('h3');
        categoryTitle.classList.add('category-title');
        categoryTitle.setAttribute('id', 'id' + category.id);
        categoryTitle.addEventListener('click', () => {
            location.hash = `#category=${category.id}-${category.name}`;
        });
        const categoryTitleText = document.createTextNode(category.name);

        categoryTitle.appendChild(categoryTitleText);
        categoryContainer.appendChild(categoryTitle);
        container.appendChild(categoryContainer);
    });
}

// Llamados a la API

async function getTrendingMoviesPreview() {
    const { data, status } = await api('trending/movie/day');
    if (status === 200) {
        const movies = data.results;
        console.log(movies)

        createMovies(movies, trendingMoviesPreviewList, true);
    } else {
        return errorNavi();

    }
};

async function getCategegoriesPreview() {

    const [_, languageId] = location.hash.split('=');
    console.log('este es el lenguaje', languageId)
    const { data } = await api('genre/movie/list', {
        params: {
            language: languageId,
        },
    });


    const categories = data.genres;

    getTravelCategory(categories);

    createCategories(categories, categoriesPreviewList);
}

async function getMoviesByCategory(id) {
    const { data } = await api('discover/movie', {
        params: {
            with_genres: id,
        },
    });
    const movies = data.results;
    maxPage = data.total_pages;

    createMovies(movies, genericSection, { lazyLoad: true });
}

function getPaginatedMoviesByCategory(id) {
    return async function () {
        const {
            scrollTop,
            scrollHeight,
            clientHeight
        } = document.documentElement;

        const scrollIsBottom = (scrollTop + clientHeight) >= (scrollHeight - 15);
        const pageIsNotMax = page < maxPage;

        if (scrollIsBottom && pageIsNotMax) {
            page++;
            const { data } = await api('discover/movie', {
                params: {
                    with_genres: id,
                    page,
                },
            });
            const movies = data.results;

            createMovies(
                movies,
                genericSection,
                { lazyLoad: true, clean: false },
            );
        }
    }
}

async function getMoviesBySearch(query) {
    const { data } = await api('search/movie', {
        params: {
            query,
        },
    });
    const movies = data.results;
    maxPage = data.total_pages;
    console.log(maxPage)

    createMovies(movies, genericSection);
}

function getPaginatedMoviesBySearch(query) {
    return async function () {
        const {
            scrollTop,
            scrollHeight,
            clientHeight
        } = document.documentElement;

        const scrollIsBottom = (scrollTop + clientHeight) >= (scrollHeight - 15);
        const pageIsNotMax = page < maxPage;

        if (scrollIsBottom && pageIsNotMax) {
            page++;
            const { data } = await api('search/movie', {
                params: {
                    query,
                    page,
                },
            });
            const movies = data.results;

            createMovies(
                movies,
                genericSection,
                { lazyLoad: true, clean: false },
            );
        }
    }
}

async function getTrendingMovies() {
    const { data } = await api('trending/movie/day');
    const movies = data.results;
    maxPage = data.total_pages;

    createMovies(movies, genericSection, { lazyLoad: true, clean: true });
}

async function getPaginatedTrendingMovies() {
    const {
        scrollTop,
        scrollHeight,
        clientHeight
    } = document.documentElement;

    const scrollIsBottom = (scrollTop + clientHeight) >= (scrollHeight - 15);
    const pageIsNotMax = page < maxPage;

    if (scrollIsBottom && pageIsNotMax) {
        page++;
        const { data } = await api('trending/movie/day', {
            params: {
                page,
            },
        });
        const movies = data.results;

        createMovies(
            movies,
            genericSection,
            { lazyLoad: true, clean: false },
        );
    }
}

async function getMovieById(id) {
    const { data: movie } = await api('movie/' + id);

    let movieImgUrl = '';


    if (window.screen.availWidth < 700) {
        movieImgUrl = 'https://image.tmdb.org/t/p/w500' + movie.poster_path;
    } else {
        movieImgUrl = 'https://image.tmdb.org/t/p/original' + movie.poster_path;
    }

    console.log('este es el ancho', window.screen.availWidth)
    console.log('este es el alto', window.screen.availHeight)   
    console.log(movieImgUrl)
    headerSection.style.background = `
      linear-gradient(
        180deg,
        rgba(0, 0, 0, 0.35) 19.27%,
        rgba(0, 0, 0, 0) 29.17%
      ),
      url(${movieImgUrl})
    `;

    headerSection.classList.add('imagen-desc')
    
    movieDetailTitle.textContent = movie.title;
    movieDetailDescription.textContent = movie.overview;
    movieDetailScore.textContent = movie.vote_average;

    createCategories(movie.genres, movieDetailCategoriesList);

    getRelatedMoviesId(id);
}

async function getRelatedMoviesId(id) {
    const { data } = await api(`movie/${id}/recommendations`);
    const relatedMovies = data.results;

    createMovies(relatedMovies, relatedMoviesContainer);
}

function getLikedMovies() {
    const likedMovies = likedMoviesList();
    const moviesArray = Object.values(likedMovies);


    createMovies(moviesArray, likedMoviesListArticle, { lazyLoad: true, clean: true });

}

async function getCategoryLanguages() {
    const { data, status } = await api('configuration/languages');

    if (status === 200) {
        const selecLang = data.filter(item => {
            if (item.english_name === 'English' || item.english_name === 'Spanish' || item.english_name === 'Romanian') {
                return item;
            }
        })

        console.log('filter', selecLang);
        const itemLang = selecLang.map(item => {
            const optionLang = document.createElement('option');
            optionLang.setAttribute('value', item.iso_639_1);
            optionLang.text = item.english_name;

            if (item.english_name === 'English') {
                optionLang.text = getFlagEmoji('US');
            }
            if (item.english_name === 'Spanish') {
                optionLang.text = getFlagEmoji('ES');
            }
            if (item.english_name === 'Romanian') {
                optionLang.text = getFlagEmoji('RO');
            }


            categoriLanguages.appendChild(optionLang);

        });

    }
    else {
        !status === 200
        return error

    }

};

categoriLanguages.addEventListener('change', (event) => {
    console.log('este es el evento', event.target.value);

    location.hash = '#lang=' + event.target.value;
});

function getFlagEmoji(countryCode) {
    const codePoints = countryCode
        .toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt());
    return String.fromCodePoint(...codePoints);
}

function getTravelCategory(categories) {

    categories.forEach(category => {
        const liItem = document.createElement('li');
        liItem.classList.add('category-container');

        const ulContainer = document.querySelector('#travelCtegory');
        
        liItem.classList.add('category-title');
        liItem.setAttribute('id', 'id' + category.id);
        liItem.addEventListener('click', () => {
            location.hash = `#category=${category.id}-${category.name}`;
        });
        const categoryTitleText = document.createTextNode(category.name);
        liItem.appendChild(categoryTitleText);

        ulContainer.appendChild(liItem);
        
    });
};

function getFavoritSeccion() {

    const butonFavorite = document.createElement('button');
    butonFavorite.innerText = 'Favoritos';
    butonFavorite.classList.add('favotite-buton');

    const botonClose = document.createElement('button')
    botonClose.innerText = 'Cerrar favoritos';
    botonClose.classList.add('favotite-buton')

    butonFvori.appendChild(butonFavorite);
    butonFvori.appendChild(botonClose);
    

    butonFavorite.addEventListener('click', (ev) => {
        ev.preventDefault();
        likedMoviesSection.classList.remove('inactive');

        const likedMovies = likedMoviesList()
        if (likedMovies === '') {
            return 
        }

        console.log('liked', likedMovies)

        const arrayMovies = Object.keys(likedMovies);

        if(arrayMovies.length == 0) {
            console.log('array vacio', arrayMovies)
            return containerAlert.classList.remove('inactive')
        }        
    });

    botonClose.addEventListener('click', (ev) => {
        ev.preventDefault();
        likedMoviesSection.classList.add('inactive');
    })

};

btnCloset.addEventListener('click', () => {
    containerAlert.classList.add('inactive');
});

getFavoritSeccion()

getCategoryLanguages();
getTrendingMoviesPreview();
// getCategoriesPreview();

