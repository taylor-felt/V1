const ws = new WebSocket(`ws://${location.host}`);
const powerSpan = document.getElementById('power');
const avgSpan = document.getElementById('average');
const ctx = document.getElementById('power-chart').getContext('2d');

const bufferSize = 30;
const buffer = [];

const chart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: [],
    datasets: [{
      label: 'Power (kW)',
      data: [],
      borderColor: 'blue',
      fill: false
    }]
  },
  options: {
    animation: false,
    scales: { x: { display: false } }
  }
});

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.power != null) {
    const now = new Date();
    powerSpan.textContent = data.power.toFixed(2);
    buffer.push(data.power);
    if (buffer.length > bufferSize) buffer.shift();
    const avg = buffer.reduce((a,b) => a+b, 0) / buffer.length;
    avgSpan.textContent = avg.toFixed(2);

    chart.data.labels.push(now.toLocaleTimeString());
    chart.data.datasets[0].data.push(data.power);
    if (chart.data.labels.length > 60) {
      chart.data.labels.shift();
      chart.data.datasets[0].data.shift();
    }
    chart.update('none');
  }
};
