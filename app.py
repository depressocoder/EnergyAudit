from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

class Appliance:
    def __init__(self, name, power_kw, hours_per_day, efficiency_ratio, count=1):
        self.name = name
        self.power_kw = power_kw
        self.hours_per_day = hours_per_day
        self.efficiency_ratio = efficiency_ratio
        self.count = count  # Number of appliances

    def daily_energy_consumption(self):
        return self.power_kw * self.hours_per_day * self.count

    def annual_energy_consumption(self):
        return self.daily_energy_consumption() * 365

    def ideal_energy_consumption(self):
        return self.daily_energy_consumption() * self.efficiency_ratio

    def efficiency_gap(self):
        return self.daily_energy_consumption() - self.ideal_energy_consumption()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/calculate', methods=['POST'])
def calculate():
    data = request.json
    cost_per_kwh = float(data.get('cost_per_kwh', 0.12))
    if cost_per_kwh <= 0:
        return jsonify({"error": "Invalid electricity cost"}), 400

    appliances_data = data.get('appliances', [])
    appliances = []
    
    for item in appliances_data:
        try:
            power = float(item['power_kw'])
            hours = float(item['hours_per_day'])
            efficiency = float(item['efficiency_ratio'])
            count = int(item.get('count', 1))

            if power <= 0 or hours <= 0 or efficiency <= 0 or efficiency > 1 or count <= 0:
                continue  # Skip invalid appliances

            appliance = Appliance(item['name'], power, hours, efficiency, count)
            appliances.append(appliance)
        except (ValueError, TypeError):
            continue  # Skip any appliance with invalid data

    if not appliances:
        return jsonify({"error": "No valid appliances provided"}), 400

    results = []
    total_energy = 0
    total_savings = 0

    for appliance in appliances:
        daily = appliance.daily_energy_consumption()
        annual = appliance.annual_energy_consumption()
        ideal = appliance.ideal_energy_consumption()
        gap = appliance.efficiency_gap()
        gap_percentage = (gap / daily) * 100 if daily > 0 else 0

        results.append({
            'name': appliance.name,
            'count': appliance.count,
            "daily_energy_consumption": round(daily, 2),
            "annual_energy_consumption": round(annual, 2),
            "gap": round(gap, 2),
            "gap_percentage": round(gap_percentage, 2),
            "recommendation": "⚠️ Consider replacing" if gap_percentage >= 20 else "✔️ Efficient"
        })

        total_energy += daily
        total_savings += gap * 365 * cost_per_kwh

    return jsonify({"results": results, "total_energy": round(total_energy, 2), "total_savings": round(total_savings, 2)})

if __name__ == "__main__":
    app.run(debug=True)




