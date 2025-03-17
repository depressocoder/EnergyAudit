document.addEventListener("DOMContentLoaded", function () {
    const darkModeToggle = document.getElementById("darkModeToggle");
    const body = document.body;

    // Load dark mode preference from LocalStorage
    if (localStorage.getItem("darkMode") === "enabled") {
        body.classList.add("dark-mode");
        darkModeToggle.textContent = "☀️ Light Mode";
    }

    // Toggle Dark Mode
    darkModeToggle.addEventListener("click", function () {
        body.classList.toggle("dark-mode");

        if (body.classList.contains("dark-mode")) {
            localStorage.setItem("darkMode", "enabled");
            darkModeToggle.textContent = "☀️ Light Mode";
        } else {
            localStorage.setItem("darkMode", "disabled");
            darkModeToggle.textContent = "🌙 Dark Mode";
        }
    });

    document.getElementById("auditForm").addEventListener("submit", async function (e) {
        e.preventDefault();

        let appliances = [];
        let valid = true;

        document.querySelectorAll(".appliance").forEach(row => {
            let name = row.querySelector(".name").value.trim();
            let power = parseFloat(row.querySelector(".power").value);
            let unit = row.querySelector(".unit").value;
            let hours = parseFloat(row.querySelector(".hours").value);
            let efficiency = parseFloat(row.querySelector(".efficiency").value);
            let count = parseInt(row.querySelector(".count").value);

            // Convert Watts to kW
            if (unit === "W") {
                power = power / 1000;
            }

            // Validation: Prevent invalid values
            if (!name || isNaN(power) || isNaN(hours) || isNaN(efficiency) || isNaN(count) ||
                power <= 0 || hours <= 0 || efficiency <= 0 || efficiency > 1 || count <= 0) {
                
                valid = false;
                alert("Please enter valid positive values. Efficiency must be between 0 and 1.");
                return;
            }

            appliances.push({ name, power_kw: power, hours_per_day: hours, efficiency_ratio: efficiency, count });
        });

        if (!valid) return;

        let cost_per_kwh = parseFloat(document.getElementById("cost_per_kwh").value);
        if (isNaN(cost_per_kwh) || cost_per_kwh <= 0) {
            alert("Please enter a valid electricity cost.");
            return;
        }

        try {
            let response = await fetch("/calculate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cost_per_kwh, appliances })
            });

            if (!response.ok) {
                let errorData = await response.json();
                alert("Error: " + errorData.error);
                return;
            }

            let data = await response.json();
            updateResults(data);
        } catch (error) {
            alert("Failed to connect to server. Please try again.");
        }
    });
});

function addAppliance() {
    let div = document.createElement("div");
    div.classList.add("appliance");
    div.innerHTML = `
        <input type="text" class="name" placeholder="Appliance Name" required>
        <input type="number" class="power" placeholder="Power" min="1" required>
        <select class="unit">
            <option value="kW">kW</option>
            <option value="W">W</option>
        </select>
        <input type="number" class="hours" placeholder="Hours per Day" min="1" required>
        <input type="number" class="efficiency" placeholder="Efficiency Ratio (0-1)" step="0.01" min="0.01" max="1" required>
        <input type="number" class="count" placeholder="Number of Appliances" min="1" required>
        <button type="button" onclick="this.parentNode.remove()">Remove</button>
    `;

    let container = document.getElementById("applianceInputs");
    container.appendChild(div);
}

function updateResults(data) {
    let table = document.getElementById("resultsTable");
    table.innerHTML = "";
    
    let labels = [];
    let currentValues = [];
    let idealValues = [];

    data.results.forEach(item => {
        let row = `<tr>
            <td>${item.name}</td>
            <td>${item.count}</td>
            <td>${item.daily_energy_consumption}</td>
            <td>${item.annual_energy_consumption}</td>
            <td>${item.gap}</td>
            <td>${item.recommendation}</td>
        </tr>`;
        table.innerHTML += row;

        labels.push(item.name);
        currentValues.push(item.daily_energy_consumption);
        idealValues.push(item.daily_energy_consumption - item.gap);
    });

    let ctx = document.getElementById("energyChart").getContext("2d");
    new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [
                {
                    label: "Current Consumption",
                    data: currentValues,
                    backgroundColor: "rgba(255, 99, 132, 0.7)",
                    borderColor: "rgba(255, 99, 132, 1)",
                    borderWidth: 1
                },
                {
                    label: "Ideal Consumption",
                    data: idealValues,
                    backgroundColor: "rgba(75, 192, 192, 0.7)",
                    borderColor: "rgba(75, 192, 192, 1)",
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}






