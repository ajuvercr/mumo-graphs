import type { DeepPartial } from '@svelteuidev/core';
import type { ChartData, ChartOptions, DecimationOptions, DefaultDataPoint } from 'chart.js';
import type { ZoomPluginOptions } from 'chartjs-plugin-zoom/types/options';

export type ScatterData = ChartData<'scatter', DefaultDataPoint<'scatter'>, string>;

// export const data: ScatterData = {
//   datasets: [
//     {
//       borderColor: 'red',
//       type: 'scatter',
//       label: 'Dataset 2',
//       data: scatterData,
//       borderWidth: 2
//     },
//     {
//       fill: true,
//       type: 'scatter',
//       label: 'Dataset 3',
//       data: scatter2Data,
//       borderColor: 'blue',
//       borderWidth: 2
//     }
//   ]
// };

export const options: DeepPartial<
  ChartOptions & {
    plugins: { zoom: ZoomPluginOptions; decimation: DecimationOptions };
  }
> = {
  animation: false,
  datasets: {
    scatter: {
      fill: true,
      showLine: true
    }
  },
  scales: {
    x: {
      type: 'time',
      time: {
        displayFormats: {
          quarter: 'MMM YYYY'
        }
      }
    },
    y: {
      beginAtZero: true
    }
  },
  plugins: {
    decimation: {
      enabled: true,
      algorithm: 'lttb'
      // Other configuration options
    },
    zoom: {
      pan: {
        enabled: true,
        modifierKey: 'ctrl',
        mode: 'x'
      },
      zoom: {
        wheel: {
          enabled: true
        },
        pinch: {
          enabled: true
        },
        mode: 'x'
      }
    }
  }
};
