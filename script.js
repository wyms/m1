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

    // Function to save entries to local storage
    function saveEntriesToLocalStorage() {
        localStorage.setItem(localStorageKey, JSON.stringify(entries));
    }

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
        saveEntriesToLocalStorage(); // Save the updated entries
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

    // Function to add static records
    function addStaticRecords() {
        const staticRecords = [
            {
                link: "https://www.youtube.com/watch?v=Zz5IPOjSZMY&t=1322s",
                description: "2023 BlackRabbit AVP Open Malone/Young vs Klentzman/Liu",
                dateTime: "2023-03-25 8:00 AM",
                city: "Lewisville",
                state: "TX",
                latitude: "33.015576",
                longitude: "-96.997158",
            },
            {
                link: "https://www.youtube.com/watch?v=32UHRVx5GhA",
                description: "Amazing ICN (It's Called Normal) 3-on-3 Exhibition with Randy Stoklos and NYVarsity",
                dateTime: "2023-09-4 12:00 PM",
                city: "Aspen",
                state: "CO",
                latitude: "39.161113",
                longitude: "-106.753560",
            },
            // Add more static records as needed
        ];

        staticRecords.forEach(function (record) {
            const exists = entries.some((entry) => entry.description === record.description);

            if (!exists) {
                addRowToTable(record);
            }
        });
    }

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
        const city = document.getElementById("city").value;
        const state = document.getElementById("state").value;

        if (!useMyLocationCheckbox.checked) {
            getLatLong(city, state)
                .then((result) => {
                    const newEntry = {
                        link,
                        description,
                        dateTime: new Date().toLocaleString(),
                        city,
                        state,
                        latitude: result.latitude,
                        longitude: result.longitude,
                    };

                    addRowToTable(newEntry);

                    document.getElementById("link").value = "";
                    document.getElementById("description").value = "";
                    document.getElementById("city").value = "";
                    document.getElementById("state").value = "";

                    filterTable();
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
                            city: "",
                            state: "",
                            latitude: position.coords.latitude.toFixed(6),
                            longitude: position.coords.longitude.toFixed(6),
                        };

                        addRowToTable(newEntry);

                        document.getElementById("link").value = "";
                        document.getElementById("description").value = "";
                        document.getElementById("city").value = "";
                        document.getElementById("state").value = "";

                        filterTable();
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
