class RateManager {
  constructor(rates = []) {
    this.rates = rates;
  }

  setRates(rates) {
    this.rates = rates;
  }

  getCurrentRate(date = new Date()) {
    for (const r of this.rates) {
      if (date >= new Date(r.start) && date < new Date(r.end)) {
        return r;
      }
    }
    return null;
  }
}

module.exports = RateManager;
