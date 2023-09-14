let map; // Declare a variable to hold the map instance

document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("stream-form");
    const tableBody = document.querySelector("#stream-table tbody");
    const saveButton = document.getElementById("save-button");
    const localStorageKey = "streamEntries";
    const searchInput = document.getElementById("search");
    const useMyLocationCheckbox = document.getElementById("use-my-location");

    let entries = [];
    let sortColumn = "dateTime";
    let sortDirection = "desc";

    // Initialize the map when the page loads
    map = L.map('map').setView([39.8282, -98.5795], 3); // Initial center and zoom level, North America

    // Add a base tile layer from OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Function to load entries from local storage
    function loadEntries() {
        const entriesJSON = localStorage.getItem(localStorageKey);
        if (entriesJSON) {
            entries = JSON.parse(entriesJSON);
            renderTable();
        } else {
            addStaticRecords();
        }
    }

    // Function to add a new row to the table
    function addRowToTable(entry) {
        entries.push(entry);
        localStorage.setItem(localStorageKey, JSON.stringify(entries));
        renderTable();
    }

    // Function to render the table
    function renderTable(entriesToRender = entries) {
        tableBody.innerHTML = "";

        // Sort entries based on the selected column and direction
        entriesToRender.sort((a, b) => {
            const valueA = a[sortColumn];
            const valueB = b[sortColumn];

            if (sortDirection === "asc") {
                return valueA.localeCompare(valueB);
            } else {
                return valueB.localeCompare(valueA);
            }
        });

        entriesToRender.forEach(function (entry) {
            const newRow = document.createElement("tr");
            newRow.innerHTML = `
                <td><a href="${entry.link}" target="_blank">${entry.description}</a></td>
                <td>${entry.dateTime}</td>
                <td>${entry.city || ""}</td>
                <td>${entry.state || ""}</td>
                <td>${entry.latitude || ""}</td>
                <td>${entry.longitude || ""}</td>
            `;
            tableBody.appendChild(newRow);
        });

        // Update the map to display all markers
        updateMapMarkers(entriesToRender);
    }

    // Function to update map markers
    function updateMapMarkers(entriesToRender) {
        // Clear all markers from the map
        map.eachLayer(function (layer) {
            if (layer instanceof L.Marker) {
                map.removeLayer(layer);
            }
        });

        // Add markers for each entry's latitude and longitude
        entriesToRender.forEach(function (entry) {
            if (entry.latitude && entry.longitude) {
                const marker = L.marker([entry.latitude, entry.longitude])
                    .bindPopup(`<a href="${entry.link}" target="_blank">${entry.description}</a>`)
                    .addTo(map);
            }
        });
    }

    // Function to perform reverse geocoding based on latitude and longitude
    function reverseGeocode(latitude, longitude) {
        // Implement reverse geocoding logic here
        // You can use a suitable service or API to obtain city and state information
        // Example API request: https://api.example.com/reverse-geocode?lat={latitude}&lon={longitude}
        // Return an object with city and state properties
        // For this example, we'll mock the result with a Promise
        return new Promise((resolve, reject) => {
            // Simulate a delay for the mock reverse geocoding request
            setTimeout(() => {
                const locationInfo = {
                    city: "Sample City",
                    state: "Sample State",
                };
                resolve(locationInfo);
            }, 1000); // Adjust the delay as needed
        });
    }

    // Function to add static records
    function addStaticRecords() {
        const staticRecords = [
            {
                link: "https://www.youtube.com/watch?v=Zz5IPOjSZMY&t=1322s",
                description: "2023 BlackRabbit AVP Open Malone/Young vs Klentzman/Liu",
                dateTime: "2023-03-25 8:00 AM",
                latitude: "33.015576",
                longitude: "-96.997158",
            },
            {
                link: "https://www.youtube.com/watch?v=32UHRVx5GhA",
                description: "Amazing ICN (It's Called Normal) 3-on-3 Exhibition with Randy Stoklos and NYVarsity",
                dateTime: "2023-09-4 12:00 PM",
                latitude: "39.161113",
                longitude: "-106.753560",
            },
            // Add more static records as needed
        ];

        staticRecords.forEach(function (record) {
            const exists = entries.some((entry) => entry.description === record.description);

            if (!exists) {
                // Use reverse geocoding to get city and state based on latitude and longitude
                reverseGeocode(record.latitude, record.longitude)
                    .then((locationInfo) => {
                        record.city = locationInfo.city;
                        record.state = locationInfo.state;
                        addRowToTable(record);
                    })
                    .catch((error) => {
                        console.error(error);
                        alert("Error fetching location information. Please try again.");
                    });
            }
        });
    }

    // Rest of your code for sorting, filtering, and form submission

    // Event listener for sorting column headers
    document.querySelectorAll("th").forEach((header) => {
        header.addEventListener("click", function () {
            const column = header.getAttribute("data-column");

            // Toggle the sort direction if the same column is clicked
            if (sortColumn === column) {
                sortDirection = sortDirection === "asc" ? "desc" : "asc";
            } else {
                // Default to descending for a new column
                sortDirection = "desc";
                sortColumn = column;
            }

            // Render the sorted table
            renderTable();
        });
    });

    // Event listener for the search input
    searchInput.addEventListener("input", function () {
        filterTable();
    });

    // Function to filter the table based on the search input
    function filterTable() {
        const searchText = searchInput.value.toLowerCase();
        const filteredEntries = entries.filter((entry) =>
            Object.values(entry)
                .join(" ")
                .toLowerCase()
                .includes(searchText)
        );
        renderTable(filteredEntries);
    }

    form.addEventListener("submit", function (event) {
        event.preventDefault();

        const link = document.getElementById("link").value;
        const description = document.getElementById("description").value;

        if (!useMyLocationCheckbox.checked) {
            const city = document.getElementById("city").value;
            const state = document.getElementById("state").value;

            getLatLong(city, state)
                .then((result) => {
                    const newEntry = {
                        link,
                        description,
                        dateTime: new Date().toLocaleString(),
                        latitude: result.latitude,
                        longitude: result.longitude,
                    };

                    // Use reverse geocoding to get city and state based on latitude and longitude
                    reverseGeocode(result.latitude, result.longitude)
                        .then((locationInfo) => {
                            newEntry.city = locationInfo.city;
                            newEntry.state = locationInfo.state;

                            addRowToTable(newEntry);

                            document.getElementById("link").value = "";
                            document.getElementById("description").value = "";
                            document.getElementById("city").value = "";
                            document.getElementById("state").value = "";

                            filterTable();
                        })
                        .catch((error) => {
                            console.error(error);
                            alert("Error fetching location information. Please try again.");
                        });
                })
                .catch((error) => {
                    console.error(error);
                    alert("Error fetching latitude and longitude. Please check your city and state.");
                });
        } else {
            if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const newEntry = {
                            link,
                            description,
                            dateTime: new Date().toLocaleString(),
                            latitude: position.coords.latitude.toFixed(6),
                            longitude: position.coords.longitude.toFixed(6),
                        };

                        // Use reverse geocoding to get city and state based on latitude and longitude
                        reverseGeocode(newEntry.latitude, newEntry.longitude)
                            .then((locationInfo) => {
                                newEntry.city = locationInfo.city;
                                newEntry.state = locationInfo.state;

                                addRowToTable(newEntry);

                                document.getElementById("link").value = "";
                                document.getElementById("description").value = "";
                                document.getElementById("city").value = "";
                                document.getElementById("state").value = "";

                                filterTable();
                            })
                            .catch((error) => {
                                console.error(error);
                                alert("Error fetching location information. Please try again.");
                            });
                    },
                    (error) => {
                        console.error(error);
                        alert("Error fetching your location. Please try again.");
                    }
                );
            } else {
                alert("Geolocation is not supported in your browser.");
            }
        }
    });

    // Call the function to add static records
    addStaticRecords();

    // Load existing entries when the page loads
    loadEntries();
});
