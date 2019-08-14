'use strict';

const DataService = (function() {

    let usJson;

    let airportData;

    let selectedAirports = [];

    let notSelectedAirports = [];

    let selectedFlights = [];

    let notSelectedFlights = [];

    let airportsWithFlights;

    let carriers;

    let dataset1;

    let dataset2;

    let ansiStatesCodes;

    let selectedDataset;

    let currentDataset;

    let filteredDataset;

    let minDataFilter = null;

    let maxDataFilter = null;

    let selectedStates = [];

    function setDefaultValues() {
        selectedDataset = dataset1;
        notSelectedAirports = [...airportData];
        notSelectedFlights = [...selectedDataset];
        filteredDataset = [...selectedDataset];
        selectedAirports = [];
        selectedFlights = [];
        notSelectedAirports = [...airportData];
        notSelectedFlights = [...selectedDataset];
        currentDataset = 'dataset1';
    }

    function filterAirports(decreasingAirports, increasingAirports, state) {
        decreasingAirports = decreasingAirports.filter(airport => {
            const sought = airport.state === state;
            sought && increasingAirports.push(airport);
            return !sought;
        });
    }

    function selectAirports() {
        selectedStates.forEach(state => {
            filterAirports(notSelectedAirports, selectedAirports, state);
        });
    }

    function defineValue(defineMin, array, key, edgeValue, invertedValue) {
        return array.slice(0).reduce((sought, current, i, arr) => {
            if (sought === edgeValue) arr.splice(1);
            defineMin ?
                (sought = +current[key] < sought ? +current[key] : sought)
                : (sought = +current[key] > sought ? +current[key] : sought);
            return sought;
        }, invertedValue);
    }

    function filterDataset() {
      const datasetToFilter = selectedStates.length ? selectedFlights : selectedDataset;
      if (minDataFilter && maxDataFilter) {
        filteredDataset = datasetToFilter.filter(item => {
          const date = new Date(item.Year, item.Month - 1, item.DayofMonth).getTime();
          return date >= minDataFilter && date <= maxDataFilter;
        });
      } else if (minDataFilter) {
        filteredDataset = datasetToFilter.filter(item => {
          const date = new Date(item.Year, item.Month - 1, item.DayofMonth);
          return date >= minDataFilter;
        });
      } else if (maxDataFilter) {
        filteredDataset = datasetToFilter.filter(item => {
          const date = new Date(item.Year, item.Month - 1, item.DayofMonth);
          return date <= maxDataFilter;
        });
      } else {
        filteredDataset = [...datasetToFilter];
      }

    }

    function selectFlights(state) {
        state && filterAirports(notSelectedAirports, selectedAirports, state);
        notSelectedFlights = notSelectedFlights.filter(flight => {
            const sought = selectedAirports.filter(airport => {
                return airport.iata === flight.Dest || airport.iata === flight.Origin;
            });
            const soughtFound = sought.length;
            soughtFound && selectedFlights.push(flight);
            return !soughtFound;
        });
    }

    function deselectFlights(state) {
        if (!selectedStates.length) {
            selectedAirports = [];
            notSelectedAirports = [...airportData];
            selectedFlights = [];
            notSelectedFlights = [...selectedDataset];
        } else {
            const airportsIATAsToDeSelect = [];
            if (state) {
                selectedAirports = selectedAirports.filter(airport => {
                    const sought = airport.state === state;
                    sought && notSelectedAirports.push(airport) && airportsIATAsToDeSelect.push(airport.iata);
                    return !sought;
                });
            }
            selectedFlights = selectedFlights.filter(flight => {
                const sought = state
                    ? airportsIATAsToDeSelect.indexOf(flight.Dest) !== -1 || airportsIATAsToDeSelect.indexOf(flight.Origin) !== -1
                    : selectedAirports.filter(airport => {
                        return airport.iata === flight.Dest || airport.iata === flight.Origin;
                    });
                const soughtFound = state ? sought : sought.length;
                soughtFound && notSelectedFlights.push(flight);
                return !soughtFound;
            });
        }
    }

    return {

        getInitialData: function() {
        return Promise.all([
          d3.json("./data/us.json"),
          d3.csv("./data/airports.csv"),
          d3.csv("./data/carriers.csv"),
          d3.csv("./data/dataset-1.csv"),
          d3.csv("./data/dataset-2.csv"),
          d3.json("./data/stateCodeToFips.json")
        ]).then(
            res => {
            usJson = res[0];
            airportsWithFlights = res[1];
            airportData = res[1];
            carriers = res[2];
            dataset1 = res[3];
            dataset2 = res[4];
            ansiStatesCodes = [];
            for (let key in res[5]) {
                ansiStatesCodes[parseInt(res[5][key], 10)] = key;
            }
            setDefaultValues();
            return true;
            },
            err => {
            alert("Error: " + err.message);
            return false;
          }
          )
      },

        pickDataset: function(value) {
            if (value === currentDataset) return;
            selectedDataset = value === 'dataset1' ? dataset1 : dataset2;
            currentDataset = value;
            minDataFilter = null;
            maxDataFilter = null;
            filteredDataset = [...selectedDataset];
            selectedAirports = [];
            selectedFlights = [];
            notSelectedAirports = [...airportData];
            notSelectedFlights = [...selectedDataset];
            if (selectedStates.length) {
                selectAirports();
                selectFlights(null);
                return filterDataset();
            }
            return selectedDataset;
        },

        getSliderData: function() {

          const years = selectedDataset.map(item => +item.Year);

          const minYear = Math.min(...years);
          const maxYear = Math.min(...years);

          const minYearArray = selectedDataset.filter(item => +item.Year === minYear);
          const maxYearArray = (minYear === maxYear) ? minYearArray : selectedDataset.filter(item => item.Year === maxYear)

          const minMonth = defineValue(true, minYearArray, 'Month', 1, 12);
          const maxMonth = defineValue(false, maxYearArray, 'Month', 12, 1);

          const minMonthArray = minYearArray.filter(item => +item.Month === minMonth);
          const maxMonthArray = (minMonth === maxMonth)? minMonthArray : maxYearArray.filter(item => +item.Month === maxMonth);

          const minDay = defineValue(true, minMonthArray, 'DayofMonth', 1, 31);
          const maxDay = defineValue(false, maxMonthArray, 'DayofMonth', 31, 1);

          const minData = new Date(minYear, minMonth - 1, minDay);
          const maxData = new Date(maxYear, maxMonth - 1 , maxDay);

          return { min: minData, max: maxData};

        },

        getThirdChartData: function() {

            let preparedData = [];

            const minMonth = defineValue(true, filteredDataset, 'Month', 1, 12); // 1
            const maxMonth = defineValue(false, filteredDataset, 'Month', 12, 1); // 12

            for (let i = minMonth; i < maxMonth + 1; i++) {
                const month = filteredDataset.filter(item => {
                    return +item.Month === i;
                });
                const minDay = defineValue(true, month, 'DayofMonth', 1, 31);
                const maxDay = defineValue(false, month, 'DayofMonth', 31, 1);
                for (let d = minDay; d < maxDay + 1; d++) {
                    const day = month.filter(dayItem => {
                        return +dayItem.DayofMonth === d;
                    });
                    let totalDepDelayMinutes = 0;
                    let totalWeatherDelayMinutes = 0;
                    let totalCarrierDelayMinutes = 0;
                    let flightThisDay = 0;
                    day.forEach(flightItem => {
                        if (+flightItem.DepDelay > 0) {
                            totalDepDelayMinutes += +flightItem.DepDelay
                        }
                        totalWeatherDelayMinutes += +flightItem.WeatherDelay;
                        totalCarrierDelayMinutes += +flightItem.CarrierDelay;
                        flightThisDay++;
                    });
                    var year = selectedDataset[0];
                    preparedData.push({
                        totalDelay: totalDepDelayMinutes,
                        weatherDelay: totalWeatherDelayMinutes,
                        averageFlightDelay: (totalDepDelayMinutes / flightThisDay) || 0,
                        carrierDelay: totalCarrierDelayMinutes,
                        flights: flightThisDay,
                        date: new Date(selectedDataset[0].Year, i-1, d, 12)
                    });
                }
            }

            return preparedData;
        },

        getMapFlightsData: function() {
          return {
            us: usJson,
            airports: airportData,
            flights: filteredDataset
          }
        },

        set min(value) {
          minDataFilter = value - 43200000;
          filterDataset();
        },

        set max(value) {
          maxDataFilter = value + 43200000;
          filterDataset();
        },

        set toggleState(id) {
          const state = ansiStatesCodes[id];
          if (!selectedStates.length || selectedStates.indexOf(state) === -1) {
              selectedStates.push(state);
              selectFlights(state);
          } else {
              selectedStates.splice(selectedStates.indexOf(state), 1);
              deselectFlights(state);
          }
          filterDataset();
        }

    }

}) ();
