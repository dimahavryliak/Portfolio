'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputTemp = document.querySelector('.form__input--temp');
const inputClimb = document.querySelector('.form__input--climb');

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  clickNumber = 0;

  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance; // km
    this.duration = duration; // min
  }

  _setDescription() {
    this.type === 'running'
      ? (this.description = `Пробіжка ${new Intl.DateTimeFormat('ru-RU').format(
          this.date
        )}`)
      : (this.description = `Велотренування ${new Intl.DateTimeFormat(
          'ru-RU'
        ).format(this.date)}`);
  }

  click() {
    this.clickNumber++;
  }
}

class Running extends Workout {
  type = 'running';

  constructor(coords, distance, duration, temp) {
    super(coords, distance, duration);
    this.temp = temp;
    this.calculatePace();
    this._setDescription();
  }
  calculatePace() {
    // min/km
    this.pace = this.duration / this.distance;
  }
}

class Cycling extends Workout {
  type = 'cycling';

  constructor(coords, distance, duration, climb) {
    super(coords, distance, duration);
    this.climb = climb;
    this.calculateSpeed();
    this._setDescription();
  }

  calculateSpeed() {
    // km/h
    this.speed = this.distance / this.duration / 60;
  }
}

// const running = new Running([50, 39], 7, 40, 170);
// const cycling = new Cycling([50, 39], 37, 80, 370);
// console.log(running);
// console.log(cycling);

class App {
  #map;
  #mapEvent;
  #workouts = [];

  constructor() {
    //getting coords
    this._getPosition();

    // getting data from local storage
    this._getLocalStorageData();
    //add event listener
    form.addEventListener('submit', this._newWorkout.bind(this));

    inputType.addEventListener('change', this._toggleClimbField);

    containerWorkouts.addEventListener('click', this._moveToWorkout.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Couldnt get your location');
        }
      );
    }
  }
  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;

    const coords = [latitude, longitude];
    this.#map = L.map('map').setView(coords, 15);

    L.tileLayer('https://tile.openstreetmap.de/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on('click', this._showForm.bind(this));

    //show workouts from local storage on map
    this.#workouts.forEach(workout => {
      this._displayWorkout(workout);
    });
  }

  _showForm(e) {
    this.#mapEvent = e;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    inputTemp.value =
      inputClimb.value =
      inputDuration.value =
      inputDistance.value =
        '';
    form.classList.add('hidden');
  }

  _toggleClimbField() {
    inputClimb.closest('.form__row').classList.toggle('form__row--hidden');
    inputTemp.closest('.form__row').classList.toggle('form__row--hidden');
  }
  _newWorkout(e) {
    e.preventDefault();

    const areNumbers = (...numbers) =>
      numbers.every(num => Number.isFinite(num));

    const areNumbersPositive = (...numbers) => numbers.every(num => num > 0);

    const { lat, lng } = this.#mapEvent.latlng;
    let workout;
    // get data from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;

    // if running -> create running object
    if (type === 'running') {
      const temp = +inputTemp.value;
      //check if data is valid
      if (
        // !Number.isFinite(distance) ||
        // !Number.isFinite(duration) ||
        // !Number.isFinite(temp)
        !areNumbers(distance, duration, temp) ||
        !areNumbersPositive(distance, duration, temp)
      )
        return alert('Введіть додатнє число!');

      workout = new Running([lat, lng], distance, duration, temp);
    }

    // if cycling -> create cycling object
    if (type === 'cycling') {
      const climb = +inputClimb.value;
      //check if data is valid
      if (
        // !Number.isFinite(distance) ||
        // !Number.isFinite(duration) ||
        // !Number.isFinite(climb)
        !areNumbers(distance, duration, climb) ||
        !areNumbersPositive(distance, duration)
      )
        return alert('Введіть додатнє число!');
      workout = new Cycling([lat, lng], distance, duration, climb);
    }
    // push new object in a workout array
    this.#workouts.push(workout);

    // display training on the map
    this._displayWorkout(workout);

    //  display training in the list
    this._displayWorkoutOnSidebar(workout);
    //hide form and clear input
    this._hideForm();

    // add workouts to local storage
    this._addWorkoutsToLocalStorage();
  }
  _displayWorkout(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 200,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃' : '🚵‍♂️'} ${workout.description}`
      )
      .openPopup();
  }

  _displayWorkoutOnSidebar(workout) {
    let html = `<li class="workout workout--${workout.type}" data-id="${
      workout.id
    }">
    <h2 class="workout__title">${workout.description}</h2>
    <div class="workout__details">
      <span class="workout__icon">${
        workout.type === 'running' ? '🏃' : '🚵‍♂️'
      }</span>
      <span class="workout__value">${workout.distance}</span>
      <span class="workout__unit">км</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⏱</span>
      <span class="workout__value">${workout.duration}</span>
      <span class="workout__unit">хв</span>
    </div>
    `;

    if (workout.type === 'running') {
      html += `
<div class="workout__details">
      <span class="workout__icon">📏⏱</span>
      <span class="workout__value">${workout.pace.toFixed(2)}</span>
      <span class="workout__unit">хв/км</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">👟⏱</span>
      <span class="workout__value">${workout.temp}</span>
      <span class="workout__unit">кроків/хв</span>
    </div>
    </li>`;
    }
    if (workout.type === 'cycling') {
      html += `<div class="workout__details">
      <span class="workout__icon">${workout.speed.toFixed(2)}</span>
      <span class="workout__value">17</span>
      <span class="workout__unit">км/год</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">🏔</span>
      <span class="workout__value">${workout.climb}</span>
      <span class="workout__unit">м</span>
    </div>
    </li>`;
    }

    form.insertAdjacentHTML('afterend', html);
  }

  _moveToWorkout(e) {
    const workoutElement = e.target.closest('.workout');
    if (!workoutElement) return;
    const workout = this.#workouts.find(
      item => item.id === workoutElement.dataset.id
    );

    this.#map.setView(workout.coords, 15, {
      animate: true,
      pan: {
        duration: 1,
      },
    });

    // workout.click();
    // console.log(workout);
  }

  _addWorkoutsToLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }
  _getLocalStorageData() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    // console.log(data);

    if (!data) return;

    this.#workouts = data;

    this.#workouts.forEach(workout => {
      this._displayWorkoutOnSidebar(workout);
    });
  }

  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

const app = new App();
