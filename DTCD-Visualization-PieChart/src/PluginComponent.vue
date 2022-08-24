<template>
  <div class="VisualizationPieChart" ref="VisualizationPieChart">
    <div v-show="isDataError" class="DataError">
      <span class="FontIcon name_infoCircleOutline Icon"></span>
      {{ errorMessage }}
    </div>
    <div
      ref="pieChart"
      class="piechart-block"
    >
      <div
        ref="chartTooltip"
        style="
        position: absolute;
        visibility: hidden;
        border-radius: 3px;
        padding: 5px;
      "
        :style="{
          color: '#000000',
          backgroundColor: '#f00',
          border: `1px solid #00f`,
        }"
      >
        Наведите курсор на график
      </div>
      <div v-if="title" class="title"> {{title}}</div>
      <div
        v-show="!dataLoading && !!dataset.length"
        class="piechart-legend-block"
        :style="{
          flexFlow: positionLegends,
           height: title ? 'calc(100% - 40px)' : '100%'
        }"
      >
        <div
          ref="piechartItself"
          :class="`dash-piechart ${_uid}`"
        />
        <div
          ref="legends"
          class="legend-block-pie"
          :class="positionLegend === 'top'
            || positionLegend === 'bottom'
            ? 'legend-block-pie__horizontally'
            : 'legend-block-pie__vertically'"
        >
          <div
            v-for="(item, idx) in legends"
            :key="idx"
            class="legend-line"
          >
            <div
              class="square"
              :style="{ backgroundColor: item.color }"
            />
            <div
              class="text"
              :style="{ color: '#000000' }"
            >
              {{ item.label }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import PiechartClass from './js/PiechartClass';

export default {
  name: 'PieChart',
  data: () => ({
    dataset: [],
      // message: 'Нет данных для отображения',
      isShowLegend: true,
      legends: [],
      positionLegend:'left',
      positionLegends: 'row nowrap',
      piechart: null,
      pieType: 'pie',

      title: '',
      colValue: 'count',
      label: 'label',
      pallet: [],
      isDataError: false,
      errorMessage:'',
      resizeObserver: null,
      panelSize: {
        height:200,
        width:200
      },
    }),
  computed: {
    validateData() {

      if (this.dataset.length <= 0) {
        return { isValid: false, error: 'Нет данных для построения' };
      }

      const dsCols = Object.keys(this.dataset[0]);

      if (!dsCols.includes(this.colValue)) {
        return { isValid: false, error: `Отсутствует столбец данных ${this.colValue}` };
      }

      if (!dsCols.includes(this.label)) {
        return { isValid: false, error: `Отсутствует столбец данных ${this.label}` };
      }

      return { isValid: true, error: '' };
    },
    dataLoading() {
      return this.dataset.length === 0;
    },
    dashSize() {
      return this.panelSize;
    },
    isDonat() {
      return this.pieType === 'donat' || false;
    },
  },
  watch: {
    positionLegend: {
      handler(val, old) {
        if (val && val !== old && this.isShowLegend) {
           const calculatedSize = this.calculatedSize(this.legendSize())
           if (
             this.piechart?.size
             && calculatedSize.height > 0
             && calculatedSize.width > 0
           ) {
             this.piechart.size = calculatedSize;
           }
        }
      },
      deep: true,
    },
    isDonat(val) {
      if (val !== this.piechart?.isDonat) {
        this.piechart.isDonat = val;
      }
    },
    panelSize: {
      deep: true,
      handler(val, old) {
        if (JSON.stringify(val) !== JSON.stringify(old) && this.piechart) {
          this.piechart.size = this.calculatedSize(this.legendSize());
        }
      },
    },
    dataset: {
      handler(newVal) {
        if (newVal[0]) {
            this.createPieChartDash();
        }
      },
    },
    pallet: {
      handler() {
        if (this.dataset.length > 0) {
          this.createPieChartDash();
        }
      },
      deep: true,
    },
  },
  mounted() {
    const rect = this.$refs.VisualizationPieChart.getBoundingClientRect()
    this.panelSize =  {
      width: rect.width,
      height: rect.height,
    }
  },
  methods: {
    setLegendPosition(value) {
      if (value !== '') {
        this.positionLegend = value;
      }
    },
    setIsShowLegend(value = true) {
      this.isShowLegend = typeof value === 'boolean' ? value : true;
    },
    setPanelSize(panelSize) {
      this.panelSize = panelSize
    },
    setTitle(text = '') {
      this.title = text;
    },

    setColValue(key="count"){
      this.colValue = key;
    },

    setColLineLabel(key="label"){
      this.label=key;
    },
    setDataset(data = []) {
      this.dataset = data;
        this.createPieChartDash();

    },
    setColorPallet(pallet) {
      this.pallet = pallet
    },
    legendSize() {
      if (this.$refs.legends.getBoundingClientRect().width !== 0 && this.legends.length > 0) {
        return {
          width: Math.round(
            this.$refs.legends.getBoundingClientRect().width,
          ),
          height: Math.round(
            this.$refs.legends.getBoundingClientRect().height,
          ),
        };

      }
      return {
        width: 0,
        height: 0,
      };
    },
    calculatedSize(legendSize) {
      const MARGIN = 40; // отступ от контейнера
      let width = this.panelSize.width - MARGIN; // отступ по бокам
      let height = this.panelSize.height - MARGIN - 3; // минус шапка
     if (this.isShowLegend) {
       switch (this.positionLegend) {
         case 'right':
           this.positionLegends = 'row nowrap';
           width -= legendSize.width;
           break;

         case 'left':
           this.positionLegends = 'row-reverse nowrap';
           width -= legendSize.width;
           break;

         case 'top':
           this.positionLegends = 'column-reverse nowrap';
           height = height - legendSize.height;
           break;

         case 'bottom':
           this.positionLegends = 'column nowrap';
           height = height - legendSize.height;
           break;
         default:
           break;
       }
     }

      return {
        width,
        height,
      };
    },
    setError(text = '', show = false) {
      this.errorMessage = text;
      this.isDataError = show;
    },
    createPieChartDash(legendSize) {
        // смотрим если с ошибкой
      if (this.dataset.error) {
        // то выводим сообщение о ошибке
        this.setError(this.dataset.error, true);
      }
      const { isValid, error } = this.validateData;

    this.$nextTick(() => {
    this.$nextTick(() => {
      if (!isValid) {
        this.setError(error, true);
      } else {
        this.setError('', false);
      }
      if (isValid && this.pallet.length > 0) {
        // если все-таки число
        if (typeof this.dataset[0]?.[this.colValue] === 'number') {
          // то убираем соощение о отсутствии данных
          // если элемнетов больше 20
          if (this.dataset.length > 20) {
            // показываем сообщение о некорректности данных
            this.legends = [];
            // выводим сообщение
            const error = 'К сожалению данных слишком много для построения диаграммы';
            this.setError(error, true);
            // и еще график очищаем, чтобы не мешался
            this.piechart.removePiechart();
          } else {
              this.createLegend(this.dataset, this.isShowLegend);
            this.$nextTick(() => {
              if (this.legends.length > 0) {
                // и собственно создаем график
                this.createPieChart(
                  this.dataset,
                  this.dashSize,
                  legendSize || this.legendSize(),
                );

              } else {
                this.$nextTick(() => {
                  // и собственно создаем график
                  this.createPieChart(
                    this.dataset,
                    this.dashSize,
                    { width: 0, height: 0 },
                  );
                });
              }
            })
          }
        } else {
          // если первое значение первого элемнета (подразумеваем что это time не число)
          const error = 'К сожалению данные не подходят к диаграмме'; // выводим сообщение
          this.setError(error, true);
          this.legends = [];
          this.piechart?.removePiechart(); // и еще график очищаем, чтобы не мешался
        }
      }
    })
    })

    },

    createLegend(data, showlegend) {
      this.legends = [];
      if (showlegend) {
        const colors = this.pallet;
        data.forEach((item, i) => {
          this.legends.push({
            color: colors[i % colors.length],
            label: `${item[this.label]}`,
          });
        });
      }
    },

    createPieChart(
      dataFrom,
      sizeLine,
      legendSize,
    ) {

      // создает диаграмму
      if (this.piechart) {
        this.piechart.removePiechart();
        this.piechart = null
      }
      const { width, height } = this.calculatedSize(legendSize);

      const data = {};

      dataFrom.forEach((item) => {
        data[item[this.label]] = item[this.colValue];
      });


      const piechart = new PiechartClass({
        elem: this.$refs.piechartItself,
        elemForLegend: this.$refs.legends,
        width,
        height,
        data,
        colors: this.pallet,
        isDonat: this.isDonat,
      });
      this.piechart = Object.freeze(piechart);
    },
  },
};
</script>

<style lang="scss" scoped>
.VisualizationPieChart {
  width: 100%;
  height: 100%;
  .DataError {
    position: absolute;
    display: flex;
    width: 100%;
    height: 100%;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    color: var(--text_secondary);
    background-color: var(--background_main);

    .Icon {
      color: var(--border_secondary);
      font-size: 100px;
      margin-bottom: 8px;
    }
  }
  .title {
    font-weight: 600;
    font-size: 15px;
    line-height: 18px;
    padding: 10px;
  }
  .piechart-block {
    height: 100%;
  }
  .piechart-legend-block {
    display: flex;
    justify-content: flex-start;
    align-items: center;

    .dash-piechart {
      .piepart {
        transition: all 0.3s ease;
        cursor: pointer;
      }
      path {
        stroke: var(main_bg);
      }
      .piepartSelect {
        transform: scale(1.07);
      }
    }
    .legend-block-pie {
      display: flex;
      &__vertically {
        flex-flow: row wrap;
        justify-content: flex-start;
        height: 100%;
        writing-mode: vertical-lr;
      }
      &__horizontally {
        flex-wrap: wrap;
      }
      .legend-line {
        writing-mode: lr;
        display: flex;
        flex-flow: row nowrap;
        padding: 5px;
        cursor: pointer;
        align-items: center;


        .square {
          width: 10px;
          height: 10px;
          margin-right: 10px;
        }
        .text {
          font-style: normal;
          font-weight: 400;
          font-size: 13px;
          white-space: nowrap;
        }
      }
      .legend-line_hover {
        background-color: var(secondary_bg);
        border-radius: 3px;
      }
      .legend-line_selected {
        padding: 4px;
        border: 1px solid var(main_text);
        border-radius: 3px;
      }
    }
  }
}

</style>
