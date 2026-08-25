# M-CHICKS Calculation Engine Documentation

All calculations are centralized in `client/src/utils/calc.js`.

---

## Live Birds

```
Live Birds = Initial Chicks − Cumulative Mortality
```

---

## Mortality Percentage

```
Mortality % = (Cumulative Mortality ÷ Initial Chicks) × 100
```

---

## Biomass

```
Biomass (kg) = (Bird Count × Average Weight in grams) ÷ 1000
```

---

## Weight Gain

```
Weight Gain (kg) = Current Biomass − Initial Biomass
```

---

## Farm FCR (Feed Conversion Ratio)

```
Farm FCR = Total Feed Consumed (kg) ÷ Current Live Biomass (kg)
```

> Measures how much feed was used per kg of live bird body weight.

---

## Growth FCR

```
Growth FCR = Total Feed Consumed (kg) ÷ Weight Gain (kg)
```

> Measures how much feed was required to produce each kg of new body weight.

---

## Feed Remaining

```
Feed Remaining (bags) = Allocated Bags − Consumed Bags
Feed Remaining (kg)   = Remaining Bags × Bag Weight (kg)
```

---

## Feed Coverage

```
Coverage Days = Feed Remaining (bags) ÷ Daily Average Consumption (bags/day)
```

Daily average is computed from the last 3 days of feed logs.

---

## Projected Feed Requirement

```
Projected Total = Consumed So Far + (Daily Average × Remaining Days)
Additional Required = max(0, Projected Total − Allocated)
```

---

## Performance Score

Weighted 0–100 score:

| Factor | Max Penalty |
|--------|------------|
| Mortality Rate (×5) | −25 pts |
| FCR above 1.75 (×50) | −25 pts |
| Weight below target (×0.5/g) | −25 pts |
| Environment Attention | −10 pts |
| Environment Critical | −20 pts |

---

## Settlement (Configurable)

```
Gross Revenue = Live Biomass (kg) × Company Rate (₹/kg)
Total Expenses = Feed Cost + Supplements + Other Expenses + Chick Cost
Net Income = Gross Revenue − Total Expenses
```

---

## Average Weight from Sample

```
Average Weight (g) = (Total Sample Weight kg × 1000) ÷ Sample Count
```

---

## Units Reference

| Metric | Unit |
|--------|------|
| Bird weight | grams (g) |
| Feed per bag | kg |
| Biomass | kg |
| FCR | dimensionless ratio |
| Shed area | sq.ft |
| Temperature | °C |
| Humidity | % |
| Expenses | ₹ (Indian Rupees) |
