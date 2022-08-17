import pluginMeta from './Plugin.Meta';
import PluginComponent from './PluginComponent.vue';

import {
  PanelPlugin,
  LogSystemAdapter,
  EventSystemAdapter,
  DataSourceSystemAdapter,
  StorageSystemAdapter,
  StyleSystemAdapter,
} from './../../DTCD-SDK';

export class VisualizationText extends PanelPlugin {

  #id;
  #guid;
  #logSystem;
  #eventSystem;
  #storageSystem;
  #dataSourceSystem;
  #dataSourceSystemGUID;
  #styleSystem;
  #vueComponent;

  #config = {
    title: '',
    targetName: 'План',
    colValue: 'count',
    label: 'label',
    dataSource: '',
    isShowLegend: true,
    positionLegend: '',
  };

  static getRegistrationMeta() {
    return pluginMeta;
  }

  constructor(guid, selector) {
    super();

    this.#id = `${pluginMeta.name}[${guid}]`;
    this.#guid = guid;
    this.#logSystem = new LogSystemAdapter('0.5.0', guid, pluginMeta.name);
    this.#eventSystem = new EventSystemAdapter('0.4.0', guid);
    this.#eventSystem.registerPluginInstance(this);
    this.#storageSystem = new StorageSystemAdapter('0.5.0');
    this.#dataSourceSystem = new DataSourceSystemAdapter('0.2.0');
    this.#styleSystem = new StyleSystemAdapter('0.7.0')

    this.#dataSourceSystemGUID = this.getGUID(
      this.getSystem('DataSourceSystem', '0.2.0')
    );

    const { default: VueJS } = this.getDependence('Vue');

    const view = new VueJS({
      data: () => ({}),
      render: h => h(PluginComponent),
    }).$mount(selector);

    this.#vueComponent = view.$children[0];

    this.setColorPallet()

    this.#logSystem.debug(`${this.#id} initialization complete`);
    this.#logSystem.info(`${this.#id} initialization complete`);

  }

  setColorPallet() {
    const currentTheme = this.#styleSystem.getCurrentTheme()
    const colorsNames = ['aero', 'navi', 'brown', 'orange', 'yellow', 'mint', 'teal', 'cyan', 'indigo', 'purple', 'pink']
    const pallet = colorsNames.reduce((acc, color) => {
      return [
        ...acc,
        currentTheme.styleVariables[color]
      ]
    }, [])
    this.#vueComponent.setColorPallet(pallet);
  }

  loadData(data) {
    this.#vueComponent.setDataset(data);
  }

  processDataSourceEvent(eventData) {
    const { dataSource, status } = eventData;
    const data = this.#storageSystem.session.getRecord(dataSource);
    this.#logSystem.debug(
      `${this.#id} process DataSourceStatusUpdate({ dataSource: ${dataSource}, status: ${status} })`
    );
    this.loadData(data);
  }

  setPluginConfig(config = {}) {
    this.#logSystem.debug(`Set new config to ${this.#id}`);
    this.#logSystem.info(`Set new config to ${this.#id}`);

    const configProps = Object.keys(this.#config);

    for (const [prop, value] of Object.entries(config)) {
      if (!configProps.includes(prop)) continue;

      if (prop === 'isShowLegend') {
        this.#vueComponent.setIsShowLegend(value);
      }
      if (prop === 'positionLegend') {
        this.#vueComponent.setLegendPosition(value);
      }

      if (prop === 'title') this.#vueComponent.setTitle(value);
      if (prop === 'colValue') this.#vueComponent.setColValue(value);
      if (prop === 'label') this.#vueComponent.setColLineValue(value);


      if (prop === 'dataSource' && value) {
        if (this.#config[prop]) {
          this.#logSystem.debug(
            `Unsubscribing ${this.#id} from DataSourceStatusUpdate({ dataSource: ${this.#config[prop]}, status: success })`
          );
          this.#eventSystem.unsubscribe(
            this.#dataSourceSystemGUID,
            'DataSourceStatusUpdate',
            this.#guid,
            'processDataSourceEvent',
            { dataSource: this.#config[prop], status: 'success' },
          );
        }

        const dsNewName = value;

        this.#logSystem.debug(
          `Subscribing ${this.#id} for DataSourceStatusUpdate({ dataSource: ${dsNewName}, status: success })`
        );

        this.#eventSystem.subscribe(
          this.#dataSourceSystemGUID,
          'DataSourceStatusUpdate',
          this.#guid,
          'processDataSourceEvent',
          { dataSource: dsNewName, status: 'success' },
        );

        const ds = this.#dataSourceSystem.getDataSource(dsNewName);

        if (ds && ds.status === 'success') {
          const data = this.#storageSystem.session.getRecord(dsNewName);
          this.loadData(data);
        }
      }

      this.#config[prop] = value;
      this.#logSystem.debug(`${this.#id} config prop value "${prop}" set to "${value}"`);
    }
  }

  getPluginConfig() {
    return { ...this.#config };
  }

  setFormSettings(config) {
    this.setPluginConfig(config);
  }

  getFormSettings() {
    return {
      fields: [
        {
          component: 'title',
          propValue: 'Общие настройки',
        },
        {
          component: 'title',
          propValue: 'Источник данных',
        },
        {
          component: 'datasource',
          propName: 'dataSource',
          attrs: {
            label: 'Выберите источник данных',
            placeholder: 'Выберите значение',
            required: true,
          },
        },
        {
          component: 'text',
          propName: 'title',
          attrs: {
            label: 'Заголовок',
          },
        },
        {
          component: 'text',
          propName: 'colValue',
          attrs: {
            label: 'Имя колонки со значениями',
            propValue: 'count',
          },
        },
        {
          component: 'text',
          propName: 'label',
          attrs: {
            label: 'Имя колонки c подписью',
            propValue: 'label',
          },
        },
        {
          component: 'switch',
          propName: 'isShowLegend',
          attrs: {
            label: 'Скрыть/отобразвить вкладки',
            propValue: true,
          },
        },
        {
          component: 'select',
          propName: 'positionLegend',
          attrs: {
            label: 'Позиция легенды',
            propValue: '',
          },
          options: [
            { value: 'left', label: 'Слева' },
            { value: 'right', label: 'Справа' },
            { value: 'top', label: 'Вверху' },
            { value: 'bottom', label: 'Внизу' },
          ],
        },
      ],
    };
  }

}
