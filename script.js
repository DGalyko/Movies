iview.lang('en-US');
﻿document.addEventListener("DOMContentLoaded", ready);

const HTTP = axios.create({
  baseURL: 'https://api.themoviedb.org/3/',
  timeout: 5000,
  params: {
    api_key: 'f721403d8ce8f43f4ea0fc02d2588e0e'
  }
});

var api = (function(){
  var filters = {};
  var url = "";

  return {
    setFilter: function(filter){
      for (var key in filter) {
        filters[key] = filter[key];
      }
    },
    getFilters: function(){
      return filters;
    },
    setUrl: function(link){
      url = link;
      filters = {};
    },
    getUrl: function(){
      return url;
    },


  }
}());

const router = new VueRouter({
  routes: [
    {
      path: '/genre/:genreId',
      name: 'genre',
    },
    {
      path: '/movie/:movieId',
      name: 'movie',
    }
  ],
});

function ready() {
  vm = new Vue({
    router,
    el: '#app',
    data() {
      return {
        info: null,
        loading: true,
        errored: false,
        movies: {
          results: [],
        },
        movie_details: false,
        genres: {},
        search_value: null,
        search_data: [],
        search_list: null,
        secure_base_url: null,
        poster_sizes: null,
        second_title: null,
      };
    },
    methods: {
      getGenres: function() {
        api.setUrl("/genre/movie/list");
        HTTP.get(api.getUrl())
          .then(response => {
            for (var i=0; i<response.data.genres.length; i++) {
              this.genres[response.data.genres[i].id] = response.data.genres[i].name
            }
          })
      },
      setImagesPath: function() {
        HTTP.get("/configuration")
        .then(response => {
          this.secure_base_url = response.data.images.secure_base_url;
          this.poster_sizes = response.data.images.poster_sizes;
        })
        .catch(error => {
          console.log(error);
          this.errored = true;
        });
      },
      getPopular: function(){
        api.setUrl('/movie/popular');
        this.getMoviesList();
      },
      getGenreMovies: function(genre_id){
        api.setUrl('/discover/movie');
        api.setFilter({"with_genres": genre_id});
        this.getMoviesList();
      },
      getMoviesList: function () {
        this.loading = true;
        HTTP.get(api.getUrl(), {params: api.getFilters()})
        .then(response => {
          this.movies = response.data;
        })
        .catch(error => {
          console.log(error);
          this.errored = true;
        })
        .finally(() => (this.loading = false));
      },
      getMovie: function (id) {
        this.loading = true;
        api.setUrl('/movie/'+id);
        HTTP.get(api.getUrl())
        .then(response => {
          this.movie_details = response.data;
        })
        .catch(error => {
          console.log(error);
          this.errored = true;
        })
        api.setUrl('/movie/'+id+'/similar');
        this.getMoviesList();

      },
      changePage: function(page) {
        api.setFilter({"page": page});
        this.getMoviesList();
      },
      genreIdtoName: function (id) {
        return this.genres[id];
      },
      watchRoute: function() {
          if (this.$route.params.genreId) {
            this.getGenreMovies(this.$route.params.genreId);
          };
          if (!this.$route.params.movieId) {
            this.movie_details = null;
          } else {
            this.getMovie(this.$route.params.movieId);
          }
      },
      handleSearch: function(value){
        this.debouncedGetSearch();
      },
      searchList: function() {
        HTTP.get('/search/movie', {params: {"query": this.search_value}})
        .then(response => {
          this.search_list = response.data.results;
        })
        .catch(error => {
          console.log(error);
        })
      },
    },
    watch: {
      '$route':  'watchRoute'
    },
    created: function () {
      this.debouncedGetSearch = _.debounce(this.searchList, 500);
    },
    mounted() {
      this.setImagesPath();
      this.getGenres();
      if (this.$route.params.genreId) {
        this.getGenreMovies(this.$route.params.genreId);
        return;
      } else if (this.$route.params.movieId) {
        this.getMovie(this.$route.params.movieId);
        return;
      } else {
        this.getPopular();
      }

    }
  });

}
