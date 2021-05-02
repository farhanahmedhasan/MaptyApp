"use strict";

class Workout {
  date = new Date();
  id = (Date.now().toString(36) + Math.random().toString(36).substr(3, 12)).toUpperCase();
  constructor(coords, distance, duration) {
    this.coords = coords; //[lat,lng]
    this.distance = distance; //in km
    this.duration = duration; // in minute
  }

  _setWorkoutTitle() {
    // prettier-ignore
    const months = ["January","February","March","April","May","June","July","August","September","October","November","December",];
    this.title = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

class Running extends Workout {
  type = "running";
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setWorkoutTitle();
  }

  calcPace() {
    this.pace = this.duration / this.distance; //min/km
    return this.pace;
  }
}

class Cycling extends Workout {
  type = "cycling";
  constructor(coords, distance, duration, elevation) {
    super(coords, distance, duration);
    this.elevation = elevation;
    this.calcSpeed();
    this._setWorkoutTitle();
  }

  calcSpeed() {
    this.speed = this.distance / (this.duration / 60); //km/h
    return this.speed;
  }
}

//-----------------------------------------Application Architecture
const form = document.querySelector(".form");
const btnDeleteAll = document.querySelector(".clean--workout");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");

class App {
  #map;
  #mapZoomLevel = 13;
  #mapClick;
  #markers = [];
  #workouts = [];
  constructor() {
    //load the map
    this._getPosition();

    //Get dataFrom LocalStorage
    this._getLocalStorage();

    //Events
    form.addEventListener("submit", this._newWorkout.bind(this));
    inputType.addEventListener("change", this._toggleElevationField);
    containerWorkouts.addEventListener("click", this._moveToPopUp.bind(this));
    btnDeleteAll.addEventListener("click", this._reset);
  }

  //Methods
  _getPosition() {
    navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), function () {
      alert(`We wasn't able to get your current location`);
    });
  }

  _loadMap(position) {
    const { latitude, longitude } = position.coords;
    const userCoords = [latitude, longitude];

    this.#map = L.map("map").setView(userCoords, this.#mapZoomLevel);

    L.tileLayer("http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", {
      subdomains: ["mt0", "mt1", "mt2", "mt3"],
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on("click", this._showForm.bind(this));

    this.#workouts.forEach(work => {
      this._renderMarkerOnMap(work);
    });
  }

  _showForm(mapE) {
    form.classList.remove("hidden");
    inputDistance.focus();

    const { lat, lng } = mapE.latlng;
    this.#mapClick = [lat, lng];
  }

  _hideForm() {
    // Clear Fields
    inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = "";

    form.classList.add("hidden");
  }

  _toggleElevationField() {
    inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
    inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
  }

  _newWorkout(e) {
    e.preventDefault();
    //Validation helper Function
    const validInput = (...inputs) => inputs.every(inp => Number.isFinite(inp));
    const allPositive = (...inputs) => inputs.every(inp => inp > 0);

    //Reading inputs value
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    let workout;

    //if workout === running >>Creat a(running) Workout object from Running Class
    if (type === "running") {
      const cadene = +inputCadence.value;
      //Check if Inputs Are Valid
      if (!validInput(distance, duration, cadene) || !allPositive(distance, duration, cadene))
        return alert("Insert Positive Number");

      workout = new Running(this.#mapClick, distance, duration, cadene);
    }
    //if workout === cycling >>Creat a(cycling) Workout object from Cycling Class
    if (type === "cycling") {
      const elevation = +inputElevation.value;
      //Check if Inputs Are Valid
      if (!validInput(distance, duration, elevation || !allPositive(distance, duration)))
        return alert("Insert Positive Number");

      workout = new Cycling(this.#mapClick, distance, duration, elevation);
    }

    //push the workout in workouts array [{}{}]
    this.#workouts.push(workout);

    //Render Workout in list
    this._renderWorkout(workout);

    //Render Marker on map
    this._renderMarkerOnMap(workout);

    //Hide Form
    this._hideForm();

    //Set LocalStorage to all workouts
    this._setLocalStorage();
  }

  _renderMarkerOnMap(workout) {
    const myIcon = L.icon({
      iconUrl: "marker.png",
      iconSize: [38, 45],
      iconAnchor: [22, 45],
      popupAnchor: [-3, -25],
    });

    const marker = L.marker(workout.coords, {
      icon: myIcon,
    })
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          minWidth: 120,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(`${workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"} ${workout.title}`)
      .openPopup();
  }

  _renderWorkout(workout) {
    const html = `<li class="workout workout--${workout.type}" data-id= ${workout.id}>
          <h2 class="workout__title">${
            workout.title
          }<span class="workout__delete" style="float: right">❌</span></h2>
          <div class="workout__details">
            <span class="workout__icon">${workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"}</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${
              workout.type === "running" ? workout.pace.toFixed(1) : workout.speed.toFixed(1)
            }
      </span>
            <span class="workout__unit">${workout.type === "running" ? "min/km" : "km/h"}</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">${workout.type === "running" ? "👣" : "⛰"}</span>
            <span class="workout__value">${
              workout.type === "running" ? workout.cadence : workout.elevation
            }</span>
            <span class="workout__unit">${workout.type === "running" ? "spm" : "m"}</span>
          </div>
        </li>`;
    form.insertAdjacentHTML("afterend", html);
  }

  _moveToPopUp(e) {
    const li = e.target.closest(".workout");
    if (!li) return; //Guard Clause

    const id = li.getAttribute("data-id");

    const wokoutId = this.#workouts.find(obj => obj.id === id);
    this.#map.setView(wokoutId.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });

    if (e.target.classList.contains("workout__delete")) {
      li.remove(); //Remove list
      this._delete(wokoutId);
    }
  }

  _setLocalStorage() {
    localStorage.setItem("workouts", JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem("workouts"));

    if (!data) return;

    this.#workouts = data;
    this.#workouts.forEach(work => {
      this._renderWorkout(work);
    });
  }

  //Delete Single Item
  _delete(wokoutId) {
    const data = JSON.parse(localStorage.getItem("workouts")); //Get local storage Data
    const index = data.findIndex(obj => obj.id === wokoutId.id); //Find matching index
    data.splice(index, 1); //delete selected obj
    this.#workouts = data; //redefine workouts[{}]
    localStorage.setItem("workouts", JSON.stringify(this.#workouts)); //setLocal Storage again
  }

  //Remove all Items From LocalStorage
  _reset() {
    if (confirm("Are you sure you want to delete all the Workouts?")) {
      localStorage.clear("workouts");
      location.reload();
    } else return;
  }
}

const app = new App();
