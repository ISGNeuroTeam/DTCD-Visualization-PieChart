import pluginMeta from './Plugin.Meta';
import PluginComponent from './PluginComponent.vue';

import { PanelPlugin } from './../../DTCD-SDK';

export class VisualizationText extends PanelPlugin {

  static getRegistrationMeta() {
    return pluginMeta;
  }

  constructor(guid, selector) {
    super();

    const { default: VueJS } = this.getDependence('Vue');

    const view = new VueJS({
      data: () => ({}),
      render: h => h(PluginComponent),
    }).$mount(selector);
  }

  setPluginConfig(config = {}) {

  }

  getPluginConfig() {

  }

  setFormSettings(config) {

  }

  getFormSettings() {

  }

}
