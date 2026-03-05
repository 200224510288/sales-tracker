export type ForecastPoint = {
  dateId: string
  predicted: number
}

/*
 Lightweight SARIMA-like forecasting

 Model idea:
 y_t = alpha * y_{t-1} + beta * y_{t-7}

 Captures:
 - momentum
 - weekly seasonality
*/

export function seasonalForecast(
  series: number[],
  startDate: string,
  horizon = 7
): ForecastPoint[] {

  if (series.length < 10) return []

  const alpha = 0.6
  const beta = 0.4

  const result: ForecastPoint[] = []

  let values = [...series]

  for (let i = 0; i < horizon; i++) {

    const last = values[values.length - 1]
    const seasonal = values[values.length - 7] ?? last

    const next =
      alpha * last +
      beta * seasonal

    values.push(next)

    const d = new Date(startDate)
    d.setDate(d.getDate() + i + 1)

    result.push({
      dateId: d.toISOString().slice(0,10),
      predicted: Math.round(next)
    })
  }

  return result
}